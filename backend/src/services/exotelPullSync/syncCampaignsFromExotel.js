const Tenant = require('../../models/tenantModel');
const { createExotelClient } = require('../../../scripts/utils/exotelClient');
const { fetchExotelCampaigns, buildReferencesBySid, upsertCampaigns } = require('./campaignPullHelpers');

/**
 * @param {import('mongoose').Types.ObjectId|string} tenantObjectId
 */
async function syncCampaignsFromExotel(tenantObjectId) {
  const tenant = await Tenant.findById(tenantObjectId);
  if (!tenant) {
    throw new Error(`Tenant not found for id: ${tenantObjectId}`);
  }

  const exotelClient = createExotelClient(tenant);
  const remoteCampaigns = await fetchExotelCampaigns(exotelClient);

  remoteCampaigns.forEach((c, i) => {
    console.log(`[EXOTEL_CAMPAIGN_REMOTE][${i + 1}/${remoteCampaigns.length}]`, JSON.stringify(c));
  });

  if (!remoteCampaigns.length) {
    return {
      fetched: 0,
      message: 'No campaigns found on Exotel.',
    };
  }

  const refs = await buildReferencesBySid(tenantObjectId);
  const stats = await upsertCampaigns(tenantObjectId, remoteCampaigns, refs);

  return {
    fetched: remoteCampaigns.length,
    ...stats,
  };
}

module.exports = { syncCampaignsFromExotel };
