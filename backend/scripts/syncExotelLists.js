#!/usr/bin/env node

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Tenant = require("../src/models/tenantModel");
const List = require("../src/models/listModel");
const { createExotelClient } = require("./utils/exotelClient");

dotenv.config();

function getTenantIdFromArgs() {
  const tenantObjectId = process.argv[2];

  if (!tenantObjectId) {
    throw new Error(
      "Missing tenantObjectId. Usage: node scripts/syncExotelLists.js <tenantObjectId>",
    );
  }

  if (!mongoose.Types.ObjectId.isValid(tenantObjectId)) {
    throw new Error(
      "Invalid tenantObjectId. Please provide a valid Mongo ObjectId.",
    );
  }

  return tenantObjectId;
}

function getListSid(remoteList) {
  if (!remoteList || typeof remoteList !== "object") return "";

  // Exotel docs use "id", but keep fallbacks for API shape changes.
  const sid = remoteList.id || remoteList.sid || remoteList.list_sid;
  return sid ? String(sid) : "";
}

async function fetchExotelLists(exotelClient) {
  let offset = 0;
  const limit = 100;
  const allLists = [];

  while (true) {
    const data = await exotelClient.request(
      `/lists?offset=${offset}&limit=${limit}`,
      { method: "GET" },
    );

    const records = Array.isArray(data.response) ? data.response : [];
    const successfulLists = records
      .filter((record) => record && record.status === "success" && record.data)
      .map((record) => record.data);

    allLists.push(...successfulLists);

    const metadata = data.metadata || {};
    const total = Number(metadata.total);
    const currentOffset = Number(metadata.offset);
    const currentLimit = Number(metadata.limit || limit);
    const hasPaginationInfo =
      Number.isFinite(total) &&
      Number.isFinite(currentOffset) &&
      Number.isFinite(currentLimit);

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

function buildBulkUpsertOperations(tenantObjectId, remoteLists) {
  return remoteLists
    .map((remoteList) => {
      const exotelSid = getListSid(remoteList);
      const name = remoteList?.name ? String(remoteList.name) : "";

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
              tag: remoteList?.tag || "",
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

async function run() {
  const tenantObjectId = getTenantIdFromArgs();
  await connectDB();

  const tenant = await Tenant.findById(tenantObjectId);
  if (!tenant) {
    throw new Error(`Tenant not found for id: ${tenantObjectId}`);
  }

  const exotelClient = createExotelClient(tenant);
  console.log(`List sync started for tenant: ${tenant.name} (${tenantObjectId})`);

  const remoteLists = await fetchExotelLists(exotelClient);
  console.log(`Fetched ${remoteLists.length} lists from Exotel`);

  if (!remoteLists.length) {
    console.log("No lists found on Exotel. Nothing to sync.");
    return;
  }

  const operations = buildBulkUpsertOperations(tenantObjectId, remoteLists);
  if (!operations.length) {
    console.log("No valid lists to write after mapping. Nothing to sync.");
    return;
  }

  const result = await List.bulkWrite(operations, { ordered: false });
  const upserted = result.upsertedCount || 0;
  const modified = result.modifiedCount || 0;
  const matched = result.matchedCount || 0;

  console.log(
    `List sync complete. Upserted: ${upserted}, Modified: ${modified}, Matched: ${matched}`,
  );
}

run()
  .catch((error) => {
    console.error("List sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error("Failed to close DB connection:", error.message);
    }
  });
