const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let clientId, clientSecret, env;
  try {
    ({ clientId, clientSecret, env } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!clientId || !clientSecret) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing credentials' }) };
  }

  const url = env === 'prod'
    ? 'https://api.argyle.com/v2/token'
    : 'https://api-sandbox.argyle.com/v2/token';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }).toString()
    });

    const data = await response.json().catch(() => ({}));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: response.ok, status: response.status, data }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: error.message }) };
  }
};
