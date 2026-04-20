/**
 * Provider Factory
 *
 * Routes calls to the correct provider (Twilio / Exotel).
 * Single entry point for all outbound call operations.
 */

const twilioProvider = require("./twilio");
const exotelProvider = require("./exotel");
const config = require("../config");

const providers = {
  twilio: twilioProvider,
  exotel: exotelProvider,
};

/**
 * Get a provider by name
 * @param {string} name - "twilio" or "exotel"
 * @returns {object} Provider module with makeCall() and isConfigured()
 */
function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown provider: "${name}". Use "twilio" or "exotel".`);
  }
  return provider;
}

/**
 * Make a call using the specified provider
 * @param {string} to - Destination phone number
 * @param {string} [providerName] - Provider to use (defaults to env config)
 * @returns {Promise<string>} Call SID
 */
async function makeCall(to, providerName = config.defaultProvider) {
  const provider = getProvider(providerName);
  return provider.makeCall(to);
}

/**
 * Get configuration status of all providers
 */
function getStatus() {
  return {
    defaultProvider: config.defaultProvider,
    twilioConfigured: twilioProvider.isConfigured(),
    exotelConfigured: exotelProvider.isConfigured(),
  };
}

module.exports = { makeCall, getProvider, getStatus };
