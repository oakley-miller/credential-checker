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

  // Argyle uses HTTP Basic Auth (client_id:client_secret) — no separate token endpoint
  const baseUrl = env === 'prod'
    ? 'https://api.argyle.com/v2'
    : 'https://api-sandbox.argyle.com/v2';

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/users?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    // 200 = valid creds with data access
    // 403 = valid creds but restricted scope (still authenticated)
    // 401 = invalid credentials
    const credentialsValid = response.status === 200 || response.status === 403;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        ok: credentialsValid,
        status: response.status,
        data
      })
    };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: error.message }) };
  }
};
