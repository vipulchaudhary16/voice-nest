#!/usr/bin/env node

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { syncListsFromExotel } = require('../src/services/exotelPullSync/syncListsFromExotel');

dotenv.config();

function getTenantIdFromArgs() {
  const tenantObjectId = process.argv[2];

  if (!tenantObjectId) {
    throw new Error(
      'Missing tenantObjectId. Usage: node scripts/syncExotelLists.js <tenantObjectId>'
    );
  }

  if (!mongoose.Types.ObjectId.isValid(tenantObjectId)) {
    throw new Error('Invalid tenantObjectId. Please provide a valid Mongo ObjectId.');
  }

  return tenantObjectId;
}

async function main() {
  const tenantObjectId = getTenantIdFromArgs();
  await connectDB();
  const summary = await syncListsFromExotel(tenantObjectId);
  console.log('List sync result:', summary);
}

main()
  .catch((error) => {
    console.error('List sync failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('Failed to close DB connection:', error.message);
    }
  });
