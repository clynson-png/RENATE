const baseUrl = String(process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const publishableKey = String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
const email = String(process.argv[2] ?? '').trim().toLowerCase();

if (!baseUrl || !publishableKey) throw new Error('Supabase Production environment is not available.');
if (!/^renate\.runtime\.[0-9a-f-]+@example\.invalid$/.test(email)) throw new Error('Pass only the generated synthetic test email.');

const headers = {
  apikey: publishableKey,
  Authorization: `Bearer ${publishableKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};
const endpoint = `${baseUrl}/rest/v1/leads`;
const selector = `?email=eq.${encodeURIComponent(email)}&select=full_name,email,phone`;
const outcomes = {};

const insert = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({ full_name: 'RENATE Runtime Test', email, phone: '+5500000000000' }),
  signal: AbortSignal.timeout(15000),
});
outcomes.insert = insert.status;
if (!insert.ok) throw new Error(`Synthetic INSERT failed with HTTP ${insert.status}.`);

for (const [name, method, body] of [
  ['select', 'GET'],
  ['update', 'PATCH', JSON.stringify({ phone: '+5500000000001' })],
  ['delete', 'DELETE'],
]) {
  const response = await fetch(`${endpoint}${selector}`, {
    method,
    headers,
    ...(body ? { body } : {}),
    signal: AbortSignal.timeout(15000),
  });
  outcomes[name] = response.status;
  if (response.ok) throw new Error(`${name.toUpperCase()} unexpectedly returned HTTP ${response.status}.`);
}

console.log(JSON.stringify({ syntheticInsert: 'PASS', readDenied: 'PASS', updateDenied: 'PASS', deleteDenied: 'PASS', httpStatuses: outcomes }));
