const Tenant = require('../../models/tenantModel');
const Contact = require('../../models/contactModel');
const { createExotelClient } = require('../../../scripts/utils/exotelClient');

async function fetchExotelContacts(exotelClient) {
  let offset = 0;
  const limit = 20;
  const allContacts = [];

  while (true) {
    const data = await exotelClient.request(`/contacts?offset=${offset}&limit=${limit}`, {
      method: 'GET',
    });

    const records = Array.isArray(data.response) ? data.response : [];
    const successfulContacts = records
      .filter((record) => record && record.status === 'success' && record.data)
      .map((record) => record.data);

    allContacts.push(...successfulContacts);

    const metadata = data.metadata || {};
    const total = Number(metadata.total);
    const currentOffset = Number(metadata.offset);
    const currentLimit = Number(metadata.limit || limit);
    const hasPaginationInfo =
      Number.isFinite(total) && Number.isFinite(currentOffset) && Number.isFinite(currentLimit);

    if (hasPaginationInfo) {
      const nextOffset = currentOffset + currentLimit;
      if (nextOffset >= total) break;
      offset = nextOffset;
      continue;
    }

    if (successfulContacts.length < limit) break;
    offset += limit;
  }

  return allContacts;
}

function buildBulkUpsertOperations(tenantObjectId, contacts) {
  return contacts
    .map((contact) => {
      const filter = contact.sid
        ? { tenant_id: tenantObjectId, exotel_sid: contact.sid }
        : { tenant_id: tenantObjectId, phone_no: contact.number };

      if (!filter.phone_no && !filter.exotel_sid) return null;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              phone_no: contact.number || '',
              first_name: contact.first_name || 'Unknown',
              last_name: contact.last_name || '',
              email: contact.email || '',
              tag: contact.tag || '',
              exotel_sid: contact.sid || undefined,
              tenant_id: tenantObjectId,
            },
          },
          upsert: true,
        },
      };
    })
    .filter(Boolean);
}

/**
 * Pull contacts from Exotel into local DB. Uses existing mongoose connection (do not close).
 * @param {import('mongoose').Types.ObjectId|string} tenantObjectId
 */
async function syncContactsFromExotel(tenantObjectId) {
  const tenant = await Tenant.findById(tenantObjectId);
  if (!tenant) {
    throw new Error(`Tenant not found for id: ${tenantObjectId}`);
  }

  const exotelClient = createExotelClient(tenant);
  const exotelContacts = await fetchExotelContacts(exotelClient);

  if (!exotelContacts.length) {
    return {
      fetched: 0,
      upserted: 0,
      modified: 0,
      matched: 0,
      message: 'No contacts found on Exotel.',
    };
  }

  const operations = buildBulkUpsertOperations(tenantObjectId, exotelContacts);
  if (!operations.length) {
    return {
      fetched: exotelContacts.length,
      upserted: 0,
      modified: 0,
      matched: 0,
      message: 'No valid contacts to write after mapping.',
    };
  }

  const result = await Contact.bulkWrite(operations, { ordered: false });
  return {
    fetched: exotelContacts.length,
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
  };
}

module.exports = { syncContactsFromExotel };
