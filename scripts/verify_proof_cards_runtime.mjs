import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cardData = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/cards.json'), 'utf8'));
const allCards = [...new Map([
  ...(cardData.cards ?? []),
  ...(cardData.eventEvidenceCards ?? []),
  ...(cardData.equipmentCards ?? []),
].map((card) => [card.cardId, card])).values()];

function routeCode(card) {
  const match = String(card.eventId ?? '').match(/(?:wsps\.event\.([a-z0-9]+)|issf\.event\.(\d+))/i);
  if (!match) return '';
  return match[1] ? match[1].toUpperCase() : match[2];
}

function queryForCard(card) {
  const authority = /wsps/i.test(card.authority ?? '') ? 'WSPS'
    : /issf/i.test(card.authority ?? '') ? 'ISSF'
      : /cbte/i.test(card.authority ?? '') ? 'CBTE' : '';
  const code = routeCode(card);
  const event = card.eventAliases?.[0] ?? card.event ?? card.title ?? card.cardId;
  const identity = [authority, code, event].filter(Boolean).join(' ');
  if (card.category === 'equipment') return `${identity} equipamento dimensões medidas largura comprimento espessura`;
  if (card.category === 'malfunction') return `${identity} falhas admissíveis e não admissíveis`;
  if (card.category === 'event_program') return 'WSPS programa de eventos';
  if (card.phase === 'final') return `${identity} final`;
  if (card.phase === 'qualification') return `${identity} prova qualificação`;
  return `${identity} ${card.phase ?? card.category ?? 'prova'}`;
}

const probes = allCards.map((card) => ({
  query: queryForCard(card),
  expectedCardId: card.cardId,
  eventId: card.eventId ?? null,
  authority: card.authority ?? null,
  category: card.category ?? null,
  phase: card.phase ?? null,
}));

const workerFile = fs.readdirSync(path.join(root, 'dist/assets')).find((file) => /^atlasSearch\.worker-.*\.js$/.test(file));
if (!workerFile) throw new Error('Worker de busca compilado não encontrado em dist/assets.');
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0, strictPort: false } });
const browser = await chromium.launch({ headless: true });

try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Não foi possível iniciar o preview do runtime dos cards.');
  const origin = `http://127.0.0.1:${address.port}`;
  const page = await browser.newPage();
  const externalRequests = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url());
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  const runtime = await page.evaluate(async ({ testProbes, searchWorkerUrl }) => {
    const worker = new Worker(searchWorkerUrl, { type: 'module' });
    let nextId = 1;
    const request = (type, payload = {}) => {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const handleMessage = ({ data }) => {
          if (data.id !== id) return;
          worker.removeEventListener('message', handleMessage);
          if (data.type === 'error') reject(new Error(data.error));
          else resolve(data);
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({ id, type, payload });
      });
    };
    const ready = await request('init');
    const results = [];
    for (const probe of testProbes) {
      const response = await request('search', { originalQuestion: probe.query, question: probe.query });
      const cardIds = (response.cards ?? []).map((card) => card.cardId);
      results.push({
        ...probe,
        status: response.result?.status ?? null,
        selectedAtlasId: response.result?.record?.atlasId ?? null,
        cardIds,
        expectedCardPresented: cardIds.includes(probe.expectedCardId),
      });
    }
    worker.terminate();
    return { readyCount: ready.count, results };
  }, { testProbes: probes, searchWorkerUrl: `/assets/${workerFile}` });

  const report = {
    state: runtime.results.every((result) => result.expectedCardPresented) && externalRequests.length === 0 ? 'PASS' : 'FAIL',
    generatedAt: new Date().toISOString(),
    scope: 'Runtime exaustivo: cada card ativo nos três catálogos é chamado por nome/autoridade e intenção correspondente no worker local; não altera route_ids nem Q&A.',
    readyCount: runtime.readyCount,
    activeCardCount: allCards.length,
    probeCount: probes.length,
    passed: runtime.results.filter((result) => result.expectedCardPresented).length,
    failed: runtime.results.filter((result) => !result.expectedCardPresented).length,
    externalRequests: [...new Set(externalRequests)],
    results: runtime.results,
  };
  const outputPath = path.join(root, 'docs/beta-offline/PROOF_CARD_CALLABILITY_RUNTIME_2026-11-10.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    state: report.state,
    readyCount: report.readyCount,
    activeCards: report.activeCardCount,
    probes: report.probeCount,
    passed: report.passed,
    failed: report.failed,
    externalRequests: report.externalRequests.length,
    output: path.relative(root, outputPath).replaceAll('\\', '/'),
  }, null, 2));
  if (report.state !== 'PASS') process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
