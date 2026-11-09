const baseUrl = String(process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const publishableKey = String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
if (!baseUrl || !publishableKey) throw new Error('Supabase Production environment is not available.');

const syntheticEmail = `renate.direct-denied.${crypto.randomUUID()}@example.invalid`;
const response = await fetch(`${baseUrl}/rest/v1/leads`, {
  method: 'POST',
  headers: {
    apikey: publishableKey,
    Authorization: `Bearer ${publishableKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  },
  body: JSON.stringify({ full_name: 'RENATE Direct REST Denial Test', email: syntheticEmail, phone: '+5500000000000' }),
  signal: AbortSignal.timeout(15000),
});

if (response.ok) {
  throw new Error(`Direct anonymous INSERT unexpectedly succeeded with HTTP ${response.status}; synthetic email ${syntheticEmail} needs administrator cleanup.`);
}
console.log(JSON.stringify({ directAnonymousInsert: 'DENIED_AS_EXPECTED', httpStatus: response.status, syntheticLeadCreated: false }));
