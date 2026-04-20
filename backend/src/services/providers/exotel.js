/**
 * Exotel Provider
 *
 * Handles outbound call initiation via Exotel REST API.
 */

const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

const { sid, apiKey, apiToken, number } = config.exotel;

if (config.exotel.isConfigured) {
  logger.success("Exotel: configured");
} else {
  logger.warn("Exotel: not configured (check EXOTEL_* in .env)");
}

/**
 * Initiate an outbound call via Exotel
 * @param {string} to - Destination phone number
 * @returns {Promise<string>} Call SID
 */
async function makeCall(to) {
  if (!config.exotel.isConfigured) {
    throw new Error("Exotel credentials not configured. Check .env file.");
  }

  const url = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;

  const response = await axios.post(
    url,
    new URLSearchParams({
      From: number,
      To: to,
      Url: `${config.server.publicUrl}/voice`,
      StatusCallback: `${config.server.publicUrl}/status-callback`,
    }),
    {
      auth: { username: apiKey, password: apiToken },
    }
  );

  return response.data?.Call?.Sid || "";
}

/**
 * Check if Exotel is configured
 */
function isConfigured() {
  return config.exotel.isConfigured;
}

module.exports = { makeCall, isConfigured };
