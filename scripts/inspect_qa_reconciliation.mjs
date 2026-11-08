import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const regression = JSON.parse(fs.readFileSync(path.join(root, 'docs/beta-offline/QA_PRESENTATION_REGRESSION_2026-11-08.json'), 'utf8'));
const reconciliation = JSON.parse(fs.readFileSync(path.join(root, 'data/imports/qa_reconciliation_2026-11-08.json'), 'utf8'));
const aliasTargets = reconciliation.event_question_alias_targets ?? {};
const rows = regression.combined.groups.flatMap((group) => group.failures ?? []);
const targets = [...new Map(rows.filter((item) => !item.selectionPass || !item.qnaPertinent || !item.passageSourceBindingPass)
  .map((item) => [item.atlasId, item])).values()];

const server = await createServer({ configFile: path.join(root, 'vite.config.js'), root, server: { host: '127.0.0.1', port: 0, strictPort: false } });
const browser = await chromium.launch({ headless: true });
try {
  await server.listen();
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Não foi possível iniciar o runtime de inspeção.');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const externalRequests = [];
  page.on('request', (request) => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async (targets) => {
    const [{ createAtlasSearchClient }, atlasResponse] = await Promise.all([
      import('/src/atlasSearchClient.js'), fetch('/renate-pack/atlas.jsonl'),
    ]);
    if (!atlasResponse.ok) throw new Error(`Atlas HTTP ${atlasResponse.status}.`);
    const atlasRows = (await atlasResponse.text()).trim().split(/\r?\n/).map((line) => JSON.parse(line));
    const rowById = new Map(atlasRows.map((row) => [row.atlas_id, row]));
    const client = createAtlasSearchClient();
    const ready = await client.initialize();
    const cases = [];
    for (const target of targets) {
      const source = rowById.get(target.atlasId);
      const response = source ? await client.search({ question: source.question }) : null;
      const answerRecord = response?.result?.record ?? null;
      const optionRows = (response?.result?.questionOptions ?? []).map((option) => {
        const candidate = rowById.get(option.atlasId);
        return { atlasId: option.atlasId, question: option.question, routeIds: option.routeIds, sourceQuestion: candidate?.question, answer: candidate?.answer, sourceIds: candidate?.source_ids, sourceReferences: candidate?.source_references };
      });
      cases.push({
        atlasId: target.atlasId,
        priorReasons: target.reasons,
        priorGroup: target.group,
        question: source?.question,
        authority: source?.authority,
        routeIds: source?.route_ids,
        sourceIds: source?.source_ids,
        sourceReferences: source?.source_references,
        resultStatus: response?.result?.status,
        selected: answerRecord ? { atlasId: answerRecord.atlasId, equivalentAtlasIds: answerRecord.equivalentAtlasIds ?? [], question: answerRecord.question, answer: answerRecord.answer, routeIds: answerRecord.routeIds, sourceIds: answerRecord.sourceIds, sourceReferences: answerRecord.sourceReferences } : null,
        options: optionRows,
        cards: (response?.cards ?? []).map((card) => card.cardId),
        passages: (response?.rulePassages ?? []).map((passage) => ({ sourceId: passage.sourceId, documentSourceId: passage.documentSourceId, title: passage.title, edition: passage.edition, locator: passage.locator, relevance: passage.relevance, text: passage.text })),
      });
    }
    client.close();
    return { readyCount: ready.count, cases };
  }, targets.map(({ atlasId, reasons, group }) => ({ atlasId, reasons, group })));
  const report = {
    generatedAt: new Date().toISOString(),
    state: externalRequests.length ? 'FAIL' : 'INSPECTION_COMPLETE',
    scope: 'Runtime evidence for historical selection, Q&A pertinence, and source-binding failures. No Atlas ID was forced and no answers or routes were changed.',
    readyCount: result.readyCount,
    counts: { uniqueCases: result.cases.length, historicalSelectionFailures: result.cases.filter((item) => item.priorReasons.some((reason) => reason.startsWith('RETRIEVAL_'))).length, historicalNonPertinentCases: result.cases.filter((item) => item.priorReasons.includes('QA_NOT_MATCHED_OR_VALID_OPTIONS_MISSING')).length, historicalBindingFailures: result.cases.filter((item) => item.priorReasons.includes('PASSAGE_NOT_BOUND_TO_QNA_SOURCE_IDS')).length },
    currentRuntime: {
      answered: result.cases.filter((item) => item.resultStatus === 'ANSWERED').length,
      selectedExpectedOrEquivalent: result.cases.filter((item) => item.selected && (item.selected.atlasId === item.atlasId || item.selected.equivalentAtlasIds.includes(item.atlasId) || aliasTargets[item.atlasId] === item.selected.atlasId)).length,
      relevantTargetSuggested: result.cases.filter((item) => item.options.some((option) => option.atlasId === item.atlasId)).length,
      passageSourceBindingPass: result.cases.filter((item) => {
        const refs = item.selected?.sourceReferences?.length
          ? item.selected.sourceReferences
          : item.options.flatMap((option) => option.sourceReferences ?? []);
        const documents = new Set(refs.map((reference) => reference.document_source_id).filter(Boolean));
        const sources = new Set(refs.map((reference) => reference.source_id).filter(Boolean));
        return item.passages.length > 0 && item.passages.every((passage) => documents.size
          ? documents.has(passage.documentSourceId) || sources.has(passage.sourceId)
          : passage.relevance === 'RELATED_NEAREST_AVAILABLE');
      }).length,
    },
    externalRequests: [...new Set(externalRequests)],
    cases: result.cases,
  };
  const output = path.join(root, 'docs/beta-offline/QA_RECONCILIATION_INSPECTION_2026-11-08.json');
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ state: report.state, ...report.counts, readyCount: report.readyCount, externalRequests: report.externalRequests.length, output: path.relative(root, output) }, null, 2));
  await context.close();
} finally {
  await browser.close();
  await server.close();
}
