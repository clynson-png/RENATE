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
  const reconciliationResponse = await fetch('/data/imports/qa_reconciliation_2026-11-08.json');
  if (!reconciliationResponse.ok) throw new Error(`Approved Q&A reconciliation HTTP ${reconciliationResponse.status}`);
  const reconciliation = await reconciliationResponse.json();
  const sourceRowsResponse = await fetch('/renate-pack/atlas.jsonl');
  if (!sourceRowsResponse.ok) throw new Error(`Current local Q&A package HTTP ${sourceRowsResponse.status}`);
  const currentRows = (await sourceRowsResponse.text()).trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const currentRowsById = new Map(currentRows.map((row) => [row.atlas_id, row]));
  const currentCases = [];
  for (const testCase of manifest.cases) {
    const answer = reconciliation.answer_updates?.[testCase.atlas_id];
    if (answer && currentRowsById.get(testCase.atlas_id)?.answer !== answer) throw new Error(`Reconciled answer is not present in the local package for ${testCase.atlas_id}.`);
    const locators = reconciliation.issf_source?.locators_by_id?.[testCase.atlas_id]
      ?? (reconciliation.cbte_source?.atlas_ids?.includes(testCase.atlas_id) ? reconciliation.cbte_source.locators : null);
    const sourceId = reconciliation.issf_source?.locators_by_id?.[testCase.atlas_id]
      ? reconciliation.issf_source.source_id
      : reconciliation.cbte_source?.atlas_ids?.includes(testCase.atlas_id) ? reconciliation.cbte_source.source_id : null;
    currentCases.push({
      ...testCase,
      ...(answer ? { expected_answer_sha256: await sha256(answer) } : {}),
      ...(locators ? { expected_rule_locators: locators } : {}),
      ...(sourceId ? { expected_source_ids: [sourceId] } : {}),
    });
  }
  const client = createAtlasSearchClient();
  const ready = await client.initialize();
  const evaluation = await client.evaluate(currentCases);
  const presentationEvaluation = await client.evaluatePresentation(currentCases);
  const localPackManifest = await (await fetch('/renate-pack/manifest.json')).json();
  const localFigureManifest = await (await fetch('/renate-pack/figures.json')).json();
  const cardManifest = await (await fetch('/renate-pack/cards.json')).json();
  const allConfiguredCards = [...(cardManifest.cards ?? []), ...(cardManifest.eventEvidenceCards ?? []), ...(cardManifest.equipmentCards ?? [])];
  const configuredCardsById = new Map(allConfiguredCards.map((card) => [card.cardId, card]));
  const configuredCardRoutes = new Set(allConfiguredCards.flatMap((card) => [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? []), ...(card.routeIds ?? [])]).filter(Boolean));
  const namedCardRoutes = (question) => {
    const normalized = String(question ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    const normalizedCanonical = normalized.replace(/\s+(m|mm)\b/g, '$1');
    const namedCards = allConfiguredCards.filter((card) => {
      const aliases = [card.event, card.eventName, card.title, card.caption, ...(card.eventAliases ?? []), ...(card.aliases ?? [])]
        .map((value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ').replace(/^(cbte|issf|wsps)\s+/, '').replace(/\s+(m|mm)\b/g, '$1'))
        .filter((alias) => alias.length >= 4);
      return aliases.some((alias) => normalizedCanonical.includes(` ${alias} `) || normalizedCanonical.startsWith(`${alias} `) || normalizedCanonical.endsWith(` ${alias}`));
    });
    const codes = [...normalized.matchAll(/\b([pr])\s*(\d+)\b/g)].map((match) => `wsps.event.${match[1]}${Number(match[2])}`);
    if (/\b50m pistol\b|\bpistola 50m\b/.test(normalized)) codes.push('wsps.event.p4');
    if (/\b10m air pistol standard\b|\bpistola de ar standard\b/.test(normalized)) codes.push('wsps.event.p5');
    if (/\bmixed team\b|\bequipe mista\b/.test(normalized)) codes.push('wsps.event.p6');
    if (/\bduelo 20s 25m\b|\bduelo 20 segundos 25m\b/.test(normalizedCanonical)) codes.push('cbte.duelo.25m');
    if (/\bduelo 20s 10m\b|\bduelo 20 segundos 10m\b/.test(normalizedCanonical)) codes.push('cbte.duelo.10m');
    if (/\bwrabf\b|\bbench ?rest\b/.test(normalized)) codes.push('cbte.wrabf.rifle_international');
    if (/\bf[ -]?class\b/.test(normalized)) codes.push('cbte.fclass.centerfire');
    if (/\bcarabina mira aberta\b/.test(normalized)) {
      const distance = normalizedCanonical.match(/\b(10|25|50)m\b/)?.[1];
      if (distance) codes.push(`cbte.cma.${distance}m`);
    }
    return [...new Set([...namedCards.flatMap((card) => [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? []), ...(card.routeIds ?? [])]), ...codes].filter(Boolean))];
  };
  const packedFiles = new Map(localPackManifest.files.map((file) => [file.path, file]));
  const failures = [];
  const presentationFailures = [];
  const contentMetrics = { answer: 0, sources: 0, locators: 0, localRules: 0, localCards: 0, expectedCards: 0, cardAssets: 0, cardsPresented: 0, figures: 0, figureEligibleCases: 0 };
  const presentationCases = [];
  for (const item of evaluation.results) {
    const expected = currentCases.find((testCase) => testCase.case_id === item.caseId);
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
    ['WSPS:WSPS-SRC-244:A02', 'wsps-appendix5-spring-flexibility-p26'],
  ]);
  const requiredFigureFailures = [];
  for (const expected of currentCases) {
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
      const explicitlyNamedConfiguredRoutes = [...explicitlyNamedRoutes].filter((route) => configuredCardRoutes.has(route));
      const expectedCardRoutes = explicitlyNamedConfiguredRoutes.length
        ? explicitlyNamedConfiguredRoutes
        : expected.expected_route_ids.filter((route) => configuredCardRoutes.has(route));
      if (expectedCardRoutes.length) contentMetrics.expectedCards += 1;
      const routesForCard = (card) => [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? []), ...(card.routeIds ?? [])].filter(Boolean);
      const cardsForExpectedRoutes = (item.cards ?? []).filter((card) => routesForCard(card).some((routeId) => expectedCardRoutes.includes(routeId)));
      const unrelatedCards = (item.cards ?? []).filter((card) => !routesForCard(card).some((routeId) => expectedCardRoutes.includes(routeId)));
      const cardAssetsValid = expectedCardRoutes.length === 0 || (cardsForExpectedRoutes.length > 0 && cardsForExpectedRoutes.every((card) => {
        const catalogCard = configuredCardsById.get(card.cardId);
        const assetPath = catalogCard?.photoPath ?? catalogCard?.imagePath;
        const asset = packedFiles.get(assetPath);
        const expectedHash = catalogCard?.photoSha256 ?? catalogCard?.imageSha256;
        return Boolean(catalogCard && (!assetPath || (asset && asset.sha256 === expectedHash)));
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
  const shoeFlexibilityQuery = 'Qual a dimensão/ espessura/ rigidez/ força / teste/ que o calçado/ sapato/ tênis de tiro tem que passar/ suportar/ para ser aprovado/ok?';
  const shoeFlexibilityResult = await client.search({ question: shoeFlexibilityQuery });
  const shoeFlexibilityRecord = shoeFlexibilityResult.result?.record ?? shoeFlexibilityResult.result?.entry ?? null;
  const shoeFlexibilityFigureIds = (shoeFlexibilityResult.figureCrops ?? []).map((figure) => figure.figure_id);
  const shoeFlexibilityFigurePass = shoeFlexibilityFigureIds.includes('issf-shoe-sole-flexibility-device-p229')
    && !shoeFlexibilityFigureIds.includes('issf-clothing-stiffness-measurement-device-p228');
  const shoeFlexibilityCardPass = (shoeFlexibilityResult.cards ?? []).some((card) => card.cardId === 'ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1');
  const shoeFlexibilityQnaPass = shoeFlexibilityRecord?.atlasId === 'RENATE:ISSF-RIFLE-APPAREL:001:A01'
    && /6\.5\.3/.test(shoeFlexibilityRecord.answer ?? '');
  const shoeFlexibilityCase = { query: shoeFlexibilityQuery, selectedAtlasId: shoeFlexibilityRecord?.atlasId ?? null, qnaPass: shoeFlexibilityQnaPass, equipmentCardPass: shoeFlexibilityCardPass, figureIds: shoeFlexibilityFigureIds, shoeFigurePass: shoeFlexibilityFigurePass };
  if (!shoeFlexibilityQnaPass || !shoeFlexibilityCardPass || !shoeFlexibilityFigurePass) presentationFailures.push({ caseId: 'RENATE_SHOE_FLEXIBILITY_DEVICE_QUERY', reasons: [!shoeFlexibilityQnaPass && 'SHOE_QNA_OR_RULE_6_5_3_MISSING', !shoeFlexibilityCardPass && 'ISSF_RIFLE_EQUIPMENT_CARD_MISSING', !shoeFlexibilityFigurePass && 'SHOE_FLEXIBILITY_DEVICE_FIGURE_MISSING_OR_WRONG_CLOTHING_FIGURE'].filter(Boolean) });
  const currentApprovalCandidates = [
    { cardId: 'WSPS_PROGRAM_OF_EVENTS_V1', query: 'Qual é o programa de eventos e provas da WSPS?', required: ['programa', 'eventos'] },
    { cardId: 'ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1', query: shoeFlexibilityQuery, required: ['sapato', 'bandoleira', 'ISSF'] },
    { cardId: 'WSPS_RIFLE_APPAREL_AND_SLING_V1', query: 'WSPS R3: quais medidas do sapato de tiro, calça, casaco, luva e bandoleira?', required: ['sapato', 'SH1A', 'bandoleira'] },
    { cardId: 'ISSF_MOVING_TARGET_SLING_RULE_V1', query: 'ISSF Moving Target: quando a bandoleira pode ser usada na prova de alvo móvel?', required: ['bandoleira', 'Moving Target'] },
    { cardId: 'WSPS_PARATRAP_ADAPTIVE_SUPPORT_V1', query: 'WSPS Para Trap: quais são as regras do suporte adaptativo por classe?', required: ['suporte', 'classe'] },
  ];
  const normalizeText = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const cardById = new Map(allConfiguredCards.map((card) => [card.cardId, card]));
  const currentApprovalTests = [];
  for (const probe of currentApprovalCandidates) {
    const result = await client.search({ question: probe.query });
    const card = (result.cards ?? []).find((item) => item.cardId === probe.cardId);
    const sourceCard = cardById.get(probe.cardId);
    const cardText = card ? normalizeText([...(card.displaySections ?? []).flatMap((section) => [section.heading, ...(section.items ?? [])]), ...(card.displayRows ?? []).flatMap((row) => [row.label, row.value])].join(' ')) : '';
    const packedAsset = sourceCard && packedFiles.get(sourceCard.photoPath ?? sourceCard.imagePath);
    const assetHashMatches = !sourceCard?.photoPath && !sourceCard?.imagePath || Boolean(packedAsset && packedAsset.sha256 === (sourceCard.photoSha256 ?? sourceCard.imageSha256));
    const requiredTermsPresent = probe.required.every((term) => cardText.includes(normalizeText(term)));
    const sourceRefs = sourceCard?.sourceReferences ?? sourceCard?.sourceRefs ?? [];
    const sourceBindingsValid = sourceRefs.length > 0 && sourceRefs.every((reference) => {
      const file = packedFiles.get(reference.pdf_path ?? reference.pdfPath);
      return Boolean(file && (!reference.pdf_sha256 && !reference.pdfSha256 || file.sha256 === (reference.pdf_sha256 ?? reference.pdfSha256)));
    });
    const pass = Boolean(card && sourceCard?.layout === 'RENATE_UNIFIED_CARD_V1'
      && ((sourceCard.displaySections?.length ?? 0) > 0 || (sourceCard.displayRows?.length ?? 0) > 0)
      && requiredTermsPresent && assetHashMatches && sourceBindingsValid);
    currentApprovalTests.push({ cardId: probe.cardId, query: probe.query, selectedCard: Boolean(card), layoutPass: sourceCard?.layout === 'RENATE_UNIFIED_CARD_V1', sectionContentPass: requiredTermsPresent, localAssetHashPass: assetHashMatches, sourceBindingsPass: sourceBindingsValid, state: pass ? 'PASS' : 'FAIL' });
  }
  const routeBehaviorProbes = [
    { atlasId: 'CBTE:CBTE-ARB-118:A01', query: 'Durante o minuto de preparação da prova CBTE Duelo 20s 25m, o atleta pode municiar a arma?', mustShow: ['cbte.duelo.25m:qualification'], mustNotShow: ['cbte.duelo.10m:qualification'] },
    { atlasId: 'CBTE:CBTE-ARB-118:A03', query: 'Quando o atleta pode municiar a arma na prova CBTE Duelo 20s 25m?', mustShow: ['cbte.duelo.25m:qualification'], mustNotShow: ['cbte.duelo.10m:qualification'] },
    { atlasId: 'ISSF:ISSF-243:A01', query: 'Na disciplina Shotgun da ISSF, o resultado da qualificação é levado para a final de Trap ou Skeet?', mustShow: ['issf.event.13:qualification', 'issf.event.14:qualification'], mustNotShow: ['issf.event.13:final', 'issf.event.14:final'] },
    { atlasId: 'ISSF:ISSF-247:A01', query: 'Na disciplina Shotgun da ISSF, a regra vigente prevê shoot-off para vaga na final de Trap e Skeet?', mustShow: ['issf.event.13:qualification', 'issf.event.14:qualification'], mustNotShow: ['issf.event.13:final', 'issf.event.14:final'] },
  ];
  const routeBehaviorResults = [];
  for (const probe of routeBehaviorProbes) {
    const response = await client.search({ question: probe.query });
    const shown = (response.cards ?? []).map((card) => card.cardId);
    const requiredShown = probe.mustShow.every((id) => shown.includes(id));
    const forbiddenAbsent = probe.mustNotShow.every((id) => !shown.includes(id));
    routeBehaviorResults.push({ ...probe, shown, requiredShown, forbiddenAbsent, state: requiredShown && forbiddenAbsent ? 'PASS' : 'FAIL' });
  }
  const suppressedFinalIds = [
    'cbte.issf.carabina:final', 'cbte.shotgun.trap_light:final',
    'cbte.shotgun.trap_nacional_25_2024:final', 'cbte.shotgun.trap_nacional_50_2024:final',
  ];
  const suppressedFinalCardsAbsent = suppressedFinalIds.every((id) => !configuredCardsById.has(id));
  for (const probe of routeBehaviorResults) {
    if (probe.state !== 'PASS') presentationFailures.push({ caseId: `CARD_ROUTE_PROBE:${probe.atlasId}`, reasons: [`EXPECTED_CARDS:${probe.mustShow.join('|')}`, `FORBIDDEN_CARDS:${probe.mustNotShow.join('|')}`, `ACTUAL_CARDS:${probe.shown.join('|')}`] });
  }
  if (!suppressedFinalCardsAbsent) presentationFailures.push({ caseId: 'CBTE_SUPPRESSED_FINAL_CARDS', reasons: ['UNSUPPORTED_CBTE_FINAL_CARD_REMAINS_IN_CATALOG'] });
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
      shoeFlexibilityCase,
      currentApprovalTests,
      routeBehaviorResults,
      suppressedFinalCardsAbsent,
      cardCatalogCounts: { standardized: cardManifest.cards?.length ?? 0, eventEvidence: cardManifest.eventEvidenceCards?.length ?? 0, equipment: cardManifest.equipmentCards?.length ?? 0, total: allConfiguredCards.length, applicableRoutes: configuredCardRoutes.size },
      configuredRulePageCrops: localFigureManifest.figures.length,
      cropFigureIds: localFigureManifest.figures.map((figure) => figure.figure_id),
      caseResultsPath: '/docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-08.json',
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
