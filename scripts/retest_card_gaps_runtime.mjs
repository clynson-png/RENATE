import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const priorPath = path.join(root, 'docs/beta-offline/QA_PRESENTATION_REGRESSION_2026-11-08.json');
const prior = JSON.parse(fs.readFileSync(priorPath, 'utf8'));
const knownMissing = prior.combined.groups.flatMap((group) => group.failures
  .filter((failure) => failure.reasons.includes('APPLICABLE_CARD_NOT_PRESENTED'))
  .map((failure) => ({ ...failure, group: group.name })));
if (knownMissing.length !== 17) throw new Error(`Esperados 17 casos históricos de card ausente; encontrados ${knownMissing.length}.`);

const expectedCard = (atlasId) => {
  if (atlasId === 'CBTE:CBTE-ARB-006:A03') return 'cbte.cma.10m:qualification';
  if (atlasId.startsWith('ISSF:ISSF-') && atlasId !== 'ISSF:ISSF-268:A01') return 'ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1';
  if (atlasId === 'ISSF:ISSF-268:A01') return 'ISSF_MOVING_TARGET_SLING_RULE_V1';
  if (atlasId === 'WSPS:WSPS-SRC-181:A01') return 'WSPS_PARATRAP_ADAPTIVE_SUPPORT_V1';
  if (/^WSPS:WSPS-SRC-(201|202|204):A01$/.test(atlasId)) return 'WSPS_PROGRAM_OF_EVENTS_V1';
  if (atlasId === 'RENATE:CMP-RIMFIRE:001:A01') return 'cbte.cmp.rimfire_sporter:qualification';
  throw new Error(`Sem card esperado registrado para ${atlasId}.`);
};

const server = await createServer({ configFile: path.join(root, 'vite.config.js'), root, server: { host: '127.0.0.1', port: 0, strictPort: false } });
const browser = await chromium.launch({ headless: true });
try {
  await server.listen();
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Não foi possível iniciar Vite para o reteste focado.');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url());
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  const cases = knownMissing.map((item) => ({ atlasId: item.atlasId, group: item.group, expectedCardId: expectedCard(item.atlasId) }));
  const results = await page.evaluate(async (cases) => {
    const [clientModule, atlasResponse] = await Promise.all([
      import('/src/atlasSearchClient.js'), fetch('/renate-pack/atlas.jsonl'),
    ]);
    if (!atlasResponse.ok) throw new Error(`Pacote Atlas HTTP ${atlasResponse.status}.`);
    const rows = (await atlasResponse.text()).trim().split(/\r?\n/).map((line) => JSON.parse(line));
    const rowById = new Map(rows.map((row) => [row.atlas_id, row]));
    const client = clientModule.createAtlasSearchClient();
    const ready = await client.initialize();
    const output = [];
    for (const item of cases) {
      const row = rowById.get(item.atlasId);
      const response = row ? await client.search({ question: row.question }) : null;
      const cards = (response?.cards ?? []).map((card) => card.cardId);
      output.push({
        ...item,
        question: row?.question ?? null,
        status: response?.result?.status ?? null,
        selectedAtlasId: response?.result?.record?.atlasId ?? null,
        cards,
        expectedCardPresented: cards.includes(item.expectedCardId),
      });
    }
    client.close();
    return { readyCount: ready.count, results: output };
  }, cases);
  const report = {
    state: results.results.every((item) => item.expectedCardPresented) && externalRequests.length === 0 ? 'PASS' : 'FAIL',
    generatedAt: new Date().toISOString(),
    scope: 'Reteste runtime focado dos 17 casos que falharam por card ausente no relatório anterior; perguntas originais do Atlas; sem forçar ID selecionado.',
    priorRegression: path.relative(root, priorPath).replaceAll('\\', '/'),
    expectedCases: 17,
    readyCount: results.readyCount,
    passed: results.results.filter((item) => item.expectedCardPresented).length,
    failed: results.results.filter((item) => !item.expectedCardPresented).length,
    externalRequests: [...new Set(externalRequests)],
    results: results.results,
  };
  const outputPath = path.join(root, 'docs/beta-offline/CARD_GAP_RUNTIME_RETEST_2026-11-08.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ state: report.state, expectedCases: report.expectedCases, passed: report.passed, failed: report.failed, readyCount: report.readyCount, externalRequests: report.externalRequests.length, output: path.relative(root, outputPath) }, null, 2));
  await context.close();
  if (report.state !== 'PASS') process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
