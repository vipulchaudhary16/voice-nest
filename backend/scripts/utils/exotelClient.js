function getExotelConfigFromTenant(tenant) {
  if (
    !tenant ||
    !tenant.ivr_data ||
    !tenant.ivr_data.api_key ||
    !tenant.ivr_data.api_token ||
    !tenant.ivr_data.account_sid ||
    !tenant.ivr_data.subdomain
  ) {
    throw new Error(
      "Tenant IVR data is incomplete. Required: api_key, api_token, account_sid, subdomain.",
    );
  }

  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = String(subdomain).startsWith("@")
    ? String(subdomain).slice(1)
    : String(subdomain);

  return { api_key, api_token, account_sid, cleanSubdomain };
}

function createExotelClient(tenant) {
  const { api_key, api_token, account_sid, cleanSubdomain } =
    getExotelConfigFromTenant(tenant);
  const baseUrl = `https://${cleanSubdomain}/v2/accounts/${account_sid}`;
  const authHeader =
    "Basic " + Buffer.from(`${api_key}:${api_token}`).toString("base64");

  async function request(path, options = {}) {
    const { headers = {}, ...restOptions } = options;

    const response = await fetch(`${baseUrl}${path}`, {
      ...restOptions,
      headers: {
        Authorization: authHeader,
        ...headers,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Exotel API failed (${response.status}) ${response.statusText}: ${JSON.stringify(data)}`,
      );
    }

    return data;
  }

  return {
    request,
    baseUrl,
    accountSid: account_sid,
  };
}

module.exports = {
  getExotelConfigFromTenant,
  createExotelClient,
};
