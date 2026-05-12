const Contact = require('../models/contactModel');
const { syncSingleContact } = require('../services/contactSyncService');
const { syncContactsFromExotel } = require('../services/exotelPullSync/syncContactsFromExotel');
const { syncListsFromExotel } = require('../services/exotelPullSync/syncListsFromExotel');
const { syncCampaignsFromExotel } = require('../services/exotelPullSync/syncCampaignsFromExotel');

const PULL_TARGETS = ['contacts', 'lists', 'campaigns'];
const PULL_ORDER = ['contacts', 'lists', 'campaigns'];

function normalizePullTargets(input) {
  if (input == null) return [];
  const raw = Array.isArray(input) ? input : String(input).split(/[, ]+/);
  return raw
    .map((s) => String(s || '').toLowerCase().trim())
    .filter(Boolean)
    .filter((t, i, a) => a.indexOf(t) === i);
}

async function syncContactEntity(req) {
  const contact = await Contact.findOne({
    _id: req.params.id,
    tenant_id: req.user.tenant_id,
  });
  if (!contact) {
    return { status: 404, body: { success: false, message: 'Contact not found' } };
  }
  if (contact.exotel_sid) {
    return {
      status: 200,
      body: { success: true, data: contact, message: 'Already synced to Exotel' },
    };
  }

  const sid = await syncSingleContact(req.user.tenant_id, {
    phone_no: contact.phone_no,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    tag: contact.tag,
  });

  contact.exotel_sid = sid;
  await contact.save();

  return { status: 200, body: { success: true, data: contact } };
}

const syncHandlers = {
  contacts: syncContactEntity,
};

exports.syncFromExotel = async (req, res, next) => {
  try {
    const fromBody = req.body?.targets ?? req.body?.sync;
    const fromQuery = req.query?.targets;
    const targets = normalizePullTargets(fromBody ?? fromQuery);

    if (!targets.length) {
      return res.status(400).json({
        success: false,
        message: `Provide targets (array or comma-separated): ${PULL_TARGETS.join(', ')}`,
      });
    }

    const unknown = targets.filter((t) => !PULL_TARGETS.includes(t));
    if (unknown.length) {
      return res.status(400).json({
        success: false,
        message: `Unknown targets: ${unknown.join(', ')}`,
      });
    }

    const tenantId = req.user.tenant_id;
    const ordered = PULL_ORDER.filter((t) => targets.includes(t));
    const data = {};

    for (const t of ordered) {
      if (t === 'contacts') {
        data.contacts = await syncContactsFromExotel(tenantId);
      } else if (t === 'lists') {
        data.lists = await syncListsFromExotel(tenantId);
      } else if (t === 'campaigns') {
        data.campaigns = await syncCampaignsFromExotel(tenantId);
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.syncEntityToExotel = async (req, res, next) => {
  try {
    const entityType = String(req.params.entity || '').toLowerCase().trim();
    const handler = syncHandlers[entityType];
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: `Sync type "${entityType}" is not supported yet`,
      });
    }

    const result = await handler(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

