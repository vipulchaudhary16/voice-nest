exports.syncContacts = async (tenant, contactsParamsArray) => {
  if (
    !tenant.ivr_data ||
    !tenant.ivr_data.api_key ||
    !tenant.ivr_data.api_token ||
    !tenant.ivr_data.account_sid ||
    !tenant.ivr_data.subdomain
  ) {
    throw new Error(
      'Tenant IVR data is incomplete for Exotel sync. Please configure it in the Admin Panel.'
    );
  }

  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;

  // Maintain backward compatibility in case they paste "@api.exotel.com"
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;

  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/contacts`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  const payload = {
    contacts: contactsParamsArray.map((c) => ({
      number: c.phone_no,
      first_name: c.first_name,
      last_name: c.last_name || undefined,
      email: c.email || undefined,
      tag: c.tag || undefined,
    })),
  };

  console.log(payload);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
};

exports.createList = async (tenant, name, tag) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/lists`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({ lists: [{ name, tag }] }),
  });
  return await response.json();
};

exports.deleteList = async (tenant, listSid) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/lists/${listSid}`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });
};

exports.addContactsToList = async (tenant, listSid, contactSids) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  if (!contactSids.length) return null;

  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/lists/${listSid}/contacts`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({
      contact_references: contactSids.map((sid) => ({ contact_sid: sid })),
    }),
  });
  return await response.json();
};

exports.removeContactFromList = async (tenant, listSid, contactSid) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/lists/${listSid}/contacts/${contactSid}`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });
};

exports.createCampaign = async (tenant, payload) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/campaigns`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({ campaigns: [payload] }),
  });
  return await response.json();
};

exports.deleteCampaign = async (tenant, campaignId) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/campaigns/${campaignId}`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });
};

exports.updateCampaign = async (tenant, campaignId, payload) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) throw new Error('Incomplete IVR Data');
  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/campaigns/${campaignId}`;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({ campaigns: [payload] }),
  });
  const data = await response.json();
  if (data.response && data.response[0] && data.response[0].status === 'failed') {
    throw new Error(data.response[0].error_data?.message || 'Update failed');
  }
  return data;
};

exports.getCampaignCallDetails = async (tenant, campaignId, query = {}) => {
  if (!tenant.ivr_data || !tenant.ivr_data.account_sid) {
    throw new Error('Incomplete IVR Data');
  }

  const { api_key, api_token, account_sid, subdomain } = tenant.ivr_data;
  const cleanSubdomain = subdomain.startsWith('@') ? subdomain.substring(1) : subdomain;
  const authHeader = 'Basic ' + Buffer.from(`${api_key}:${api_token}`).toString('base64');

  const params = new URLSearchParams();
  if (query.offset != null && query.offset !== '') params.set('offset', query.offset);
  if (query.limit != null && query.limit !== '') params.set('limit', query.limit);
  if (query.status != null && query.status !== '') params.set('status', query.status);
  // if (query.sort_by != null && query.sort_by !== "")
  // params.set("sort_by", query.sort_by);

  const queryString = params.toString();
  const endpointSuffix = queryString ? `?${queryString}` : '';
  const url = `https://${cleanSubdomain}/v2/accounts/${account_sid}/campaign/${campaignId}/call-details${endpointSuffix}`;
  console.log('[EXOTEL_CALL_DETAILS] Request URL:', url);
  console.log('[EXOTEL_CALL_DETAILS] API Key:', api_key);
  console.log('[EXOTEL_CALL_DETAILS] API Token:', api_token);
  console.log('[EXOTEL_CALL_DETAILS] Header Authorization:', authHeader);

  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: authHeader },
  });
  console.log('[EXOTEL_CALL_DETAILS] Response status:', response.status, response.statusText);
  const rawBody = await response.text();
  let data = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  if (response.ok) {
    if (!data) {
      throw new Error('Exotel returned non-JSON success response for call details');
    }
    console.log(data);
    return data;
  }

  const message =
    data?.response?.[0]?.error_data?.message ||
    data?.response?.[0]?.error_data?.description ||
    data?.message ||
    (rawBody ? `Exotel returned non-JSON error: ${rawBody.slice(0, 200)}` : null) ||
    'Failed to fetch campaign call details';

  throw new Error(message);
};
