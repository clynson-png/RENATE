import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedCardId = 'WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1';
const probes = [
  { query: 'Quais são as especificações permitidas para cadeiras de rodas WSPS?', figures: ['wsps-wheelchair-chair-table-rules-p31'] },
  { query: 'Quais regras se aplicam à cadeira de tiro WSPS?', figures: ['wsps-shooting-chair-high-stool-p29-30'] },
  { query: 'Qual é a altura máxima do cano em relação ao piso para usar banco baixo WSPS?', figures: ['wsps-shooting-chair-high-stool-p29-30'] },
  { query: 'Quais são as dimensões permitidas para o banco alto WSPS?', figures: ['wsps-shooting-chair-high-stool-p29-30'] },
  { query: 'Quais dimensões são permitidas para a mesa de tiro WSPS?', figures: ['wsps-shooting-table-and-kneeling-block-p34-35'] },
  { query: 'Qual bloco de 10 cm é permitido como apoio para o joelho no WSPS?', figures: ['wsps-shooting-table-and-kneeling-block-p34-35'] },
  { query: 'Onde deve ficar o bib number no equipamento WSPS?', figures: ['wsps-start-bib-backrest-score-p16'] },
  { query: 'Quais são as dimensões permitidas para o encosto da cadeira de tiro WSPS?', figures: ['wsps-chair-backrest-dimensions-p32-33'] },
  { query: 'Quais são as regras do fork ou garfo de suporte do rifle WSPS?', figures: ['wsps-appendix5-sh2-rifle-yoke-configuration-p28'] },
  { query: 'Qual rigidez a mola do suporte SH2 WSPS deve ter?', figures: ['wsps-appendix5-spring-flexibility-p26'] },
  { query: 'O que significam as letras A, B e C na classificação do encosto WSPS?', figures: ['wsps-chair-backrest-dimensions-p32-33'] },
  { query: 'O que significam as subclasses a e b da mola de suporte SH2 WSPS?', figures: ['wsps-appendix5-spring-flexibility-p26'] },
  { query: 'WSPS R7 kneeling block 10cm', figures: ['wsps-shooting-table-and-kneeling-block-p34-35'], alsoExpected: ['wsps.event.r7:qualification'], order: [expectedCardId, 'wsps.event.r7:qualification'] },
  { query: 'ISSF cadeira de rodas e fork dimensões', exclude: true },
  { query: 'CBTE cadeira de rodas e fork dimensões', exclude: true },
];

const workerFile = fs.readdirSync(path.join(root, 'dist/assets')).find((file) => /^atlasSearch\.worker-.*\.js$/.test(file));
if (!workerFile) throw new Error('Worker compilado não encontrado em dist/assets.');
const server = await preview({ root, preview: { host: '127.0.0.1', port: 0, strictPort: false } });
const browser = await chromium.launch({ headless: true });

try {
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Preview local não iniciou.');
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
    const request = (type, payload = {}) => new Promise((resolve, reject) => {
      const id = nextId++;
      const handleMessage = ({ data }) => {
        if (data.id !== id) return;
        worker.removeEventListener('message', handleMessage);
        if (data.type === 'error') reject(new Error(data.error));
        else resolve(data);
      };
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ id, type, payload });
    });
    const ready = await request('init');
    const results = [];
    for (const probe of testProbes) {
      const response = await request('search', { originalQuestion: probe.query, question: probe.query });
      const card = (response.cards ?? []).find((item) => item.cardId === 'WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1');
      const figureIds = (card?.figureCrops ?? []).map((figure) => figure.figure_id);
      const responseCardIds = (response.cards ?? []).map((item) => item.cardId);
      const onlyGenericCardPresented = probe.genericOnly ? responseCardIds.length === 1 && responseCardIds[0] === 'WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1' : true;
      results.push({
        ...probe,
        cardPresented: Boolean(card),
        figureIds,
        expectedFiguresPresent: (probe.figures ?? []).every((figureId) => figureIds.includes(figureId)),
        expectedAdditionalCardsPresent: (probe.alsoExpected ?? []).every((cardId) => responseCardIds.includes(cardId)),
        expectedOrderPreserved: (probe.order ?? []).every((cardId, index) => responseCardIds.indexOf(cardId) >= 0
          && (index === 0 || responseCardIds.indexOf(probe.order[index - 1]) < responseCardIds.indexOf(cardId))),
        onlyGenericCardPresented,
        responseCardIds,
        correctlyExcluded: probe.exclude ? !card : null,
      });
    }
    worker.terminate();
    return { readyCount: ready.count, results };
  }, { testProbes: probes.map((probe) => ({ ...probe, genericOnly: !probe.exclude && !probe.alsoExpected?.length })), searchWorkerUrl: `/assets/${workerFile}` });

  const failures = runtime.results.filter((result) => result.exclude
    ? !result.correctlyExcluded
    : !result.cardPresented || !result.expectedFiguresPresent || !result.expectedAdditionalCardsPresent || !result.expectedOrderPreserved || !result.onlyGenericCardPresented);
  const cardCatalog = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/cards.json'), 'utf8'));
  const card = (cardCatalog.equipmentCards ?? []).find((item) => item.cardId === expectedCardId);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/figures.json'), 'utf8'));
  const cardSha256 = card ? crypto.createHash('sha256').update(JSON.stringify(card), 'utf8').digest('hex') : null;
  const cardApproval = JSON.parse(fs.readFileSync(path.join(root, 'docs/beta-offline/CARD_HUMAN_APPROVAL_WSPS_GENERAL_EQUIPMENT_2026-11-11.json'), 'utf8'));
  const cardHashApproved = cardApproval.decisions?.some((decision) => decision.cardId === expectedCardId
    && decision.catalogGroup === 'equipment' && decision.decision === 'APPROVE' && decision.contentSha256 === cardSha256) ?? false;
  const cardFiguresPresent = (card?.sourceReferences?.length ?? 0) === 2
    && manifest.figures.some((figure) => figure.figure_id === 'wsps-start-bib-backrest-score-p16')
    && manifest.figures.some((figure) => figure.figure_id === 'wsps-shooting-table-and-kneeling-block-p34-35');
  const report = {
    schema: 'RENATE_WSPS_GENERAL_EQUIPMENT_RUNTIME_V1',
    generatedAt: new Date().toISOString(),
    state: failures.length === 0 && externalRequests.length === 0 && Boolean(card) && cardFiguresPresent && cardHashApproved ? 'PASS' : 'FAIL',
    scope: 'Focused runtime only for WSPS general equipment keywords and explicit ISSF/CBTE isolation; no Q&A or route identities changed.',
    expectedCardId,
    cardInPack: Boolean(card),
    cardSha256,
    cardHashApproved,
    cardFigureAssetsInPack: cardFiguresPresent,
    probeCount: runtime.results.length,
    passed: runtime.results.length - failures.length,
    failed: failures.length,
    externalRequestCount: [...new Set(externalRequests)].length,
    externalRequests: [...new Set(externalRequests)],
    results: runtime.results,
  };
  const output = path.join(root, 'docs/beta-offline/WSPS_GENERAL_EQUIPMENT_RUNTIME_2026-11-11.json');
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ state: report.state, probes: report.probeCount, passed: report.passed, failed: report.failed, externalRequests: report.externalRequestCount, cardInPack: report.cardInPack, cardFigureAssetsInPack: report.cardFigureAssetsInPack, output: path.relative(root, output).replaceAll('\\', '/') }, null, 2));
  if (report.state !== 'PASS') process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
