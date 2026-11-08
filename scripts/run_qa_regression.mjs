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
  if (!address || typeof address === 'string') throw new Error('Não foi possível obter a porta do servidor local de regressão.');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto(`${origin}/tests/qa-regression.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => ['PASS', 'FAIL'].includes(document.documentElement.dataset.testState), null, { timeout: 600_000 });
  const report = JSON.parse(await page.locator('#results').innerText());
  report.externalRequests = [...new Set(externalRequests)];
  report.zeroExternalRequests = externalRequests.length === 0;
  if (externalRequests.length) report.state = 'FAIL';
  const outputPath = path.join(root, 'docs/beta-offline/QA_REGRESSION_2026-11-08.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ state: report.state, suites: report.groups?.map(({ name, state, totals, failures }) => ({ name, state, totals, failureCount: failures.length })), combined: report.combined ? { state: report.combined.state, count: report.combined.count, workerReadyCount: report.combined.workerReadyCount, selectionMs: report.combined.selectionMs, presentationMs: report.combined.presentationMs } : null, zeroExternalRequests: report.zeroExternalRequests, outputPath: path.relative(root, outputPath) }, null, 2));
  await context.close();
  if (report.state !== 'PASS') process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
