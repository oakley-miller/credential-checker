const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let clientId, clientSecret, subscriberId, env;
  try {
    ({ clientId, clientSecret, subscriberId, env } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!clientId || !clientSecret) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing credentials' }) };
  }

  // ⚠️  Update this URL to match the exact Xactus token endpoint in your integration spec
  const url = env === 'prod'
    ? 'https://api.xactus.com/v1/auth/token'
    : 'https://api-sandbox.xactus.com/v1/auth/token';

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  });
  if (subscriberId) bodyParams.append('subscriber_id', subscriberId);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString()
    });

    const data = await response.json().catch(() => ({}));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: response.ok, status: response.status, data }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: error.message }) };
  }
};
