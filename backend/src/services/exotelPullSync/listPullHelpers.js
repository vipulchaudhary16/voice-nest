function getListSid(remoteList) {
  if (!remoteList || typeof remoteList !== 'object') return '';
  const sid = remoteList.id || remoteList.sid || remoteList.list_sid;
  return sid ? String(sid) : '';
}

async function fetchExotelLists(exotelClient) {
  let offset = 0;
  const limit = 100;
  const allLists = [];

  while (true) {
    const data = await exotelClient.request(`/lists?offset=${offset}&limit=${limit}`, {
      method: 'GET',
    });

    const records = Array.isArray(data.response) ? data.response : [];
    const successfulLists = records
      .filter((record) => record && record.status === 'success' && record.data)
      .map((record) => record.data);

    allLists.push(...successfulLists);

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

    if (successfulLists.length < limit) break;
    offset += limit;
  }

  return allLists;
}

async function fetchExotelListContacts(exotelClient, listSid) {
  let offset = 0;
  const limit = 100;
  const allContacts = [];

  while (true) {
    const data = await exotelClient.request(`/lists/${listSid}/contacts?offset=${offset}&limit=${limit}`, {
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

function buildListBulkUpsertOperations(tenantObjectId, remoteLists) {
  return remoteLists
    .map((remoteList) => {
      const exotelSid = getListSid(remoteList);
      const name = remoteList?.name ? String(remoteList.name) : '';

      if (!exotelSid && !name) return null;

      const filter = exotelSid
        ? { tenant_id: tenantObjectId, exotel_sid: exotelSid }
        : { tenant_id: tenantObjectId, name };

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              name: name || `List-${exotelSid}`,
              tag: remoteList?.tag || '',
              exotel_sid: exotelSid || undefined,
              tenant_id: tenantObjectId,
            },
          },
          upsert: true,
        },
      };
    })
    .filter(Boolean);
}

module.exports = {
  getListSid,
  fetchExotelLists,
  fetchExotelListContacts,
  buildListBulkUpsertOperations,
};
