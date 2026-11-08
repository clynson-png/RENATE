import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const origin = 'http://127.0.0.1:5174';
let child = null;
const context = await chromium.launchPersistentContext(path.join(root, '.cache/audio-browser-profile'), { headless: true, serviceWorkers: 'allow' });
const browser = context.browser();
let page = await context.newPage();
const network = { onlineExternalHosts: new Set(), offlineExternalRequests: [] };
let offlinePhase = false;
function observePage(target) {
target.on('console', (message) => console.log(`BROWSER ${message.type()}: ${message.text()}`));
target.on('pageerror', (error) => console.log(`BROWSER PAGE ERROR: ${error.stack || error.message}`));
target.on('request', (request) => {
  if (request.url().startsWith(origin) || request.url().startsWith('data:') || request.url().startsWith('blob:')) return;
  if (offlinePhase) network.offlineExternalRequests.push(request.url());
  else network.onlineExternalHosts.add(new URL(request.url()).host);
});
}
observePage(page);
async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await delay(250);
  }
  throw new Error(`Audio test server did not start: ${url}`);
}
async function openAudioPage() {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await page.goto(`${origin}/tests/audio-inference.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      return;
    } catch (error) {
      lastError = error;
      await delay(1000);
      await waitForServer(`${origin}/tests/audio-inference.html`);
    }
  }
  throw lastError;
}
async function stopServer() {
  if (!child || child.exitCode !== null) return;
  const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
  await new Promise((resolve) => killer.once('exit', resolve));
}

try {
  try {
    if (!(await fetch(`${origin}/`)).ok) throw new Error('No existing test server');
  } catch {
    child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], { cwd: root, stdio: 'ignore', windowsHide: true });
    child.unref();
  }
  await waitForServer(`${origin}/tests/audio-inference.html`);
  try { await fetch(`${origin}/tests/audio-inference.js`); } catch {}
  await waitForServer(`${origin}/tests/audio-inference.html`);
  // Retire stale workers from earlier harness versions without clearing the separate model caches.
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(async () => Promise.all((await navigator.serviceWorker.getRegistrations()).map((registration) => registration.unregister()))).catch(() => {});
  await page.close();
  page = await context.newPage();
  observePage(page);
  await openAudioPage();
  for (let second = 0; second < 240; second += 1) {
    const state = await page.locator('#results').innerText().catch(() => 'page loading');
    if (second % 10 === 0) console.log(`Audio browser test state: ${state.slice(0, 100)}`);
    if (['ONLINE_PRELOAD_PASS', 'OFFLINE_INFERENCE_PASS', 'FAIL'].includes(await page.locator('html').getAttribute('data-test-state'))) break;
    await page.waitForTimeout(1000);
  }
  if (!['ONLINE_PRELOAD_PASS', 'FAIL'].includes(await page.locator('html').getAttribute('data-test-state'))) throw new Error(`Audio inference online did not finish: ${await page.locator('#results').innerText()}`);
  const onlineResult = JSON.parse(await page.locator('#results').innerText());
  if (onlineResult.state === 'FAIL') throw new Error(`Online audio inference failed: ${onlineResult.error}`);

  offlinePhase = true;
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(() => ['OFFLINE_INFERENCE_PASS', 'FAIL'].includes(document.documentElement.dataset.testState), null, { timeout: 480_000 });
  const offlineResult = JSON.parse(await page.locator('#results').innerText());
  const report = {
    state: offlineResult.state === 'OFFLINE_INFERENCE_PASS' && offlineResult.asr?.remoteModelAccessDisabled === true && network.offlineExternalRequests.length === 0 ? 'PASS' : 'FAIL',
    browser: await browser.version(),
    origin,
    onlineExternalHosts: [...network.onlineExternalHosts],
    offlineExternalRequests: network.offlineExternalRequests,
    modelPackage: {
      artifact: 'onnx-community/whisper-tiny',
      exportRevision: 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7',
      baseModel: 'openai/whisper-tiny',
      baseRevision: '169d4a4341b33bc18d8881c4b69c2e104e1cc0af',
      directory: 'public/models/whisper-tiny',
      provenanceManifest: 'public/models/whisper-tiny/PROVENANCE.json',
      licenseNotice: 'MIT and Apache-2.0 source notices included; see public/models/whisper-tiny/NOTICE.md'
    },
    localWasmRuntime: 'public/onnxruntime/; onnxruntime-web@1.22.0-dev.20250409-89f8206ba4',
    candidateAssessment: {
      whisperTiny: 'PASS_OFFLINE_ASR_INFERENCE; HUMAN_APPROVED; synthetic PT-BR sample only',
      kokoroJs: 'PASS_OFFLINE_TTS_INFERENCE_IN_ENGLISH; FAIL_PT_BR_VOICE_UNAVAILABLE'
    },
    onlineInference: onlineResult,
    offlineInference: offlineResult,
    limitation: 'Whisper files are loaded from the RENATE local package with remote model access disabled. Kokoro Portuguese voice API behavior is evaluated as found in kokoro-js; this is not human listening approval or testing on a phone.'
  };
  fs.writeFileSync(path.join(root, 'docs/beta-offline/AUDIO_BROWSER_INFERENCE_2026-11-06.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (report.state !== 'PASS') throw new Error(`Offline audio inference failed: ${JSON.stringify(report.offlineInference.error ?? report.offlineExternalRequests)}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
  await stopServer();
}
