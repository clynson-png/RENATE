import { createAtlasSearchClient } from '../src/atlasSearchClient.js';
import goldenUrl from '../data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json?url';

const out = document.querySelector('#results');
const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

try {
  const response = await fetch(goldenUrl);
  if (!response.ok) throw new Error(`Golden manifest HTTP ${response.status}`);
  const manifest = await response.json();
  const client = createAtlasSearchClient();
  const ready = await client.initialize();
  const evaluation = await client.evaluate(manifest.cases);
  const presentationEvaluation = await client.evaluatePresentation(manifest.cases);
  const localPackManifest = await (await fetch('/renate-pack/manifest.json')).json();
  const localFigureManifest = await (await fetch('/renate-pack/figures.json')).json();
  const cardManifest = await (await fetch('/renate-pack/cards.json')).json();
  const configuredCardRoutes = new Set(cardManifest.cards.map((card) => card.eventId));
  const namedCardRoutes = (question) => {
    const normalized = String(question ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    return [...configuredCardRoutes].filter((route) => {
      const match = route.match(/^wsps\.event\.([pr])(\d+)$/);
      if (!match) return false;
      const [, letter, number] = match;
      if (new RegExp(`\\b${letter}\\s*${number}\\b`).test(normalized)) return true;
      if (route === 'wsps.event.p4') return /\b50m pistol\b|\bpistola 50m\b/.test(normalized);
      if (route === 'wsps.event.p5') return /\b10m air pistol standard\b|\bpistola de ar standard\b/.test(normalized);
      if (route === 'wsps.event.p6') return /\bmixed team\b|\bequipe mista\b/.test(normalized);
      return false;
    });
  };
  const packedFiles = new Map(localPackManifest.files.map((file) => [file.path, file]));
  const failures = [];
  const presentationFailures = [];
  const contentMetrics = { answer: 0, sources: 0, locators: 0, localRules: 0, localCards: 0, expectedCards: 0, cardAssets: 0, cardsPresented: 0, figures: 0, figureEligibleCases: 0 };
  const presentationCases = [];
  for (const item of evaluation.results) {
    const expected = manifest.cases.find((testCase) => testCase.case_id === item.caseId);
    let pass = false;
    if (expected.expected_resolution === 'ASK_FOR_CLARIFICATION') {
      const actualIds = [...item.actualIds].sort();
      const expectedIds = [...expected.candidate_atlas_ids].sort();
      pass = item.actualStatus === 'CLARIFICATION_REQUIRED' && JSON.stringify(actualIds) === JSON.stringify(expectedIds);
    } else if (expected.expected_resolution === 'MATCH_ATLAS_RECORD') {
      pass = item.actualStatus === 'ANSWERED' && await sha256(item.actualAnswer ?? '') === expected.expected_answer_sha256;
    }
    if (!pass) failures.push({ caseId: item.caseId, atlasId: item.atlasId, expectedResolution: expected.expected_resolution, actualStatus: item.actualStatus, expectedCandidateIds: expected.candidate_atlas_ids, actualIds: item.actualIds });
  }
  const presentationById = new Map(presentationEvaluation.results.map((item) => [item.caseId, item]));
  const requiredFigureCases = new Map([
    ['CBTE:CBTE-ARB-007:A01', 'cbte-cma-25m-three-target-layout-p2'],
    ['CBTE:CBTE-ARB-002:A01', 'issf-target-10m-air-pistol-p200'],
    ['CBTE:CBTE-ARB-011:A03', 'issf-target-25m-precision-pistol-p199'],
    ['CBTE:CBTE-ARB-015:A01', 'cbte-duelo-25m-rapid-target-p2'],
    ['CBTE:CBTE-ARB-018:A01', 'cbte-duelo-10m-precision-target-p2'],
    ['CBTE:CBTE-ARB-113:A02', 'cbte-duelo-10m-pistol-grip-examples-p6'],
    ['ISSF:ISSF-161:A01', 'issf-pistol-grips-p355'],
    ['ISSF:ISSF-129:A01', 'issf-clothing-stiffness-measurement-device-p228'],
    ['WSPS:WSPS-SRC-244:A02', 'wsps-appendix5-spring-flexibility-p26'],
  ]);
  const requiredFigureFailures = [];
  for (const expected of manifest.cases) {
    const item = presentationById.get(expected.case_id);
    const reasons = [];
    if (!item) reasons.push('PRESENTATION_RESULT_MISSING');
    else {
      const answerMatches = expected.expected_resolution === 'ASK_FOR_CLARIFICATION'
        ? item.actualStatus === 'CLARIFICATION_REQUIRED'
        : item.actualStatus === 'ANSWERED' && await sha256(item.presentedAnswer ?? '') === expected.expected_answer_sha256;
      if (answerMatches) contentMetrics.answer += 1; else reasons.push(`ANSWER:${item.actualStatus}`);

      const actualSources = new Set(item.presentedSourceIds ?? []);
      const sourceMatches = (expected.expected_source_ids ?? []).every((sourceId) => actualSources.has(sourceId));
      if (sourceMatches) contentMetrics.sources += 1; else reasons.push('SOURCE_ID_MISMATCH');

      const actualLocators = new Set((item.rulePassages ?? []).flatMap((passage) => [passage.locator, ...(passage.locatorAliases ?? [])]));
      const expectedLocators = expected.expected_rule_locators ?? [];
      const locatorsMatch = expectedLocators.length === 0 || expectedLocators.every((locator) => actualLocators.has(locator));
      if (locatorsMatch) contentMetrics.locators += 1; else reasons.push(`RULE_LOCATOR_MISMATCH:${expectedLocators.filter((locator) => !actualLocators.has(locator)).join(',')}`);

      const expectedDocuments = new Set((item.sourceReferences ?? []).map((reference) => reference.document_source_id).filter(Boolean));
      const rulePassageDiagnostics = (item.rulePassages ?? []).map((passage) => {
        const pdf = packedFiles.get(passage.pdfPath);
        const ocr = packedFiles.get(passage.ocrPath);
        const failures = [];
        if (!pdf || pdf.sha256 !== passage.pdfSha256) failures.push('PDF_PATH_OR_SHA256_MISMATCH');
        if (!ocr || ocr.sha256 !== passage.ocrSha256) failures.push('OCR_PATH_OR_SHA256_MISMATCH');
        if (!expectedDocuments.has(passage.documentSourceId) && !(expectedDocuments.size === 0 && passage.relevance === 'RELATED_NEAREST_AVAILABLE')) failures.push('DOCUMENT_NOT_IN_QNA_SOURCE_REFERENCES_OR_EXPLICIT_NEAREST');
        if (!passage.title || !passage.edition || !passage.locator || !passage.text) failures.push('PASSAGE_HEADER_OR_TEXT_MISSING');
        return { documentSourceId: passage.documentSourceId, sourceId: passage.sourceId, locator: passage.locator, failures };
      });
      const localRulesMatch = (item.rulePassages ?? []).length > 0 && item.rulePassages.every((passage) => {
        const pdf = packedFiles.get(passage.pdfPath);
        const ocr = packedFiles.get(passage.ocrPath);
        return Boolean(pdf && ocr && pdf.sha256 === passage.pdfSha256 && ocr.sha256 === passage.ocrSha256
          && (expectedDocuments.has(passage.documentSourceId) || (expectedDocuments.size === 0 && passage.relevance === 'RELATED_NEAREST_AVAILABLE'))
          && passage.title && passage.edition && passage.locator && passage.text);
      });
      if (localRulesMatch) contentMetrics.localRules += 1; else reasons.push('LOCAL_RULE_PASSAGE_OR_PROVENANCE_MISSING');

      const explicitlyNamedRoutes = new Set(namedCardRoutes(item?.question ?? ''));
      const expectedCardRoutes = expected.expected_route_ids.filter((route) => configuredCardRoutes.has(route) && explicitlyNamedRoutes.has(route));
      if (expectedCardRoutes.length) contentMetrics.expectedCards += 1;
      const cardsForExpectedRoutes = (item.cards ?? []).filter((card) => expectedCardRoutes.includes(card.eventId));
      const unrelatedCards = (item.cards ?? []).filter((card) => !expectedCardRoutes.includes(card.eventId));
      const cardAssetsValid = expectedCardRoutes.length === 0 || (cardsForExpectedRoutes.length > 0 && cardsForExpectedRoutes.every((card) => {
        const photo = packedFiles.get(card.photoPath);
        return Boolean(photo && photo.sha256 === card.photoSha256);
      }));
      if (cardAssetsValid) contentMetrics.cardAssets += 1; else reasons.push('EXPECTED_CARD_OR_LOCAL_IMAGE_MISSING');
      if (expectedCardRoutes.length && cardAssetsValid) contentMetrics.localCards += 1;
      if (cardsForExpectedRoutes.length) contentMetrics.cardsPresented += 1;
      if (unrelatedCards.length) reasons.push(`UNRELATED_CARD_PRESENTED:${unrelatedCards.map((card) => card.cardId).join('|')}`);
      const localFigures = item.figureCrops ?? [];
      const requiredFigure = requiredFigureCases.get(expected.atlas_id);
      if (requiredFigure && !localFigures.some((figure) => figure.figure_id === requiredFigure)) {
        requiredFigureFailures.push({ atlasId: expected.atlas_id, expectedFigureId: requiredFigure, presentedFigureIds: localFigures.map((figure) => figure.figure_id) });
      }
      const figureHashesValid = localFigures.every((figure) => {
        const asset = packedFiles.get(figure.assetPath);
        return Boolean(asset && asset.sha256 === figure.assetSha256 && figure.document_source_id && figure.page && figure.locator);
      });
      if (localFigures.length) contentMetrics.figureEligibleCases += 1;
      if (localFigures.length && figureHashesValid) contentMetrics.figures += 1;
      else if (localFigures.length) reasons.push('FIGURE_CROP_PROVENANCE_MISSING');
      presentationCases.push({
        caseId: expected.case_id,
        atlasId: expected.atlas_id,
        expectedRouteIds: expected.expected_route_ids ?? [],
        question: item.question,
        resolution: expected.expected_resolution,
        answerMatches,
        sourceIdsMatch: sourceMatches,
        expectedRuleLocators: expectedLocators,
        visibleRuleLocators: [...actualLocators],
        allExpectedRuleLocatorsVisible: locatorsMatch,
        localRulePassagesAndHashesValid: localRulesMatch,
        invalidRulePassageBindings: rulePassageDiagnostics.filter((passage) => passage.failures.length),
        applicableCardRoutes: expectedCardRoutes,
        presentedCardIds: (item.cards ?? []).map((card) => card.cardId),
        localCardAssetsValid: cardAssetsValid,
        presentedFigureIds: localFigures.map((figure) => figure.figure_id),
        figureCropHashesValid: localFigures.every((figure) => packedFiles.get(figure.assetPath)?.sha256 === figure.assetSha256),
      });
    }
    if (reasons.length) presentationFailures.push({ caseId: expected.case_id, atlasId: expected.atlas_id, expectedResolution: expected.expected_resolution, expectedRouteIds: expected.expected_route_ids, expectedSourceIds: expected.expected_source_ids, expectedRuleLocators: expected.expected_rule_locators, actualRuleLocators: item?.rulePassages?.map((passage) => passage.locator) ?? [], actualCardIds: item?.cards?.map((card) => card.cardId) ?? [], reasons });
  }
  for (const failure of requiredFigureFailures) presentationFailures.push({ caseId: failure.atlasId, atlasId: failure.atlasId, reasons: [`REQUIRED_FIGURE_MISSING:${failure.expectedFigureId}`] });
  client.close();
  const result = {
    state: failures.length || presentationFailures.length ? 'FAIL' : 'PASS',
    engine: 'FlexSearch 0.8.212 in module Web Worker',
    browser: navigator.userAgent,
    corpusCount: ready.count,
    goldenCaseCount: manifest.cases.length,
    expectedClarifications: manifest.conflicting_duplicate_group_count,
    buildIndexMs: Number((ready.initializeMs ?? ready.indexBuildMs ?? 0).toFixed(2)),
    evaluationMs: Number(evaluation.durationMs.toFixed(2)),
    passed: manifest.cases.length - failures.length,
    failed: failures.length,
    failures: failures.slice(0, 20),
    endToEndPresentation: {
      state: presentationFailures.length ? 'FAIL' : 'PASS',
      cases: presentationEvaluation.results.length,
      answerMatches: contentMetrics.answer,
      sourceSetMatches: contentMetrics.sources,
      expectedRuleLocatorSetsMatch: contentMetrics.locators,
      localRulePassagesWithCorrectPDFOCRHashesAndHeaders: contentMetrics.localRules,
      casesWithApplicableConfiguredCard: contentMetrics.expectedCards,
      casesWithExpectedConfiguredCardAndLocalPhoto: contentMetrics.localCards,
      casesActuallyPresentingConfiguredCard: contentMetrics.cardsPresented,
      casesWithApplicableFigure: contentMetrics.figureEligibleCases,
      casesWithApplicableFigureCropAndValidSourceHash: contentMetrics.figures,
      requiredFigureCases: requiredFigureCases.size,
      requiredFigureFailures,
      configuredRulePageCrops: localFigureManifest.figures.length,
      cropFigureIds: localFigureManifest.figures.map((figure) => figure.figure_id),
      caseResultsPath: '/docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json',
      caseResults: presentationCases,
      failures: presentationFailures.slice(0, 50),
      figurePages: 'Locally rendered crops cover CBTE CMA target layout and pistol-grip examples; ISSF rifle/pistol/moving-target/clay targets, rifle measurements, clothing and shoe inspection devices, shoes, jacket, trousers, pistol grips/specifications; WSPS Appendix 4 trigger adaptations and Appendix 5 SH2 support/spring drawings. Topic and source filters bind each crop to applicable questions.',
      interpretation: 'Checks deterministic Q&A answer hashes, source-ID sets, expected locator visibility, and card/photo bindings. The Q&A expected answer hashes are selection/content integrity checks, not a human semantic review of rule correctness.'
    },
  };
  out.textContent = JSON.stringify(result, null, 2);
  document.documentElement.dataset.testState = result.state;
} catch (error) {
  const result = { state: 'FAIL', error: error.stack || String(error) };
  out.textContent = JSON.stringify(result, null, 2);
  document.documentElement.dataset.testState = 'FAIL';
}
