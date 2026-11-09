import assert from 'node:assert/strict';
import test from 'node:test';
import { createHandler } from '../supabase/functions/renate-lead-registration/index.js';

const origin = 'https://renate.example.com';
const env = {
  RENATE_ALLOWED_ORIGINS: origin,
  TURNSTILE_SECRET_KEY: 'test-secret',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-secret',
};
const validPayload = {
  full_name: '  Renate  Teste  ',
  email: 'RENATE.TEST@example.invalid',
  phone: '+55 (11) 90000-0000',
  turnstile_token: 'test-turnstile-token',
};

function request(payload = validPayload, headers = {}) {
  return new Request('https://project.supabase.co/functions/v1/renate-lead-registration', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

function successFetch(calls, insertStatus = 201) {
  return async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('siteverify')) {
      return Response.json({ success: true, action: 'renate_lead', hostname: 'renate.example.com' });
    }
    return new Response(null, { status: insertStatus });
  };
}

test('rejects unapproved origins without contacting external services', async () => {
  let called = false;
  const handler = createHandler({ env, fetchImpl: async () => { called = true; } });
  const response = await handler(request(validPayload, { origin: 'https://attacker.example' }));
  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test('answers an allowed CORS preflight without writing data', async () => {
  const handler = createHandler({ env, fetchImpl: async () => { throw new Error('must not fetch'); } });
  const response = await handler(new Request('https://project.supabase.co/functions/v1/renate-lead-registration', {
    method: 'OPTIONS', headers: { origin },
  }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
});

test('does not insert when Turnstile rejects the token', async () => {
  let insertCalled = false;
  const handler = createHandler({ env, fetchImpl: async (url) => {
    if (String(url).includes('siteverify')) return Response.json({ success: false });
    insertCalled = true;
    return new Response(null, { status: 201 });
  } });
  const response = await handler(request());
  assert.equal(response.status, 400);
  assert.equal(insertCalled, false);
});

test('validates Turnstile server-side and inserts exactly the three contact fields', async () => {
  const calls = [];
  const handler = createHandler({ env, fetchImpl: successFetch(calls) });
  const response = await handler(request());
  assert.equal(response.status, 201);
  assert.deepEqual(calls.map(({ url }) => url), [
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    'https://project.supabase.co/rest/v1/leads',
  ]);
  const verificationBody = new URLSearchParams(calls[0].options.body);
  assert.equal(verificationBody.get('secret'), 'test-secret');
  assert.equal(verificationBody.get('response'), 'test-turnstile-token');
  const inserted = JSON.parse(calls[1].options.body);
  assert.deepEqual(inserted, {
    full_name: 'Renate Teste',
    email: 'renate.test@example.invalid',
    phone: '+55 (11) 90000-0000',
  });
  assert.deepEqual(Object.keys(inserted).sort(), ['email', 'full_name', 'phone']);
  assert.equal(calls[1].options.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
});

test('maps duplicate email to an idempotent success without reading the lead', async () => {
  const calls = [];
  const handler = createHandler({ env, fetchImpl: successFetch(calls, 409) });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, already_registered: true });
});

test('fails closed when server secrets are missing', async () => {
  let called = false;
  const handler = createHandler({ env: { ...env, TURNSTILE_SECRET_KEY: '' }, fetchImpl: async () => { called = true; } });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal(called, false);
});
