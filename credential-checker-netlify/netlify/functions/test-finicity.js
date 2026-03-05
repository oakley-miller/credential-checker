const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let partnerId, partnerSecret, appKey, env;
  try {
    ({ partnerId, partnerSecret, appKey, env } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!partnerId || !partnerSecret || !appKey) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing credentials' }) };
  }

  // Finicity uses the same endpoint for both sandbox and production,
  // differentiated by the credentials themselves
  const url = 'https://api.finicity.com/aggregation/v2/partners/authentication';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Finicity-App-Key': appKey
      },
      body: JSON.stringify({ partnerId, partnerSecret })
    });

    const data = await response.json().catch(() => ({}));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: response.ok, status: response.status, data }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: error.message }) };
  }
};
