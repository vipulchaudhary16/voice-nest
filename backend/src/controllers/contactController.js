const Contact = require('../models/contactModel');
const List = require('../models/listModel');
const { syncSingleContact, updateSingleContact } = require('../services/contactSyncService');

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildContactListFilter(tenant_id, qRaw, tagRaw, contactIds) {
  const q = qRaw != null ? String(qRaw).trim() : '';
  const tag = tagRaw != null ? String(tagRaw).trim() : '';

  const parts = [{ tenant_id }];

  if (tag) {
    parts.push({ tag: new RegExp(`^${escapeRegex(tag)}$`, 'i') });
  }

  if (q) {
    const needle = escapeRegex(q);
    const re = new RegExp(needle, 'i');
    const or = [{ first_name: re }, { last_name: re }, { email: re }, { phone_no: re }];
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 2) {
      or.push({ phone_no: { $regex: escapeRegex(digits) } });
    }
    parts.push({ $or: or });
  }
  if (Array.isArray(contactIds)) {
    if (contactIds.length === 0) {
      return { tenant_id, _id: { $in: [] } };
    }
    parts.push({ _id: { $in: contactIds } });
  }

  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

/** Case-insensitive sort so pagination matches UI grouping (no duplicate letter sections). */
const CONTACT_LIST_COLLATION = { locale: 'en', strength: 2 };

function buildSortSpec(sortByRaw, sortOrderRaw) {
  const sortBy = String(sortByRaw ?? 'name').trim().toLowerCase();
  const sortOrder = String(sortOrderRaw ?? 'asc').trim().toLowerCase() === 'desc' ? -1 : 1;

  if (sortBy === 'updated_at') {
    return { updatedAt: sortOrder, _id: sortOrder };
  }
  if (sortBy === 'created_at') {
    return { createdAt: sortOrder, _id: sortOrder };
  }
  if (sortBy === 'phone') {
    return { phone_no: sortOrder, _id: sortOrder };
  }
  // default: name sorting
  return { first_name: sortOrder, last_name: sortOrder, _id: sortOrder };
}

exports.getContacts = async (req, res, next) => {
  try {
    let listContactIds = null;
    const listId = req.query.list_id != null ? String(req.query.list_id).trim() : '';
    if (listId) {
      const list = await List.findOne({
        _id: listId,
        tenant_id: req.user.tenant_id,
      }).select({ contacts: 1 });
      if (!list) {
        return res.status(404).json({ success: false, message: 'List not found' });
      }
      listContactIds = Array.isArray(list.contacts) ? list.contacts : [];
    }

    const filter = buildContactListFilter(
      req.user.tenant_id,
      req.query.q,
      req.query.tag,
      listContactIds
    );
    const requestedPage = Number.parseInt(String(req.query.page ?? '1'), 10);
    const requestedLimit = Number.parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const maxLimit = 100000;
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, maxLimit) : 20;
    const skip = (page - 1) * limit;
    const sortSpec = buildSortSpec(req.query.sort_by, req.query.sort_order);

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort(sortSpec).collation(CONTACT_LIST_COLLATION).skip(skip).limit(limit),
      Contact.countDocuments(filter, { collation: CONTACT_LIST_COLLATION }),
    ]);
    const hasMore = skip + contacts.length < total;

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    const lists = await List.find(
      {
        tenant_id: req.user.tenant_id,
        contacts: contact._id,
      },
      { _id: 1, name: 1, tag: 1 }
    ).sort({ updatedAt: -1 });

    const contactData = contact.toObject();
    contactData.belongs_to_lists = lists.map((list) => ({
      _id: list._id,
      name: list.name,
      tag: list.tag,
    }));

    res.status(200).json({ success: true, data: contactData });
  } catch (error) {
    next(error);
  }
};

/** Distinct non-empty tags for filter dropdown (tenant-scoped). */
exports.getContactTags = async (req, res, next) => {
  try {
    const tags = await Contact.distinct('tag', {
      tenant_id: req.user.tenant_id,
      tag: { $nin: [null, ''] },
    });
    const cleaned = [...new Set(tags.map((t) => String(t || '').trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    res.status(200).json({ success: true, data: cleaned });
  } catch (error) {
    next(error);
  }
};

exports.createContact = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone_no, tag, exotel_sid, sync_to_exotel } = req.body;

    if (!phone_no || !phone_no.startsWith('+')) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Phone number must include a country code starting with +',
        });
    }

    let final_sid = exotel_sid;

    if (sync_to_exotel) {
      final_sid = await syncSingleContact(req.user.tenant_id, {
        phone_no,
        first_name,
        last_name,
        email,
        tag,
      });
    }

    const contact = await Contact.create({
      first_name,
      last_name,
      email,
      phone_no,
      tag,
      exotel_sid: final_sid,
      tenant_id: req.user.tenant_id,
    });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    const patch = req.body && typeof req.body === 'object' ? req.body : {};
    const nextPhone = patch.phone_no != null ? String(patch.phone_no).trim() : contact.phone_no;
    const nextFirstName =
      patch.first_name != null ? String(patch.first_name).trim() : contact.first_name;
    const nextLastName = patch.last_name != null ? String(patch.last_name).trim() : contact.last_name;
    const nextEmail = patch.email != null ? String(patch.email).trim() : contact.email;
    const nextTag = patch.tag != null ? String(patch.tag).trim() : contact.tag;

    if (contact.exotel_sid) {
      const syncedSid = await updateSingleContact(req.user.tenant_id, contact.exotel_sid, {
        phone_no: nextPhone,
        first_name: nextFirstName,
        last_name: nextLastName,
        email: nextEmail,
        tag: nextTag,
      });
      contact.exotel_sid = syncedSid || contact.exotel_sid;
    }

    contact.set(patch);
    await contact.save();
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
    });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
