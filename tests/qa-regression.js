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
  const manifests = await Promise.all(suites.map(async (suite) => {
    const response = await fetch(suite.url);
    if (!response.ok) throw new Error(`${suite.name}: manifesto HTTP ${response.status}`);
    return { ...suite, manifest: await response.json() };
  }));
  const packAtlasResponse = await fetch('/renate-pack/atlas.jsonl');
  const packManifestResponse = await fetch('/renate-pack/manifest.json');
  if (!packAtlasResponse.ok || !packManifestResponse.ok) throw new Error('Pacote local de runtime não está disponível.');
  const packRows = (await packAtlasResponse.text()).trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const packManifest = await packManifestResponse.json();
  const packedFiles = new Map((packManifest.files ?? []).map((file) => [file.path, file]));
  const client = createAtlasSearchClient();
  const initialized = await client.initialize();
  const allCases = manifests.flatMap(({ manifest }) => manifest.cases);
  if (new Set(allCases.map((item) => item.atlas_id)).size !== 1104) throw new Error('Os três Golden Sets não cobrem 1.104 IDs únicos.');
  const [selection, presentation] = await Promise.all([client.evaluate(allCases), client.evaluatePresentation(allCases)]);
  client.close();
  const selectionById = new Map(selection.results.map((item) => [item.caseId, item]));
  const presentationById = new Map(presentation.results.map((item) => [item.caseId, item]));
  const rowById = new Map(packRows.map((row) => [row.atlas_id, row]));
  const reports = [];

  for (const { name, manifest } of manifests) {
    const failures = [];
    const caseResults = [];
    const totals = { count: manifest.cases.length, selectionPass: 0, answerPass: 0, routePass: 0, sourcePass: 0, locatorPass: 0, localPassageProvenancePass: 0, recordsWithCards: 0 };
    for (const expected of manifest.cases) {
      const selected = selectionById.get(expected.case_id);
      const shown = presentationById.get(expected.case_id);
      const row = rowById.get(expected.atlas_id);
      const reasons = [];
      const inputFingerprint = Boolean(row && await sha256(row.question) === expected.question_sha256
        && (expected.expected_resolution === 'ASK_FOR_CLARIFICATION' || await sha256(row.answer) === expected.expected_answer_sha256));
      if (!inputFingerprint) reasons.push('PROTECTED_QUESTION_OR_ANSWER_HASH_MISMATCH');
      const expectedCandidates = [...(expected.candidate_atlas_ids ?? [])].sort();
      const actualCandidates = [...(selected?.actualIds ?? [])].sort();
      const isClarification = expected.expected_resolution === 'ASK_FOR_CLARIFICATION';
      const selectionPass = isClarification
        ? Boolean(selected?.actualStatus === 'CLARIFICATION_REQUIRED' && JSON.stringify(actualCandidates) === JSON.stringify(expectedCandidates))
        : Boolean(selected && selected.actualStatus === 'ANSWERED' && selected.actualIds?.includes(expected.atlas_id) && await sha256(selected.actualAnswer ?? '') === expected.expected_answer_sha256);
      if (selectionPass) totals.selectionPass += 1; else reasons.push(`SELECTION:${selected?.actualStatus ?? 'MISSING'}:${actualCandidates.join('|')}`);
      const answerPass = isClarification
        ? shown?.actualStatus === 'CLARIFICATION_REQUIRED'
        : Boolean(shown && shown.actualStatus === 'ANSWERED' && await sha256(shown.presentedAnswer ?? '') === expected.expected_answer_sha256);
      if (answerPass) totals.answerPass += 1; else reasons.push(`PRESENTED_ANSWER:${shown?.actualStatus ?? 'MISSING'}`);
      const actualRoutes = new Set(shown?.presentedRouteIds ?? []);
      const expectedRoutes = expected.expected_route_ids ?? [];
      const routePass = expectedRoutes.length === 0 || expectedRoutes.some((routeId) => actualRoutes.has(routeId));
      if (routePass) totals.routePass += 1; else reasons.push(`NO_EXPECTED_ROUTE_ID_PRESENT:${expectedRoutes.join('|')}`);
      const actualSources = new Set(shown?.presentedSourceIds ?? []);
      const sourcePass = (expected.expected_source_ids ?? []).every((sourceId) => actualSources.has(sourceId));
      if (sourcePass) totals.sourcePass += 1; else reasons.push(`SOURCE_IDS_MISSING:${(expected.expected_source_ids ?? []).filter((sourceId) => !actualSources.has(sourceId)).join('|')}`);
      const actualLocators = new Set((shown?.rulePassages ?? []).flatMap((passage) => [passage.locator, ...(passage.locatorAliases ?? [])]));
      const locatorPass = (expected.expected_rule_locators ?? []).every((locator) => actualLocators.has(locator));
      if (locatorPass) totals.locatorPass += 1; else reasons.push(`LOCATORS_MISSING:${(expected.expected_rule_locators ?? []).filter((locator) => !actualLocators.has(locator)).join('|')}`);
      const expectedDocs = new Set((shown?.sourceReferences ?? []).map((reference) => reference.document_source_id).filter(Boolean));
      const passages = shown?.rulePassages ?? [];
      const passageDiagnostics = passages.map((passage) => {
        const pdf = packedFiles.get(passage.pdfPath);
        const ocr = packedFiles.get(passage.ocrPath);
        const validDocument = expectedDocs.has(passage.documentSourceId) || (expectedDocs.size === 0 && passage.relevance === 'RELATED_NEAREST_AVAILABLE');
        const errors = [];
        if (!pdf || pdf.sha256 !== passage.pdfSha256) errors.push('PDF_HASH_OR_PATH');
        if (!ocr || ocr.sha256 !== passage.ocrSha256) errors.push('OCR_HASH_OR_PATH');
        if (!validDocument) errors.push('DOCUMENT_NOT_IN_RESPONSE_REFERENCES');
        if (!passage.title || !passage.edition || !passage.locator || !passage.text) errors.push('PASSAGE_HEADER_OR_TEXT');
        return { documentSourceId: passage.documentSourceId, locator: passage.locator, errors };
      });
      const passagePass = passages.length > 0 && passageDiagnostics.every((diagnostic) => diagnostic.errors.length === 0);
      if (passagePass) totals.localPassageProvenancePass += 1; else reasons.push('LOCAL_PASSAGE_OR_PDF_OCR_PROVENANCE_INVALID');
      const cards = (shown?.cards ?? []).map((card) => card.cardId);
      if (cards.length) totals.recordsWithCards += 1;
      const result = { atlasId: expected.atlas_id, questionHash: expected.question_sha256, answerHash: expected.expected_answer_sha256, inputFingerprint, selectionPass, answerPass, routeIntersectionPass: routePass, sourcePass, locatorPass, localPassageProvenancePass: passagePass, presentedCards: cards, passageDiagnostics: passagePass ? undefined : passageDiagnostics, reasons };
      caseResults.push(result);
      if (reasons.length) failures.push(result);
    }
    reports.push({ name, state: failures.length ? 'FAIL' : 'PASS', totals, failures, caseResults });
  }
  const combined = { name: 'COMBINED_1104', state: reports.every((report) => report.state === 'PASS') ? 'PASS' : 'FAIL', count: allCases.length, workerReadyCount: initialized.count, selectionMs: selection.durationMs, presentationMs: presentation.durationMs, groups: reports };
  const report = { state: combined.state, browser: navigator.userAgent, generatedAt: new Date().toISOString(), source: 'local RENATE package only; no route/question/answer data edited', combined, groups: reports };
  out.textContent = JSON.stringify(report);
  document.documentElement.dataset.testState = combined.state;
} catch (error) {
  out.textContent = JSON.stringify({ state: 'FAIL', error: error instanceof Error ? error.message : String(error) });
  document.documentElement.dataset.testState = 'FAIL';
}
