exports.getCallDetails = async (tenant, callSid) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) {
    throw new Error('Incomplete IVR Data');
  }
  if (!callSid) {
    throw new Error('Call SID is required');
  }

  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  //using-v3
  const cleanSubdomain = 'ccm-api.exotel.com'; //subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');
  const url = `https://${cleanSubdomain}/v3/accounts/${account_sid}/calls/${callSid}`;

  console.log('callSid', callSid);

  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: authHeader },
  });

  const rawBody = await response.text();
  let data = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.response?.[0]?.error_data?.message ||
      data?.response?.[0]?.error_data?.description ||
      (rawBody ? `Exotel returned non-JSON error: ${rawBody.slice(0, 200)}` : null) ||
      'Failed to fetch Exotel call details';
    throw new Error(message);
  }

  if (!data) {
    throw new Error('Exotel returned empty call details response');
  }

  return data;
};
