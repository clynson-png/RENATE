import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const port = 4174;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
  windowsHide: true,
});
let browser;

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Local Vite preview did not become ready.');
}

try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  let payload;
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: "window.turnstile={render:(el,opts)=>{setTimeout(()=>opts.callback('synthetic-turnstile-token'),0);return 'test-widget'},remove:()=>{},reset:()=>{}};" });
  });
  await page.route('**/functions/v1/renate-lead-registration', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true }) });
  });

  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nome completo').fill('RENATE Interface Test');
  await page.getByLabel('E-mail').fill('renate.interface.test@example.invalid');
  await page.getByLabel('Telefone com DDD').fill('+5500000000000');
  assert.equal(await page.locator('form input').count(), 3, 'Form should contain exactly three input fields.');
  assert.equal(await page.locator('input[type="checkbox"]').count(), 0, 'Consent checkbox should be absent.');
  await page.getByRole('status').getByText('Verificação concluída.').waitFor();
  await page.getByRole('button', { name: 'Continuar para instalar' }).click();
  await page.getByRole('heading', { name: 'Instale o RENATE' }).waitFor();
  assert.deepEqual(Object.keys(payload).sort(), ['email', 'full_name', 'phone', 'turnstile_token']);
  assert.equal(payload.turnstile_token, 'synthetic-turnstile-token');
  assert.equal(payload.email, 'renate.interface.test@example.invalid');

  console.log(JSON.stringify({ formFields: 3, consentCheckbox: 'absent', leadFields: ['email', 'full_name', 'phone'], captchaTokenSentOnlyToFunction: true, registrationToInstall: 'PASS', network: 'intercepted; no lead written' }));
  await context.close();
} finally {
  await browser?.close();
  server.kill();
}
