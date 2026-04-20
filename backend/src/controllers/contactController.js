const Contact = require('../models/contactModel');

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildContactListFilter(tenant_id, qRaw, tagRaw) {
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

  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

exports.getContacts = async (req, res, next) => {
  try {
    const filter = buildContactListFilter(req.user.tenant_id, req.query.q, req.query.tag);
    const contacts = await Contact.find(filter).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: contacts });
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
      const Tenant = require('../models/tenantModel');
      const tenant = await Tenant.findById(req.user.tenant_id);

      const exotelService = require('../services/exotelService');
      const syncRes = await exotelService.syncContacts(tenant, [
        {
          phone_no,
          first_name,
          last_name,
          email,
          tag,
        },
      ]);

      if (syncRes && syncRes.response && syncRes.response.length > 0) {
        const contactResponse = syncRes.response[0];
        if (contactResponse.status === 'success') {
          final_sid = contactResponse.data.sid;
        } else {
          return res
            .status(400)
            .json({
              success: false,
              message: 'Exotel Sync Failed: ' + JSON.stringify(contactResponse.error_data),
            });
        }
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'Exotel Sync Failed: Invalid response structure' });
      }
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
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, tenant_id: req.user.tenant_id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
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
