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

  // Truv uses X-Access-Client-Id and X-Access-Secret headers
  const baseUrl = env === 'prod'
    ? 'https://prod.truv.com/v1'
    : 'https://dev.truv.com/v1';

  try {
    const response = await fetch(`${baseUrl}/companies`, {
      method: 'GET',
      headers: {
        'X-Access-Client-Id': clientId,
        'X-Access-Secret': clientSecret,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    // 200 or 403 = credentials recognized; 401 = invalid
    const credentialsValid = response.status === 200 || response.status === 403;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: credentialsValid, status: response.status, data })
    };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: error.message }) };
  }
};
