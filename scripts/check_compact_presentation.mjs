import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
const golden = readJson('data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json');
const rows = readJsonl('public/renate-pack/atlas.jsonl');
const caseP4 = golden.cases.find((item) => item.expected_resolution === 'MATCH_ATLAS_RECORD' && item.expected_route_ids?.includes('wsps.event.p4'));
const questionRow = rows.find((item) => item.atlas_id === caseP4?.atlas_id);
if (!caseP4 || !questionRow) throw new Error('Caso P4 está ausente do corpus local protegido.');

const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: false } });
const browser = await chromium.launch({ headless: true });
try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Não foi possível obter a porta do preview local.');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('PIN local').fill('123456');
  await page.getByLabel('Confirme o PIN').fill('123456');
  await page.getByRole('button', { name: 'Criar PIN neste dispositivo' }).click();
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="Pergunta"]')?.disabled === false, null, { timeout: 180_000 });
  const input = page.locator('textarea[aria-label="Pergunta"]');
  await input.fill(questionRow.question);
  await input.press('Enter');
  const message = page.locator('.assistant-message').last();
  await message.locator('.qa-answer').waitFor({ timeout: 90_000 });
  await message.locator('.local-card').first().waitFor({ timeout: 30_000 });
  const collapsedState = await message.evaluate((article) => {
    const card = article.querySelector('.local-card');
    const answer = article.querySelector('.qa-answer');
    const questions = article.querySelector('.clarification-options');
    const documents = article.querySelector('.local-rule-documents');
    const details = article.querySelector('details.more-passages');
    const order = [card, answer, questions, documents, details].filter(Boolean).map((node) => node.className || node.tagName.toLowerCase());
    return { order, detailsCollapsed: Boolean(details && !details.open), summary: details?.querySelector('summary')?.textContent.trim() ?? null, rulePassagesInitiallyVisible: Boolean(article.querySelector('.rule-passage')?.checkVisibility()), localRuleLinks: documents?.querySelectorAll('a').length ?? 0 };
  });
  if (!collapsedState.detailsCollapsed || collapsedState.rulePassagesInitiallyVisible || collapsedState.localRuleLinks < 1) throw new Error(`Ordem compacta inicial inválida: ${JSON.stringify(collapsedState)}`);
  if (collapsedState.order[0] !== 'local-card' || collapsedState.order[1] !== 'qa-answer') throw new Error(`Card/Q&A fora da ordem: ${JSON.stringify(collapsedState.order)}`);
  await message.locator('details.more-passages summary').click();
  await message.locator('.rule-passage').first().waitFor({ timeout: 30_000 });
  const expanded = await message.evaluate((article) => ({ detailsOpen: article.querySelector('details.more-passages')?.open === true, passagesVisible: article.querySelectorAll('.rule-passage').length > 0, figureCount: article.querySelectorAll('.rule-figure-crops img').length }));
  const layout = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, pageWidth: document.documentElement.scrollWidth }));
  const report = {
    state: expanded.detailsOpen && expanded.passagesVisible && layout.pageWidth <= layout.viewport && externalRequests.length === 0 ? 'PASS' : 'FAIL',
    browser: await browser.version(),
    view: '390x844 mobile viewport on local production dist',
    caseId: caseP4.case_id,
    atlasId: caseP4.atlas_id,
    questionSha256: caseP4.question_sha256,
    initial: collapsedState,
    afterOpen: expanded,
    layout,
    externalRequests: [...new Set(externalRequests)],
    note: 'Checks only compact UI order and disclosure behavior; not human acceptance or route/Q&A semantic approval.',
  };
  fs.writeFileSync(path.join(root, 'docs/beta-offline/COMPACT_PRESENTATION_2026-11-08.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (report.state !== 'PASS') process.exitCode = 1;
  await context.close();
} finally {
  await browser.close();
  await server.close();
}
