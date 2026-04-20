#!/usr/bin/env node

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Tenant = require("../src/models/tenantModel");
const Contact = require("../src/models/contactModel");
const { createExotelClient } = require("./utils/exotelClient");

dotenv.config();

function getTenantIdFromArgs() {
  const tenantObjectId = process.argv[2];

  if (!tenantObjectId) {
    throw new Error(
      "Missing tenantObjectId. Usage: node scripts/syncExotelContacts.js <tenantObjectId>",
    );
  }

  if (!mongoose.Types.ObjectId.isValid(tenantObjectId)) {
    throw new Error("Invalid tenantObjectId. Please provide a valid Mongo ObjectId.");
  }

  return tenantObjectId;
}

async function fetchExotelContacts(exotelClient) {
  let offset = 0;
  const limit = 20;
  const allContacts = [];

  while (true) {
    const data = await exotelClient.request(
      `/contacts?offset=${offset}&limit=${limit}`,
      { method: "GET" },
    );

    const records = Array.isArray(data.response) ? data.response : [];
    const successfulContacts = records
      .filter((record) => record && record.status === "success" && record.data)
      .map((record) => record.data);

    allContacts.push(...successfulContacts);

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
              phone_no: contact.number || "",
              first_name: contact.first_name || "Unknown",
              last_name: contact.last_name || "",
              email: contact.email || "",
              tag: contact.tag || "",
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

async function run() {
  const tenantObjectId = getTenantIdFromArgs();

  await connectDB();

  const tenant = await Tenant.findById(tenantObjectId);
  if (!tenant) {
    throw new Error(`Tenant not found for id: ${tenantObjectId}`);
  }

  const exotelClient = createExotelClient(tenant);
  console.log(`Sync started for tenant: ${tenant.name} (${tenantObjectId})`);

  const exotelContacts = await fetchExotelContacts(exotelClient);
  console.log(`Fetched ${exotelContacts.length} contacts from Exotel`);

  if (!exotelContacts.length) {
    console.log("No contacts found on Exotel. Nothing to sync.");
    return;
  }

  const operations = buildBulkUpsertOperations(tenantObjectId, exotelContacts);
  if (!operations.length) {
    console.log("No valid contacts to write after mapping. Nothing to sync.");
    return;
  }

  const result = await Contact.bulkWrite(operations, { ordered: false });
  const upserted = result.upsertedCount || 0;
  const modified = result.modifiedCount || 0;
  const matched = result.matchedCount || 0;

  console.log(
    `Sync complete. Upserted: ${upserted}, Modified: ${modified}, Matched: ${matched}`,
  );
}

run()
  .catch((error) => {
    console.error("Sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error("Failed to close DB connection:", error.message);
    }
  });
