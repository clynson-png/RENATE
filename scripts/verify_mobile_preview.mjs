import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const state = JSON.parse(fs.readFileSync(path.join(root, '.cache/device-asr-preview/server-state.json'), 'utf8').replace(/^\uFEFF/, ''));
const localManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/manifest.json'), 'utf8'));
const approvals = JSON.parse(fs.readFileSync(path.join(root, 'docs/beta-offline/CARD_HUMAN_APPROVAL_ALL_2026-11-08.json'), 'utf8'));
const origin = `https://${state.lanIp}:${state.appPort}`;
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  const response = await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('form label input[type="password"]', { timeout: 60_000 });
  const served = await page.evaluate(async () => {
    const [manifestResponse, cardsResponse] = await Promise.all([fetch('/renate-pack/manifest.json'), fetch('/renate-pack/cards.json')]);
    const manifest = await manifestResponse.json();
    const catalog = await cardsResponse.json();
    return {
      manifestStatus: manifestResponse.status,
      cardsStatus: cardsResponse.status,
      packageSha256: manifest.packageSha256,
      qnaCount: manifest.counts.atlasQna,
      pdfCount: manifest.counts.pdfs,
      ocrCount: manifest.counts.ocrFiles,
      passageCount: manifest.counts.ruleChunks,
      cardGroups: { standardized: catalog.cards.length, eventEvidence: catalog.eventEvidenceCards.length, equipment: catalog.equipmentCards.length },
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      title: document.title,
    };
  });
  const cards = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/cards.json'), 'utf8'));
  const allCards = [
    ['standardized', cards.cards], ['eventEvidence', cards.eventEvidenceCards], ['equipment', cards.equipmentCards],
  ].flatMap(([catalogGroup, records]) => records.map((card, catalogIndex) => ({ card, catalogGroup, catalogIndex })));
  const approved = new Map(approvals.decisions.map((decision) => [`${decision.catalogGroup}:${decision.catalogIndex}`, decision]));
  const approvalHashesMatch = await Promise.all(allCards.map(async ({ card, catalogGroup, catalogIndex }) => {
    const bytes = new TextEncoder().encode(JSON.stringify(card));
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const decision = approved.get(`${catalogGroup}:${catalogIndex}`);
    return decision?.decision === 'APPROVE' && decision.cardId === card.cardId && decision.contentSha256 === hash;
  }));
  const swResponse = await page.request.get(`${origin}/sw.js`);
  const swText = await swResponse.text();
  const report = {
    state: response?.status() === 200
      && served.manifestStatus === 200 && served.cardsStatus === 200
      && served.packageSha256 === localManifest.packageSha256
      && served.qnaCount === 1104 && Object.values(served.cardGroups).reduce((sum, count) => sum + count, 0) === 138
      && approvalHashesMatch.every(Boolean) && served.documentWidth <= served.viewportWidth
      && swResponse.status() === 200 && externalRequests.length === 0 ? 'PASS' : 'FAIL',
    checkedAt: new Date().toISOString(),
    url: `${origin}/`,
    transport: 'HTTPS on local Wi-Fi; local self-signed certificate accepted by test browser only',
    appHttpStatus: response?.status() ?? null,
    served,
    approvedCurrentCardHashes: { total: approvalHashesMatch.length, matching: approvalHashesMatch.filter(Boolean).length },
    serviceWorker: { status: swResponse.status(), bytes: Buffer.byteLength(swText), localBuildBytes: fs.statSync(path.join(root, 'dist/sw.js')).size },
    externalRequests: [...new Set(externalRequests)],
    note: 'Confirms the LAN URL serves the latest local build and the current card hashes. It does not prove installation, offline reopening, certificate trust, or acceptance on the physical phone.',
  };
  fs.writeFileSync(path.join(root, 'docs/beta-offline/MOBILE_PREVIEW_2026-11-08.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await context.close();
  if (report.state !== 'PASS') process.exitCode = 1;
} finally {
  await browser.close();
}
