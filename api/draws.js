const SUPABASE_TABLE = 'lotto_draws';

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function isValidNumbers(numbers) {
  if (!Array.isArray(numbers) || numbers.length !== 6) return false;

  const unique = new Set(numbers);
  return numbers.every((number) => (
    Number.isInteger(number) && number >= 1 && number <= 45
  )) && unique.size === numbers.length;
}

function readBody(request) {
  if (typeof request.body !== 'string') return request.body || {};

  try {
    return JSON.parse(request.body || '{}');
  } catch {
    return null;
  }
}

async function handler(request, response) {
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return sendJson(response, 405, { error: 'POST 요청만 지원합니다.' });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return sendJson(response, 500, {
        error: 'Supabase 환경변수가 설정되지 않았습니다.',
      });
    }

    const body = readBody(request);

    if (!body) {
      return sendJson(response, 400, { error: 'JSON 형식이 올바르지 않습니다.' });
    }

    const numbers = body.numbers;

    if (!isValidNumbers(numbers)) {
      return sendJson(response, 400, {
        error: '1부터 45까지 중복 없는 6개 번호가 필요합니다.',
      });
    }

    const supabaseResponse = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          numbers,
          source: 'vercel',
          user_agent: request.headers['user-agent'] || null,
        }),
      }
    );

    const rawResult = await supabaseResponse.text();
    let result = null;

    try {
      result = rawResult ? JSON.parse(rawResult) : null;
    } catch {
      result = null;
    }

    if (!supabaseResponse.ok) {
      return sendJson(response, supabaseResponse.status, {
        error: result?.message || rawResult || `Supabase HTTP ${supabaseResponse.status}`,
      });
    }

    return sendJson(response, 201, { draw: result?.[0] || null });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || '서버 함수 실행 중 오류가 발생했습니다.',
    });
  }
}

module.exports = handler;
