const Tenant = require('../models/tenantModel');
const exotelService = require('./exotelService');

/**
 * Sync a single contact payload to Exotel and return the resulting SID.
 * Throws on tenant config issues or sync errors.
 *
 * @param {import('mongoose').Types.ObjectId|string} tenantId
 * @param {{
 *   phone_no: string,
 *   first_name: string,
 *   last_name?: string,
 *   email?: string,
 *   tag?: string,
 * }} contact
 * @returns {Promise<string|null>}
 */
async function syncSingleContact(tenantId, contact) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found for Exotel sync');
  }

  const syncRes = await exotelService.syncContacts(tenant, [contact]);
  const contactResponse = syncRes?.response?.[0];

  if (contactResponse?.status === 'success') {
    return contactResponse?.data?.sid || null;
  }

  if (contactResponse) {
    const reason = contactResponse.error_data
      ? JSON.stringify(contactResponse.error_data)
      : 'Unknown Exotel sync error';
    throw new Error(`Exotel sync failed: ${reason}`);
  }

  throw new Error('Exotel sync failed: Invalid response structure');
}

/**
 * Update a single existing Exotel contact by SID and return resulting SID.
 * Throws on tenant config issues or Exotel update errors.
 *
 * @param {import('mongoose').Types.ObjectId|string} tenantId
 * @param {string} contactSid
 * @param {{
 *   phone_no: string,
 *   first_name: string,
 *   last_name?: string,
 *   email?: string,
 *   tag?: string,
 * }} contact
 * @returns {Promise<string|null>}
 */
async function updateSingleContact(tenantId, contactSid, contact) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found for Exotel sync');
  }

  const updateRes = await exotelService.updateContact(tenant, contactSid, contact);
  const payload = updateRes?.data;

  // Common Exotel structure: { response: [{ status: "success", data: {...} }] }
  const contactResponse = payload?.response?.[0];
  if (contactResponse?.status === 'success') {
    return contactResponse?.data?.sid || contactSid || null;
  }
  if (contactResponse?.status === 'failed') {
    const reason = contactResponse.error_data
      ? JSON.stringify(contactResponse.error_data)
      : 'Unknown Exotel update error';
    throw new Error(`Exotel update failed: ${reason}`);
  }

  // Alternate success structures or empty 2xx responses
  const possibleSid =
    payload?.sid ||
    payload?.contact_sid ||
    payload?.data?.sid ||
    payload?.contact?.sid ||
    contactSid ||
    null;
  if (updateRes?.ok === true) {
    return possibleSid;
  }

  throw new Error('Exotel update failed');
}

module.exports = {
  syncSingleContact,
  updateSingleContact,
};
