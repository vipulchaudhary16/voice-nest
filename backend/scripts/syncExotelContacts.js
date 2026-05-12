#!/usr/bin/env node

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { syncContactsFromExotel } = require('../src/services/exotelPullSync/syncContactsFromExotel');

dotenv.config();

function getTenantIdFromArgs() {
  const tenantObjectId = process.argv[2];

  if (!tenantObjectId) {
    throw new Error(
      'Missing tenantObjectId. Usage: node scripts/syncExotelContacts.js <tenantObjectId>'
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
  const summary = await syncContactsFromExotel(tenantObjectId);
  console.log('Sync result:', summary);
}

main()
  .catch((error) => {
    console.error('Sync failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('Failed to close DB connection:', error.message);
    }
  });
