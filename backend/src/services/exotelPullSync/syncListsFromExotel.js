const Tenant = require('../../models/tenantModel');
const List = require('../../models/listModel');
const Contact = require('../../models/contactModel');
const { createExotelClient } = require('../../../scripts/utils/exotelClient');
const {
  fetchExotelLists,
  fetchExotelListContacts,
  buildListBulkUpsertOperations,
} = require('./listPullHelpers');

async function syncListContactMappings(tenantObjectId, exotelClient) {
  const lists = await List.find({ tenant_id: tenantObjectId }).select('_id exotel_sid name contacts').lean();
  const summary = {
    listsProcessed: 0,
    contactsUpsertedOrUpdated: 0,
    missingListSid: 0,
  };

  for (const list of lists) {
    const listSid = list.exotel_sid ? String(list.exotel_sid) : '';
    if (!listSid) {
      summary.missingListSid += 1;
      continue;
    }

    const remoteContacts = await fetchExotelListContacts(exotelClient, listSid);
    const localContactIds = [];

    for (const remoteContact of remoteContacts) {
      const exotelSid = remoteContact?.sid ? String(remoteContact.sid) : '';
      const phoneNo = remoteContact?.number ? String(remoteContact.number) : '';

      if (!exotelSid && !phoneNo) continue;

      const filter = exotelSid
        ? { tenant_id: tenantObjectId, exotel_sid: exotelSid }
        : { tenant_id: tenantObjectId, phone_no: phoneNo };

      const localContact = await Contact.findOneAndUpdate(
        filter,
        {
          $set: {
            phone_no: phoneNo,
            first_name: remoteContact?.first_name || 'Unknown',
            last_name: remoteContact?.last_name || '',
            email: remoteContact?.email || '',
            tag: remoteContact?.tag || '',
            exotel_sid: exotelSid || undefined,
            tenant_id: tenantObjectId,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      )
        .select('_id')
        .lean();

      if (localContact?._id) {
        localContactIds.push(localContact._id);
      }
    }

    const uniqueContactIds = [...new Set(localContactIds.map((id) => String(id)))];
    await List.updateOne(
      { _id: list._id, tenant_id: tenantObjectId },
      { $set: { contacts: uniqueContactIds } }
    );

    summary.listsProcessed += 1;
    summary.contactsUpsertedOrUpdated += remoteContacts.length;
  }

  return summary;
}

/**
 * @param {import('mongoose').Types.ObjectId|string} tenantObjectId
 */
async function syncListsFromExotel(tenantObjectId) {
  const tenant = await Tenant.findById(tenantObjectId);
  if (!tenant) {
    throw new Error(`Tenant not found for id: ${tenantObjectId}`);
  }

  const exotelClient = createExotelClient(tenant);
  const remoteLists = await fetchExotelLists(exotelClient);

  if (!remoteLists.length) {
    return {
      listsFetched: 0,
      upserted: 0,
      modified: 0,
      matched: 0,
      listContactMapping: null,
      message: 'No lists found on Exotel.',
    };
  }

  const operations = buildListBulkUpsertOperations(tenantObjectId, remoteLists);
  if (!operations.length) {
    return {
      listsFetched: remoteLists.length,
      upserted: 0,
      modified: 0,
      matched: 0,
      listContactMapping: null,
      message: 'No valid lists to write after mapping.',
    };
  }

  const result = await List.bulkWrite(operations, { ordered: false });
  const listContactMapping = await syncListContactMappings(tenantObjectId, exotelClient);

  return {
    listsFetched: remoteLists.length,
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched: result.matchedCount || 0,
    listContactMapping,
  };
}

module.exports = { syncListsFromExotel };
