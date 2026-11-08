import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ configFile: path.join(root, 'vite.config.js'), root, server: { host: '127.0.0.1', port: 0, strictPort: false } });
const browser = await chromium.launch({ headless: true });
try {
  await server.listen();
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Não foi possível obter a porta local da regressão.');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto(`${origin}/tests/qa-presentation-regression.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => ['PASS', 'FAIL'].includes(document.documentElement.dataset.testState), null, { timeout: 900_000 });
  const report = JSON.parse(await page.locator('#results').innerText());
  const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
  const orderMarkers = [
    '{message.cards?.length > 0 && <Cards',
    '{message.text && <section className="qa-answer"',
    '{message.questionOptions?.length > 0 && <div className="clarification-options"',
    '<LocalRuleDocuments message={message}/>',
    '<details className="more-passages">',
  ];
  const markerOffsets = orderMarkers.map((marker) => appSource.indexOf(marker));
  const uiOrderPass = markerOffsets.every((offset) => offset >= 0) && markerOffsets.every((offset, index) => index === 0 || offset > markerOffsets[index - 1]);
  if (report.combined) {
    report.combined.uiOrderPass = uiOrderPass;
    report.combined.uiOrder = ['cards', 'Q&A answer or relevant questions', 'local rule links', 'collapsed additional passages'];
    report.combined.uiMarkersFound = markerOffsets.map((offset) => offset >= 0);
    if (!uiOrderPass) report.state = 'FAIL';
    report.combined.state = report.state;
    report.combined.groups.forEach((group) => { if (!uiOrderPass) group.state = 'FAIL'; });
  }
  report.externalRequests = [...new Set(externalRequests)];
  report.zeroExternalRequests = externalRequests.length === 0;
  if (externalRequests.length) report.state = 'FAIL';
  const outputPath = path.join(root, 'docs/beta-offline/QA_RECONCILIATION_RUNTIME_2026-11-08.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ state: report.state, runtime: report.runtime, corpusCount: report.corpusCount, combined: report.combined ? { state: report.combined.state, count: report.combined.count, totals: report.combined.totals, uiOrderPass: report.combined.uiOrderPass, groups: report.combined.groups.map(({ name, state, totals, failureCount }) => ({ name, state, totals, failureCount })) } : null, zeroExternalRequests: report.zeroExternalRequests, output: path.relative(root, outputPath) }, null, 2));
  await context.close();
  if (report.state !== 'PASS') process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
