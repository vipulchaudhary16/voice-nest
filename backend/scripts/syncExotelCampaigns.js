#!/usr/bin/env node

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Tenant = require('../src/models/tenantModel');
const Campaign = require('../src/models/campaignModel');
const Exophone = require('../src/models/exophoneModel');
const List = require('../src/models/listModel');
const { createExotelClient } = require('./utils/exotelClient');

dotenv.config();

function getTenantIdFromArgs() {
  const tenantObjectId = process.argv[2];

  if (!tenantObjectId) {
    throw new Error(
      'Missing tenantObjectId. Usage: node scripts/syncExotelCampaigns.js <tenantObjectId>'
    );
  }

  if (!mongoose.Types.ObjectId.isValid(tenantObjectId)) {
    throw new Error('Invalid tenantObjectId. Please provide a valid Mongo ObjectId.');
  }

  return tenantObjectId;
}

async function fetchExotelCampaigns(exotelClient) {
  let offset = 0;
  const limit = 100;
  const allCampaigns = [];

  while (true) {
    const data = await exotelClient.request(`/campaigns?offset=${offset}&limit=${limit}`, {
      method: 'GET',
    });

    const records = Array.isArray(data.response) ? data.response : [];
    const successfulCampaigns = records
      .filter((record) => record && record.status === 'success' && record.data)
      .map((record) => record.data);

    allCampaigns.push(...successfulCampaigns);

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

    if (successfulCampaigns.length < limit) break;
    offset += limit;
  }

  return allCampaigns;
}

function toDateOrUndefined(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizePhoneNumber(value) {
  if (!value) return '';
  return String(value).replace(/[^\d+]/g, '');
}

async function buildReferencesBySid(tenantObjectId) {
  const [exophones, lists] = await Promise.all([
    Exophone.find({ tenant_id: tenantObjectId }).select('_id phone_no').lean(),
    List.find({ tenant_id: tenantObjectId }).select('_id exotel_sid').lean(),
  ]);

  const exophoneByPhone = new Map();
  for (const exophone of exophones) {
    if (!exophone.phone_no) continue;
    exophoneByPhone.set(normalizePhoneNumber(exophone.phone_no), exophone._id);
  }

  const listByExotelSid = new Map();
  for (const list of lists) {
    if (!list.exotel_sid) continue;
    listByExotelSid.set(String(list.exotel_sid), list._id);
  }

  return { exophoneByPhone, listByExotelSid };
}

async function resolveOrCreateExophone(tenantObjectId, callerId, refs, stats) {
  const normalizedCallerId = normalizePhoneNumber(callerId);
  if (!normalizedCallerId) return null;

  const existingExophoneId = refs.exophoneByPhone.get(normalizedCallerId);
  if (existingExophoneId) return existingExophoneId;

  const created = await Exophone.create({
    phone_no: normalizedCallerId,
    name: `Exotel ${normalizedCallerId}`,
    tenant_id: tenantObjectId,
  });

  refs.exophoneByPhone.set(normalizedCallerId, created._id);
  stats.exophoneCreated += 1;

  return created._id;
}

async function upsertCampaigns(tenantObjectId, remoteCampaigns, refs) {
  const stats = {
    created: 0,
    updated: 0,
    exophoneCreated: 0,
    skippedNoExotelSid: 0,
    skippedNoCallerMapping: 0,
  };

  for (const remoteCampaign of remoteCampaigns) {
    const exotelSid = remoteCampaign.id ? String(remoteCampaign.id) : '';
    if (!exotelSid) {
      stats.skippedNoExotelSid += 1;
      continue;
    }

    const mappedCallerId = await resolveOrCreateExophone(
      tenantObjectId,
      remoteCampaign.caller_id,
      refs,
      stats
    );
    const mappedListIds = Array.isArray(remoteCampaign.lists)
      ? remoteCampaign.lists.map((sid) => refs.listByExotelSid.get(String(sid))).filter(Boolean)
      : [];

    const updatePayload = {
      name: remoteCampaign.name || `Campaign-${exotelSid}`,
      lists: mappedListIds,
      campaign_type: remoteCampaign.campaign_type || 'static',
      flow_type: remoteCampaign.flow_type,
      read_via_text: remoteCampaign.read_via_text,
      url: remoteCampaign.url,
      retries: remoteCampaign.retries || undefined,
      schedule: {
        send_at: toDateOrUndefined(remoteCampaign.schedule?.send_at),
        end_at: toDateOrUndefined(remoteCampaign.schedule?.end_at),
      },
      exotel_sid: exotelSid,
      status: remoteCampaign.status || 'Created',
      tenant_id: tenantObjectId,
    };

    if (!updatePayload.schedule.send_at && !updatePayload.schedule.end_at) {
      delete updatePayload.schedule;
    }

    const existing = await Campaign.findOne({
      tenant_id: tenantObjectId,
      exotel_sid: exotelSid,
    });

    if (!existing) {
      if (!mappedCallerId) {
        stats.skippedNoCallerMapping += 1;
        continue;
      }

      await Campaign.create({
        ...updatePayload,
        caller_id: mappedCallerId,
      });
      stats.created += 1;
      continue;
    }

    existing.name = updatePayload.name;
    existing.lists = updatePayload.lists;
    existing.campaign_type = updatePayload.campaign_type;
    existing.flow_type = updatePayload.flow_type;
    existing.read_via_text = updatePayload.read_via_text;
    existing.url = updatePayload.url;
    existing.retries = updatePayload.retries;
    existing.schedule = updatePayload.schedule;
    existing.status = updatePayload.status;
    existing.tenant_id = updatePayload.tenant_id;
    if (mappedCallerId) {
      existing.caller_id = mappedCallerId;
    }

    await existing.save();
    stats.updated += 1;
  }

  return stats;
}

async function run() {
  const tenantObjectId = getTenantIdFromArgs();
  await connectDB();

  const tenant = await Tenant.findById(tenantObjectId);
  if (!tenant) {
    throw new Error(`Tenant not found for id: ${tenantObjectId}`);
  }

  const exotelClient = createExotelClient(tenant);
  console.log(`Campaign sync started for tenant: ${tenant.name} (${tenantObjectId})`);

  const remoteCampaigns = await fetchExotelCampaigns(exotelClient);
  console.log(`Fetched ${remoteCampaigns.length} campaigns from Exotel`);

  if (!remoteCampaigns.length) {
    console.log('No campaigns found on Exotel. Nothing to sync.');
    return;
  }

  const refs = await buildReferencesBySid(tenantObjectId);
  const result = await upsertCampaigns(tenantObjectId, remoteCampaigns, refs);

  console.log(
    `Campaign sync complete. Created: ${result.created}, Updated: ${result.updated}, ExophonesCreated: ${result.exophoneCreated}, Skipped(no_sid): ${result.skippedNoExotelSid}, Skipped(no_caller_mapping): ${result.skippedNoCallerMapping}`
  );
}

run()
  .catch((error) => {
    console.error('Campaign sync failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('Failed to close DB connection:', error.message);
    }
  });
