import { createAtlasSearchClient } from '../src/atlasSearchClient.js';

const out = document.querySelector('#results');
const encoder = new TextEncoder();
const sha256 = async (value) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const suites = [
  { name: 'ORIGINAL_960', url: '/tests/../data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json' },
  { name: 'SUPPLEMENT_50', url: '/tests/golden/supplement_50_2026-11-08.json' },
  { name: 'TIE_BREAK_SUPPLEMENT_94', url: '/tests/golden/tie_break_supplement_94_2026-11-08.json' },
];

try {
  const loaded = await Promise.all(suites.map(async (suite) => {
    const response = await fetch(suite.url);
    if (!response.ok) throw new Error(`${suite.name}: manifesto HTTP ${response.status}`);
    return { ...suite, manifest: await response.json() };
  }));
  const [atlasResponse, catalogResponse, packageResponse] = await Promise.all([
    fetch('/renate-pack/atlas.jsonl'), fetch('/renate-pack/cards.json'), fetch('/renate-pack/manifest.json'),
  ]);
  if (![atlasResponse, catalogResponse, packageResponse].every((response) => response.ok)) throw new Error('Pacote local incompleto.');
  const rows = (await atlasResponse.text()).trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const catalog = await catalogResponse.json();
  const packageManifest = await packageResponse.json();
  const reconciliationResponse = await fetch('/data/imports/qa_reconciliation_2026-11-08.json');
  if (!reconciliationResponse.ok) throw new Error('A reconciliação aprovada não foi carregada.');
  const reconciliation = await reconciliationResponse.json();
  const aliasTargets = reconciliation.event_question_alias_targets ?? {};
  const files = new Map((packageManifest.files ?? []).map((file) => [file.path, file]));
  const rowById = new Map(rows.map((row) => [row.atlas_id, row]));
  const allCases = loaded.flatMap(({ manifest }) => manifest.cases);
  if (allCases.length !== 1104 || new Set(allCases.map((item) => item.atlas_id)).size !== 1104) throw new Error('Golden Sets não cobrem exatamente 1.104 IDs únicos.');

  const client = createAtlasSearchClient();
  const ready = await client.initialize();
  const configuredRoutes = new Set([
    ...(catalog.cards ?? []).map((card) => card.eventId),
    ...(catalog.eventEvidenceCards ?? []).flatMap((card) => [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? [])]),
    ...(catalog.equipmentCards ?? []).flatMap((card) => card.eventIds ?? []),
  ].filter(Boolean));
  const results = [];
  for (let offset = 0; offset < allCases.length; offset += 32) {
    const batch = allCases.slice(offset, offset + 32);
    const actualBatch = await Promise.all(batch.map(async (expected) => {
      const row = rowById.get(expected.atlas_id);
      if (!row) return { expected, row: null, response: null };
      return { expected, row, response: await client.search({ question: row.question }) };
    }));
    for (const { expected, row, response } of actualBatch) {
      const actual = response?.result ?? {};
      const answer = actual.record?.answer ?? actual.entry?.answer ?? '';
      const selectedIds = actual.record?.atlasId ? [actual.record.atlasId] : (actual.candidates ?? []).map((item) => item.atlasId);
      const optionIds = (actual.questionOptions ?? []).map((item) => item.atlasId).filter(Boolean);
      const expectedRoutes = expected.expected_route_ids ?? row?.route_ids ?? [];
      const cardRouteApplicable = expectedRoutes.some((route) => configuredRoutes.has(route));
      const cardIds = (response?.cards ?? []).map((card) => card.cardId);
      const citedRows = [...new Set([...selectedIds, ...optionIds])].map((id) => rowById.get(id)).filter(Boolean);
      const sourceReferences = [
        ...(actual.record?.sourceReferences ?? []),
        ...(actual.candidates ?? []).flatMap((candidate) => candidate.sourceReferences ?? []),
        ...citedRows.flatMap((citedRow) => citedRow.source_references ?? []),
      ];
      const referenceLinks = sourceReferences.filter((reference) => reference.pdf_path ?? reference.pdfPath).length;
      const passageLinks = (response?.rulePassages ?? []).filter((passage) => passage.pdfPath).length;
      const localRuleLinkCount = new Set([
        ...(actual.record?.sourceReferences ?? []).map((reference) => reference.document_source_id ?? reference.source_id ?? reference.pdf_path ?? reference.pdfPath),
        ...(response?.rulePassages ?? []).map((passage) => passage.documentSourceId ?? passage.pdfPath),
      ].filter(Boolean)).size;
      const expectedAnswer = expected.expected_resolution === 'MATCH_ATLAS_RECORD';
      const answerHashPass = expectedAnswer && Boolean(row && await sha256(row.answer) === expected.expected_answer_sha256);
      const aliasTargetId = aliasTargets[expected.atlas_id];
      const reconciliationAnswer = reconciliation.answer_updates?.[expected.atlas_id];
      const expectedAnswerHash = reconciliationAnswer
        ? await sha256(reconciliationAnswer)
        : aliasTargetId ? await sha256(rowById.get(aliasTargetId)?.answer ?? '') : expected.expected_answer_sha256;
      const equivalentIds = actual.record?.equivalentAtlasIds ?? [];
      const selectionPass = expectedAnswer
        ? actual.status === 'ANSWERED'
          && (actual.record?.atlasId === expected.atlas_id || equivalentIds.includes(expected.atlas_id) || actual.record?.atlasId === aliasTargetId)
          && await sha256(answer) === expectedAnswerHash
        : actual.status === 'CLARIFICATION_REQUIRED' && JSON.stringify([...selectedIds].sort()) === JSON.stringify([...(expected.candidate_atlas_ids ?? [])].sort());
      const suggestedRoutes = new Set((actual.questionOptions ?? []).flatMap((option) => option.routeIds ?? []));
      const relevantQuestionOptions = optionIds.length > 0 && (expectedRoutes.length === 0 || expectedRoutes.some((route) => suggestedRoutes.has(route)));
      const qnaPertinent = selectionPass || relevantQuestionOptions;
      const cardShownWhenApplicable = !cardRouteApplicable || cardIds.length > 0;
      const linksToLocalRules = localRuleLinkCount > 0 && (referenceLinks + passageLinks) > 0;
      const hasPassagesDisclosure = Boolean((response?.rulePassages ?? []).length || (response?.figureCrops ?? []).length || actual.record?.atlasId || response?.origin);
      const passagesHaveCitationHeaders = (response?.rulePassages ?? []).length > 0 && response.rulePassages.every((passage) =>
        Boolean(passage.title && passage.edition && passage.locator && passage.text && passage.pdfPath && passage.ocrPath));
      const passagePathsHaveManifestHashes = (response?.rulePassages ?? []).every((passage) => {
        const pdf = files.get(passage.pdfPath);
        const ocr = files.get(passage.ocrPath);
        return Boolean(pdf && pdf.sha256 === passage.pdfSha256 && ocr && ocr.sha256 === passage.ocrSha256);
      });
      const sourceLinkHashesPass = sourceReferences.length
        ? sourceReferences.every((reference) => {
          const pdfPath = reference.pdf_path ?? reference.pdfPath;
          const expectedSha = reference.pdf_sha256 ?? reference.pdfSha256;
          const file = files.get(pdfPath);
          return Boolean(file && (!expectedSha || file.sha256 === expectedSha));
        })
        : passageLinks > 0 && passagePathsHaveManifestHashes;
      const allowedPassageSources = new Set(sourceReferences.flatMap((reference) => [reference.document_source_id, reference.source_id]).filter(Boolean));
      const passageSourceBindingPass = (response?.rulePassages ?? []).length > 0 && (response.rulePassages ?? []).every((passage) =>
        allowedPassageSources.size > 0
          ? allowedPassageSources.has(passage.documentSourceId) || allowedPassageSources.has(passage.sourceId)
          : passage.relevance === 'RELATED_NEAREST_AVAILABLE');
      const reasons = [];
      if (!row) reasons.push('ATLAS_ID_NOT_FOUND');
      if (!selectionPass) reasons.push(`RETRIEVAL_${actual.status ?? 'MISSING'}_${selectedIds.join('|')}`);
      if (!qnaPertinent) reasons.push('QA_NOT_MATCHED_OR_VALID_OPTIONS_MISSING');
      if (!cardShownWhenApplicable) reasons.push('APPLICABLE_CARD_NOT_PRESENTED');
      if (!linksToLocalRules) reasons.push('LOCAL_RULE_LINK_MISSING');
      if (!sourceLinkHashesPass) reasons.push('RULE_LINK_PDF_HASH_MISMATCH');
      if (!hasPassagesDisclosure) reasons.push('MORE_PASSAGES_DISCLOSURE_UNAVAILABLE');
      if (!passagesHaveCitationHeaders) reasons.push('PASSAGE_CITATION_HEADER_OR_TEXT_MISSING');
      if (!passagePathsHaveManifestHashes) reasons.push('PASSAGE_PDF_OCR_HASH_MISMATCH');
      if (!passageSourceBindingPass) reasons.push('PASSAGE_NOT_BOUND_TO_QNA_SOURCE_IDS');
      results.push({
        group: loaded.find(({ manifest }) => manifest.cases.some((item) => item.case_id === expected.case_id))?.name,
        caseId: expected.case_id,
        atlasId: expected.atlas_id,
        questionHash: expected.question_sha256,
        expectedResolution: expected.expected_resolution,
        actualStatus: actual.status ?? 'MISSING',
        selectedIds,
        optionIds,
        relevantQuestionOptions,
        relevantQuestionOptionsPass: relevantQuestionOptions,
        selectionPass,
        qnaPertinent,
        cardRouteApplicable,
        cards: cardIds,
        cardShownWhenApplicable,
        localRuleLinkCount,
        linksToLocalRules,
        sourceLinkHashesPass,
        passageCount: response?.rulePassages?.length ?? 0,
        figureCount: response?.figureCrops?.length ?? 0,
        hasPassagesDisclosure,
        passagesHaveCitationHeaders,
        passagePathsHaveManifestHashes,
        passageSourceBindingPass,
        origin: response?.origin ?? null,
        reasons,
      });
    }
  }
  client.close();

  const groups = loaded.map(({ name, manifest }) => {
    const groupRows = results.filter((result) => result.group === name);
    const metric = (key) => groupRows.filter((result) => result[key]).length;
    const failures = groupRows.filter((result) => result.reasons.length > 0);
    return {
      name,
      state: failures.length ? 'FAIL' : 'PASS',
      totals: {
        count: manifest.cases.length,
        retrievalOrClarificationPass: metric('selectionPass'),
        directAnswerOrExpectedClarificationPass: metric('selectionPass'),
        relevantQnaOrSuggestedQuestionsPass: metric('qnaPertinent'),
        cardApplicableCases: groupRows.filter((result) => result.cardRouteApplicable).length,
        applicableCardPass: metric('cardShownWhenApplicable'),
        localRuleLinksPass: metric('linksToLocalRules'),
        localRuleLinkHashesPass: metric('sourceLinkHashesPass'),
        additionalPassagesDisclosurePass: metric('hasPassagesDisclosure'),
        passageCitationHeadersPass: metric('passagesHaveCitationHeaders'),
        passagePdfOcrHashesPass: metric('passagePathsHaveManifestHashes'),
        passageSourceBindingPass: metric('passageSourceBindingPass'),
      },
      failureCount: failures.length,
      failures,
    };
  });
  const combined = {
    state: groups.every((group) => group.state === 'PASS') ? 'PASS' : 'FAIL',
    count: results.length,
    workerReadyCount: ready.count,
    uiOrderPass: null,
    uiOrder: ['cards', 'Q&A answer or relevant questions', 'local rule links', 'collapsed additional passages'],
    totals: Object.fromEntries(['selectionPass', 'qnaPertinent', 'relevantQuestionOptionsPass', 'cardShownWhenApplicable', 'linksToLocalRules', 'sourceLinkHashesPass', 'hasPassagesDisclosure', 'passagesHaveCitationHeaders', 'passagePathsHaveManifestHashes', 'passageSourceBindingPass'].map((key) => [key, results.filter((result) => result[key]).length])),
    groups,
  };
  const report = {
    state: combined.state,
    generatedAt: new Date().toISOString(),
    browser: navigator.userAgent,
    runtime: 'Actual local worker search for each original question; selectedAtlasId is never forced.',
    corpusCount: ready.count,
    cardCatalogCounts: { standardized: catalog.cards?.length ?? 0, eventEvidence: catalog.eventEvidenceCards?.length ?? 0, equipment: catalog.equipmentCards?.length ?? 0 },
    combined,
    caseResults: results,
  };
  out.textContent = JSON.stringify(report);
  document.documentElement.dataset.testState = report.state;
} catch (error) {
  out.textContent = JSON.stringify({ state: 'FAIL', error: error instanceof Error ? error.stack : String(error) });
  document.documentElement.dataset.testState = 'FAIL';
}
