const List = require('../models/listModel');
const Contact = require('../models/contactModel');
const Tenant = require('../models/tenantModel');
const exotelService = require('../services/exotelService');

exports.getLists = async (req, res, next) => {
  try {
    const lists = await List.find({ tenant_id: req.user.tenant_id }).populate('contacts');
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    next(error);
  }
};

exports.createList = async (req, res, next) => {
  try {
    const { name, tag, sync_to_exotel } = req.body;
    let final_sid = null;
    let syncWarning = null;

    if (sync_to_exotel) {
      try {
        const tenant = await Tenant.findById(req.user.tenant_id);
        const syncRes = await exotelService.createList(tenant, name, tag);

        if (syncRes && syncRes.response && syncRes.response.length > 0) {
          if (syncRes.response[0].status === 'success') {
            // Exotel payloads can expose list identifier as sid or id.
            final_sid = syncRes.response[0].data?.sid || syncRes.response[0].data?.id || null;
          } else {
            syncWarning = 'Exotel list sync failed; group created locally.';
          }
        } else {
          syncWarning = 'Exotel list sync returned invalid response; group created locally.';
        }
      } catch (error) {
        syncWarning = 'Exotel list sync failed; group created locally.';
      }
    }

    const list = await List.create({
      name,
      tag,
      exotel_sid: final_sid,
      tenant_id: req.user.tenant_id,
    });
    res.status(201).json({ success: true, data: list, warning: syncWarning });
  } catch (error) {
    next(error);
  }
};

exports.deleteList = async (req, res, next) => {
  try {
    const list = await List.findOne({ _id: req.params.id, tenant_id: req.user.tenant_id });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });

    if (list.exotel_sid) {
      const tenant = await Tenant.findById(req.user.tenant_id);
      try {
        await exotelService.deleteList(tenant, list.exotel_sid);
      } catch (err) {
        console.error('Failed to delete on Exotel:', err.message);
      }
    }

    await list.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.addContactsToList = async (req, res, next) => {
  try {
    const contact_ids = Array.isArray(req.body?.contact_ids) ? req.body.contact_ids : []; // Array of Mongo _ids
    const list = await List.findOne({ _id: req.params.id, tenant_id: req.user.tenant_id });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });

    const contacts = await Contact.find({
      _id: { $in: contact_ids },
      tenant_id: req.user.tenant_id,
    });
    const unsyncedContacts = contacts.filter((contact) => !contact.exotel_sid);
    if (unsyncedContacts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact must be synced to Exotel before adding to a list',
      });
    }
    const exotelSids = contacts.map((c) => c.exotel_sid).filter((sid) => sid);

    if (list.exotel_sid && exotelSids.length > 0) {
      const tenant = await Tenant.findById(req.user.tenant_id);
      await exotelService.addContactsToList(tenant, list.exotel_sid, exotelSids);
    }

    const existingContactIds = list.contacts.map((id) => id.toString());
    const newContactIds = contact_ids.filter((id) => !existingContactIds.includes(id));

    if (newContactIds.length > 0) {
      list.contacts.push(...newContactIds);
      await list.save();
    }

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

exports.removeContactFromList = async (req, res, next) => {
  try {
    const list = await List.findOne({ _id: req.params.id, tenant_id: req.user.tenant_id });
    const contact = await Contact.findOne({
      _id: req.params.contactId,
      tenant_id: req.user.tenant_id,
    });

    if (!list || !contact)
      return res.status(404).json({ success: false, message: 'List or Contact not found' });

    const listSid = String(list.exotel_sid || '').trim();
    const contactSid = String(contact.exotel_sid || '').trim();
    if (listSid && contactSid) {
      const tenant = await Tenant.findById(req.user.tenant_id);
      await exotelService.removeContactFromList(tenant, listSid, contactSid);
    }

    list.contacts = list.contacts.filter((cId) => cId.toString() !== contact._id.toString());
    await list.save();

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
