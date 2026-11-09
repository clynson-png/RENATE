const NAME_MIN = 2;
const NAME_MAX = 160;
const EMAIL_MAX = 254;
const PHONE_MAX = 32;
const MAX_BODY_BYTES = 8192;
const TURNSTILE_ACTION = 'renate_lead';

function json(status, body, origin) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (origin) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-methods'] = 'POST, OPTIONS';
    headers['access-control-allow-headers'] = 'authorization, apikey, content-type, x-client-info';
    headers.vary = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function readAllowedOrigins(env) {
  return String(env.RENATE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function normalizeLead(body) {
  const fullName = String(body?.full_name ?? '').trim().replace(/\s+/g, ' ');
  const email = String(body?.email ?? '').trim().toLowerCase();
  const phone = String(body?.phone ?? '').trim();
  if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) return null;
  if (email.length < 5 || email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (phone.length < 7 || phone.length > PHONE_MAX || !/^[+0-9() .-]+$/.test(phone)) return null;
  return { full_name: fullName, email, phone };
}

export function createHandler({ env, fetchImpl = fetch }) {
  return async function handle(request) {
    const origin = request.headers.get('origin') ?? '';
    const allowedOrigins = readAllowedOrigins(env);
    if (!origin || !allowedOrigins.includes(origin)) return json(403, { ok: false, error: 'origin_not_allowed' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-max-age': '86400',
      vary: 'Origin',
    } });
    if (request.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, origin);

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) return json(413, { ok: false, error: 'request_too_large' }, origin);
    let body;
    try { body = await request.json(); } catch { return json(400, { ok: false, error: 'invalid_request' }, origin); }
    const lead = normalizeLead(body);
    const token = String(body?.turnstile_token ?? '').trim();
    if (!lead || !token || token.length > 2048) return json(400, { ok: false, error: 'invalid_request' }, origin);

    const turnstileSecret = String(env.TURNSTILE_SECRET_KEY ?? '').trim();
    const supabaseUrl = String(env.SUPABASE_URL ?? '').trim().replace(/\/$/, '');
    const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
    if (!turnstileSecret || !supabaseUrl || !serviceRoleKey) return json(503, { ok: false, error: 'service_not_configured' }, origin);

    let verification;
    try {
      const verifyResponse = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: turnstileSecret, response: token }),
        signal: AbortSignal.timeout(8000),
      });
      if (!verifyResponse.ok) return json(502, { ok: false, error: 'verification_unavailable' }, origin);
      verification = await verifyResponse.json();
    } catch {
      return json(502, { ok: false, error: 'verification_unavailable' }, origin);
    }

    const expectedHostnames = allowedOrigins.map((value) => {
      try { return new URL(value).hostname.toLowerCase(); } catch { return ''; }
    });
    if (verification?.success !== true
      || verification.action !== TURNSTILE_ACTION
      || !expectedHostnames.includes(String(verification.hostname ?? '').toLowerCase())) {
      return json(400, { ok: false, error: 'verification_failed' }, origin);
    }

    let insertResponse;
    try {
      insertResponse = await fetchImpl(`${supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      return json(502, { ok: false, error: 'registration_unavailable' }, origin);
    }
    if (insertResponse.status === 409) return json(200, { ok: true, already_registered: true }, origin);
    if (!insertResponse.ok) return json(502, { ok: false, error: 'registration_unavailable' }, origin);
    return json(201, { ok: true }, origin);
  };
}

if (typeof Deno !== 'undefined') {
  Deno.serve(createHandler({ env: new Proxy({}, { get: (_target, key) => Deno.env.get(String(key)) }) }));
}
