import { chromium } from 'playwright';

const origin = process.env.RENATE_PREVIEW_URL || 'https://localhost:4173/';
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const nonLocalRequests = [];
  page.on('request', (request) => {
    const hostname = new URL(request.url()).hostname;
    if (!['localhost', '127.0.0.1', '::1'].includes(hostname) && !hostname.startsWith('192.168.')) nonLocalRequests.push(request.url());
  });

  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('PIN local').fill('482681');
  await page.getByLabel('Confirme o PIN').fill('482681');
  await page.getByRole('button', { name: 'Criar PIN neste dispositivo' }).click();
  await page.waitForFunction(() => {
    const input = document.querySelector('textarea[aria-label="Pergunta"]');
    return input && !input.disabled;
  }, null, { timeout: 180_000 });

  const capabilities = await page.evaluate(() => ({
    secureContext: window.isSecureContext,
    mediaDevices: Boolean(navigator.mediaDevices),
    getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    mediaRecorder: typeof window.MediaRecorder === 'function',
    protocol: window.location.protocol,
  }));
  const serverAddress = new URL(origin);
  serverAddress.protocol = 'http:';
  serverAddress.port = '4174';
  serverAddress.pathname = '/health';
  serverAddress.search = '';
  const healthResponse = await fetch(serverAddress);
  const health = healthResponse.ok ? await healthResponse.json() : null;
  const certificateUrl = new URL('/renate-local.cer', serverAddress);
  const profileUrl = new URL('/renate-local.mobileconfig', serverAddress);
  const [certificateResponse, profileResponse] = await Promise.all([fetch(certificateUrl), fetch(profileUrl)]);
  const profile = profileResponse.ok ? await profileResponse.text() : '';
  const certificateDelivery = {
    health: health?.state ?? null,
    androidCer: certificateResponse.ok && (await certificateResponse.arrayBuffer()).byteLength > 0,
    iphoneProfile: profileResponse.ok && profileResponse.headers.get('content-type')?.includes('application/x-apple-aspen-config') && profile.includes('<string>com.apple.security.root</string>'),
  };
  const report = {
    state: capabilities.secureContext && capabilities.getUserMedia && capabilities.mediaRecorder && nonLocalRequests.length === 0 && certificateDelivery.health === 'RENATE_DEVICE_CERT_SERVER_READY' && certificateDelivery.androidCer && certificateDelivery.iphoneProfile ? 'PASS_LOCAL_PREVIEW_READY' : 'FAIL',
    capabilities,
    certificateDelivery,
    nonLocalRequests,
    humanSpeechCaptured: false,
    note: 'This check verifies runtime readiness only; it does not grant microphone permission or represent human-speech validation.',
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.state !== 'PASS_LOCAL_PREVIEW_READY') process.exitCode = 1;
  await context.close();
} finally {
  await browser.close();
}
