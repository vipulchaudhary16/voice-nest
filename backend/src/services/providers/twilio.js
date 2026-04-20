/**
 * Twilio Provider
 *
 * Handles outbound call initiation via Twilio SDK.
 */

const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;

if (config.twilio.isConfigured) {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
  logger.success('Twilio: configured');
} else {
  logger.warn('Twilio: not configured (check TWILIO_* in .env)');
}

/**
 * Initiate an outbound call via Twilio
 * @param {string} to - Destination phone number (E.164 format)
 * @returns {Promise<string>} Call SID
 */
async function makeCall(to) {
  if (!client) {
    throw new Error('Twilio credentials not configured. Check .env file.');
  }

  const call = await client.calls.create({
    to,
    from: config.twilio.number,
    url: `${config.server.publicUrl}/voice`,
    statusCallback: `${config.server.publicUrl}/status-callback`,
    statusCallbackEvent: ['completed'],
  });

  return call.sid || '';
}

/**
 * Check if Twilio is configured
 */
function isConfigured() {
  return !!client;
}

module.exports = { makeCall, isConfigured };
