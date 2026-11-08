import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const localUrl = 'http://127.0.0.1';
const qaPath = path.join(root, 'data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl');
const manifestPath = path.join(root, 'data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json');
const qaRows = fs.readFileSync(qaPath, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const configuredCardManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/cards.json'), 'utf8'));
const matchCase = manifest.cases.find((testCase) => testCase.expected_resolution === 'MATCH_ATLAS_RECORD'
  && testCase.expected_route_ids?.includes('wsps.event.p4')
  && qaRows.find((row) => row.atlas_id === testCase.atlas_id)?.atlas_id.startsWith('WSPS:')
  && /\bP4\b/i.test(qaRows.find((row) => row.atlas_id === testCase.atlas_id)?.question ?? ''));
const matchRow = qaRows.find((row) => row.atlas_id === matchCase.atlas_id);
const p5Case = manifest.cases.find((testCase) => testCase.expected_resolution === 'MATCH_ATLAS_RECORD'
  && testCase.expected_route_ids?.includes('wsps.event.p5')
  && qaRows.find((row) => row.atlas_id === testCase.atlas_id)?.atlas_id.startsWith('WSPS:')
  && /\bP5\b/i.test(qaRows.find((row) => row.atlas_id === testCase.atlas_id)?.question ?? ''));
const p5Row = qaRows.find((row) => row.atlas_id === p5Case?.atlas_id);
const ambiguousCase = manifest.cases.find((testCase) => testCase.expected_resolution === 'ASK_FOR_CLARIFICATION');
const ambiguousRow = qaRows.find((row) => row.atlas_id === ambiguousCase?.atlas_id);
const externalRequests = [];

async function startServer(args) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'ignore', windowsHide: true });
  child.unref();
  return child;
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Static app did not start: ${url}`);
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
    await new Promise((resolve) => killer.once('exit', resolve));
  } else child.kill('SIGTERM');
}

const browser = await chromium.launch({ headless: true });
let devServer;
let previewServer;
try {
  devServer = await startServer(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort']);
  await waitForServer(`${localUrl}:5173/tests/browser-search.html`);
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const searchPage = await context.newPage();
  await searchPage.goto(`${localUrl}:5173/tests/browser-search.html`);
  await searchPage.waitForFunction(() => document.documentElement.dataset.testState === 'PASS' || document.documentElement.dataset.testState === 'FAIL', null, { timeout: 180_000 });
  const searchReport = JSON.parse(await searchPage.locator('#results').innerText());
  const presentationReport = searchReport.endToEndPresentation;
  const routeInventory = JSON.parse(fs.readFileSync(path.join(root, 'data/imports/day1_2026-11-06/governance/route_audit_62_2026-11-06.json'), 'utf8'));
  const cardManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/cards.json'), 'utf8'));
  const packManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/manifest.json'), 'utf8'));
  const packFiles = new Map(packManifest.files.map((file) => [file.path, file]));
  const cardAudit = cardManifest.cards.map((card) => {
    const cases = (presentationReport.caseResults ?? []).filter((item) => (item.applicableCardRoutes ?? []).includes(card.eventId));
    const photo = packFiles.get(card.photoPath);
    const cropAudit = (card.figureCrops ?? []).map((figure) => {
      const asset = packFiles.get(figure.assetPath);
      return { figureId: figure.figure_id, page: figure.page, locator: figure.locator, assetPath: figure.assetPath, assetHashMatches: Boolean(asset && asset.sha256 === figure.assetSha256), sourcePDFHashPresent: Boolean(figure.pdf_sha256), visuallyReviewed: figure.human_visual_review?.startsWith('VISUALLY_CHECKED_') === true };
    });
    return {
      cardId: card.cardId,
      eventId: card.eventId,
      phase: card.phase,
      role: card.role,
      photoPath: card.photoPath,
      photoHashMatches: Boolean(photo && photo.sha256 === card.photoSha256),
      localSourceRefs: (card.sourceRefs ?? []).filter((source) => source.localEvidence === true).length,
      casesInRoute: cases.length,
      casesPresentingCard: cases.filter((item) => item.presentedCardIds.includes(card.cardId)).length,
      figureCrops: cropAudit,
      state: (!card.photoPath || Boolean(photo && photo.sha256 === card.photoSha256))
        && card.layout === 'RENATE_UNIFIED_CARD_V1'
        && (card.displaySections?.length > 0 || card.displayRows?.length > 0)
        && cropAudit.every((crop) => crop.assetHashMatches && crop.sourcePDFHashPresent && crop.visuallyReviewed)
        ? 'UNIFIED_LAYOUT_AND_LOCAL_ASSETS_PASS' : 'FAIL',
    };
  });
  presentationReport.cardAudit = cardAudit;
  const routeCoverage = routeInventory.map((route) => {
    const cases = (presentationReport.caseResults ?? []).filter((item) => (item.expectedRouteIds ?? []).includes(route.route_id));
    const configuredCards = cardManifest.cards.filter((card) => card.eventId === route.route_id);
    return {
      routeId: route.route_id,
      routeName: route.route_name,
      authority: route.authority,
      atlasQACount: route.atlas_qa_count,
      goldenCases: cases.length,
      answerHashPass: cases.filter((item) => item.answerMatches).length,
      sourceSetPass: cases.filter((item) => item.sourceIdsMatch).length,
      expectedLocatorPass: cases.filter((item) => item.allExpectedRuleLocatorsVisible).length,
      localRuleProvenancePass: cases.filter((item) => item.localRulePassagesAndHashesValid).length,
      configuredCards: configuredCards.map((card) => {
        const audit = cardAudit.find((item) => item.cardId === card.cardId);
        return { cardId: card.cardId, phase: card.phase, cardAssetValid: audit?.photoHashMatches === true, casesPresentingCard: audit?.casesPresentingCard ?? 0, figureCropCount: card.figureCrops?.length ?? 0, state: audit?.state ?? 'FAIL' };
      }),
      cardStatus: configuredCards.length ? 'CONFIGURED' : 'NO_CARD_CONFIGURED',
      routeAcceptance: cases.length === 0 ? 'NO_GOLDEN_CASE' : cases.every((item) => item.answerMatches && item.sourceIdsMatch && item.allExpectedRuleLocatorsVisible && item.localRulePassagesAndHashesValid) ? 'PASS' : 'FAIL',
    };
  });
  presentationReport.routeCoverage = routeCoverage;
  presentationReport.routeCoverageSummary = {
    inventoryRoutes: routeInventory.length,
    routesWithGoldenCases: routeCoverage.filter((route) => route.goldenCases > 0).length,
    routesWithoutGoldenCases: routeCoverage.filter((route) => route.goldenCases === 0).map((route) => route.routeId),
    routesPassingEveryCase: routeCoverage.filter((route) => route.routeAcceptance === 'PASS').length,
    routesWithConfiguredCards: routeCoverage.filter((route) => route.cardStatus === 'CONFIGURED').length,
    routesWithoutConfiguredCards: routeCoverage.filter((route) => route.cardStatus === 'NO_CARD_CONFIGURED').length,
    cardRecords: cardManifest.cards.length,
  };
  const routeCsvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const routeCsv = [
    ['route_id', 'route_name', 'authority', 'atlas_qa_count', 'golden_cases', 'answer_hash_pass', 'source_set_pass', 'expected_locator_pass', 'local_rule_provenance_pass', 'card_status', 'card_ids', 'route_acceptance'].join(','),
    ...routeCoverage.map((route) => [route.routeId, route.routeName, route.authority, route.atlasQACount, route.goldenCases, route.answerHashPass, route.sourceSetPass, route.expectedLocatorPass, route.localRuleProvenancePass, route.cardStatus, route.configuredCards.map((card) => card.cardId).join(';'), route.routeAcceptance].map(routeCsvCell).join(',')),
  ].join('\n');
  fs.writeFileSync(path.join(root, 'docs/beta-offline/ROUTE_CARD_COVERAGE_2026-11-06.csv'), `${routeCsv}\n`);
  fs.writeFileSync(path.join(root, 'docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json'), `${JSON.stringify(presentationReport, null, 2)}\n`);
  const searchSummary = structuredClone(searchReport);
  delete searchSummary.endToEndPresentation.caseResults;
  fs.writeFileSync(path.join(root, 'docs/beta-offline/SEARCH_BROWSER_960_2026-11-06.json'), `${JSON.stringify(searchSummary, null, 2)}\n`);

  await context.close();
  await stopServer(devServer);
  devServer = null;

  previewServer = await startServer(['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort']);
  await waitForServer(`${localUrl}:4173/`);
  const appContext = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await appContext.newPage();
  page.on('request', (request) => {
    if (!request.url().startsWith(`${localUrl}:4173/`) && !request.url().startsWith('data:')) externalRequests.push(request.url());
  });
  await page.goto(`${localUrl}:4173/`);
  await page.getByRole('heading', { name: 'Crie seu PIN' }).waitFor({ timeout: 30_000 });
  await page.locator('input[type="password"]').nth(0).fill('123456');
  await page.locator('input[type="password"]').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Criar PIN neste dispositivo' }).click();
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="Pergunta"]')?.disabled === false, null, { timeout: 60_000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 30_000 });

  await page.locator('.side-nav-item').nth(1).click();
  await page.getByRole('heading', { name: 'Regulamentos completos' }).waitFor({ timeout: 10_000 });
  await page.waitForFunction(() => document.querySelectorAll('.library-document').length > 0, null, { timeout: 10_000 });
  const libraryDocumentCount = await page.locator('.library-document').count();
  const standaloneLibraryAccessible = libraryDocumentCount >= 20
    && await page.locator('.library-document a').first().evaluate(async (link) => {
      const response = await fetch(link.href);
      return response.ok && response.headers.get('content-type')?.includes('pdf') && (await response.arrayBuffer()).byteLength > 100;
    });
  await page.locator('.library-search input').fill('pistola');
  const libraryFilterWorks = await page.locator('.library-document').count() > 0
    && await page.locator('.library-document').count() < libraryDocumentCount;
  await page.locator('.side-nav-item').nth(0).click();
  await page.getByRole('button', { name: 'Nova conversa' }).click();

  const input = page.locator('textarea[aria-label="Pergunta"]');
  await input.fill(matchRow.question);
  await input.press('Enter');
  await page.waitForFunction((answer) => [...document.querySelectorAll('.assistant-message p')].some((node) => node.textContent === answer), matchRow.answer, { timeout: 30_000 });
  const completeRegulationLinks = page.locator('.assistant-message').last().locator('.local-rule-documents a');
  const fullRegulationAccessibleWithoutQuestion = await completeRegulationLinks.count() > 0
    && await completeRegulationLinks.first().evaluate(async (link) => {
      const response = await fetch(link.href);
      return response.ok && response.headers.get('content-type')?.includes('pdf') && (await response.arrayBuffer()).byteLength > 100;
    });
  await page.getByRole('button', { name: 'Consultar passagens da regra' }).click();
  await page.locator('.rule-passage').first().waitFor({ timeout: 30_000 });
  const rulePassageVisible = await page.locator('.rule-passage').count() > 0;
  const cardVisible = await page.locator('.local-card').count() > 0;
  const firstRuleFigure = page.locator('.rule-figure-crops img').first();
  await firstRuleFigure.waitFor({ timeout: 30_000 });
  await firstRuleFigure.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const image = document.querySelector('.rule-figure-crops img'); return Boolean(image?.complete && image.naturalWidth > 0); }, null, { timeout: 30_000 });
  const figureCropVisible = await firstRuleFigure.evaluate((image) => image.complete && image.naturalWidth > 0);
  if (!rulePassageVisible || !cardVisible || !figureCropVisible || !fullRegulationAccessibleWithoutQuestion) throw new Error('A resposta local não apresentou passagem, card, recorte PNG ou link local para o regulamento completo.');
  if (!p5Row) throw new Error('Não foi encontrada pergunta coberta da rota P5 para validar o card e o recorte local.');
  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await input.fill(p5Row.question);
  await input.press('Enter');
  await page.waitForFunction((answer) => [...document.querySelectorAll('.assistant-message p')].some((node) => node.textContent === answer), p5Row.answer, { timeout: 30_000 });
  await page.getByRole('button', { name: 'Consultar passagens da regra' }).last().click();
  const p5Figure = page.locator('.assistant-message').last().locator('.rule-figure-crops img').first();
  await p5Figure.waitFor({ timeout: 30_000 });
  await p5Figure.scrollIntoViewIfNeeded();
  await page.waitForFunction((src) => { const image = [...document.querySelectorAll('.rule-figure-crops img')].find((node) => node.getAttribute('src') === src); return Boolean(image?.complete && image.naturalWidth > 0); }, await p5Figure.getAttribute('src'), { timeout: 30_000 });
  const p5CardVisible = await page.locator('.assistant-message').last().locator('.local-card').count() > 0
    && await page.locator('.assistant-message').last().locator('.local-card').evaluateAll((cards) => cards.some((card) => card.textContent.includes('P5')));
  const p5FigureCropVisible = await p5Figure.evaluate((image) => image.complete && image.naturalWidth > 0).catch(() => false);
  if (!p5CardVisible || !p5FigureCropVisible) throw new Error(`Rota P5 não apresentou seu card e recorte local correto (${p5Row.atlas_id}).`);

  const cardUiChecks = [];
  for (const card of configuredCardManifest.cards) {
    const cardCase = presentationReport.caseResults.find((item) => item.presentedCardIds.includes(card.cardId));
    const cardRow = qaRows.find((row) => row.atlas_id === cardCase?.atlasId);
    if (!cardRow) throw new Error(`Não há pergunta de teste associada ao card ${card.cardId}.`);
    const priorAssistantCount = await page.locator('.assistant-message').count();
    await input.fill(cardRow.question);
    await input.press('Enter');
    await page.waitForFunction(({ cardId, priorCount }) => {
      const messages = [...document.querySelectorAll('.assistant-message')];
      const latest = messages.at(-1);
      return messages.length > priorCount && Boolean(latest?.querySelector(`.local-card[data-card-id="${cardId}"]`));
    }, { cardId: card.cardId, priorCount: priorAssistantCount }, { timeout: 30_000 });
    const article = page.locator('.assistant-message').last().locator(`.local-card[data-card-id="${card.cardId}"]`);
    await article.waitFor({ timeout: 30_000 });
    await article.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await article.locator('img').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    await page.waitForFunction((cardId) => {
      const node = document.querySelector(`.local-card[data-card-id="${cardId}"]`);
      const image = node?.querySelector('img.card-photo');
      return !image || (image.complete && image.naturalWidth > 0);
    }, card.cardId, { timeout: 10_000 });
    const rendered = await article.evaluate((node) => ({
      sections: [...node.querySelectorAll('.card-section li')].map((item) => item.textContent.trim()),
      rows: [...node.querySelectorAll('[data-card-row]')].map((item) => ({ slotId: item.getAttribute('data-card-row'), text: item.textContent })),
      visualLoaded: node.querySelector('img')
        ? Boolean(node.querySelector('img').complete && node.querySelector('img').naturalWidth > 0)
        : Boolean(node.querySelector('.card-hero')),
    }));
    const expectedSectionItems = (card.displaySections ?? []).flatMap((section) => section.items);
    const expectedRows = card.displayRows ?? [];
    const rowsMatch = !expectedRows.length || (rendered.rows.length === expectedRows.length
      && expectedRows.every((row, index) => rendered.rows[index]?.slotId === row.slotId
        && rendered.rows[index]?.text.includes(row.value)));
    const orderedBlocksMatch = expectedRows.length
      ? rowsMatch
      : JSON.stringify(rendered.sections) === JSON.stringify(expectedSectionItems);
    if (!orderedBlocksMatch || !rendered.visualLoaded) throw new Error(`Card ${card.cardId} não renderizou todas as seções na ordem prevista ou seu visual local/cabeçalho.`);
    cardUiChecks.push({ cardId: card.cardId, eventId: card.eventId, phase: card.phase, orderedBlocksMatch, renderedSections: rendered.sections.length, localVisualLoaded: rendered.visualLoaded, localPhotoPresent: Boolean(card.photoPath) });
  }
  if (!ambiguousRow) throw new Error('Não foi encontrada pergunta ambígua do golden set para validar os dois esclarecimentos.');
  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await input.fill(ambiguousRow.question);
  await input.press('Enter');
  const clarificationMessages = page.locator('.assistant-message').filter({ hasText: 'Você deseja saber sobre' });
  await clarificationMessages.nth(0).waitFor({ timeout: 30_000 });
  const firstAmbiguityHasRule = await clarificationMessages.nth(0).locator('.rule-passage').count() > 0;
  for (const expectedPromptCount of [2]) {
    await input.fill('Não sei');
    await input.press('Enter');
    await clarificationMessages.nth(expectedPromptCount - 1).waitFor({ timeout: 30_000 });
  }
  const secondAmbiguityHasRule = await clarificationMessages.nth(1).locator('.rule-passage').count() > 0;
  await input.fill('Ainda não sei');
  await input.press('Enter');
  const finalClarification = page.locator('.assistant-message').last();
  await finalClarification.getByText('Após dois esclarecimentos, seguem as passagens locais mais próximas da pergunta.').waitFor({ timeout: 30_000 });
  const finalAmbiguityHasRule = await finalClarification.locator('.rule-passage').count() > 0;
  const ambiguityAskedAtMostTwice = await clarificationMessages.count() === 2;
  if (!firstAmbiguityHasRule || !secondAmbiguityHasRule || !finalAmbiguityHasRule || !ambiguityAskedAtMostTwice) throw new Error('O ciclo ambíguo não mostrou regra em cada turno ou excedeu dois esclarecimentos.');
  await input.fill('zafronte moxila?');
  await input.press('Enter');
  const noMatchMessage = page.locator('.assistant-message').last();
  await noMatchMessage.getByText('Não encontrei uma resposta Q&A correspondente. Seguem as passagens locais mais próximas da sua pergunta.').waitFor({ timeout: 30_000 });
  await noMatchMessage.locator('.rule-passage').first().waitFor({ timeout: 30_000 });
  const noMatchRuleFallback = true;
  const initialCount = await page.locator('.saved-message').count();
  await page.reload();
  await page.getByRole('heading', { name: 'Desbloqueie o RENATE' }).waitFor({ timeout: 30_000 });
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="Pergunta"]')?.disabled === false, null, { timeout: 30_000 });
  await page.locator('.conversation-open').filter({ hasText: matchRow.question }).first().click();
  await page.locator('.user-message p').filter({ hasText: matchRow.question }).first().waitFor();
  await page.locator('.assistant-message p').filter({ hasText: matchRow.answer }).first().waitFor();

  const responsiveChecks = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      mobileMenuVisible: getComputedStyle(document.querySelector('.mobile-menu')).display !== 'none',
      sidebarVisible: getComputedStyle(document.querySelector('.sidebar')).display !== 'none',
    }));
    const mobile = width <= 760;
    const passed = layout.document <= layout.viewport && layout.body <= layout.viewport
      && layout.mobileMenuVisible === mobile && layout.sidebarVisible === !mobile;
    responsiveChecks.push({ width, ...layout, passed });
    if (!passed) throw new Error(`Responsive layout failed at ${width}px: ${JSON.stringify(layout)}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const mobileMenuOpened = await page.locator('.sidebar.mobile-open').isVisible();
  await page.getByRole('button', { name: 'Fechar menu' }).click({ position: { x: 350, y: 400 } });
  const mobileMenuClosed = await page.locator('.sidebar.mobile-open').count() === 0;
  if (!mobileMenuOpened || !mobileMenuClosed) throw new Error('Mobile navigation did not open and close correctly.');

  await appContext.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'Desbloqueie o RENATE' }).waitFor({ timeout: 30_000 });
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="Pergunta"]')?.disabled === false, null, { timeout: 60_000 });
  await input.fill(matchRow.question);
  await input.press('Enter');
  await page.waitForFunction((answer) => [...document.querySelectorAll('.assistant-message p')].some((node) => node.textContent === answer), matchRow.answer, { timeout: 30_000 });
  const offlineAnswered = true;
  const stored = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('renate-local', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return await new Promise((resolve, reject) => {
      const request = db.transaction('conversations', 'readonly').objectStore('conversations').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
  const browserReport = {
    state: 'PASS',
    browser: await browser.version(),
    appOrigin: `${localUrl}:4173`,
    initialMessageCount: initialCount,
    historyRestoredAfterReload: true,
    offlineSearchAnswered: offlineAnswered,
    persistedConversationCount: stored.length,
    persistedMessageCount: stored[0]?.messages?.length ?? 0,
    responsiveChecks,
    mobileMenuOpened,
    mobileMenuClosed,
    externalRequests: [...new Set(externalRequests)],
    offlineViaServiceWorker: true,
    pinSetupAndUnlock: true,
    rulePassageVisible,
    cardVisible,
    figureCropVisible,
    p5CardVisible,
    p5FigureCropVisible,
    cardUiChecks,
    firstAmbiguityHasRule,
    secondAmbiguityHasRule,
    finalAmbiguityHasRule,
    ambiguityAskedAtMostTwice,
    noMatchRuleFallback,
    criteria: { messageAutosave: true, reloadRestore: true, responsiveLayout: responsiveChecks.every((check) => check.passed), mobileNavigation: mobileMenuOpened && mobileMenuClosed, localSearchOffline: true, pinSetupAndUnlock: true, standaloneLibraryAccessible, libraryFilterWorks, libraryDocumentCount, rulePassageVisible, cardVisible, figureCropVisible, fullRegulationAccessibleWithoutQuestion, p5CardVisible, p5FigureCropVisible, firstAmbiguityHasRule, secondAmbiguityHasRule, finalAmbiguityHasRule, ambiguityAskedAtMostTwice, noMatchRuleFallback, noExternalRequests: externalRequests.length === 0 },
    finalContentAcceptance: searchReport.endToEndPresentation.state,
  };
  if (externalRequests.length) throw new Error(`Unexpected external requests: ${externalRequests.join(', ')}`);
  if (stored.length < 2 || !stored.some((conversation) => conversation.messages.length >= 2)) throw new Error('The local conversation did not preserve the expected turn history.');
  fs.writeFileSync(path.join(root, 'docs/beta-offline/BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json'), `${JSON.stringify(browserReport, null, 2)}\n`);
  await appContext.close();
  console.log(JSON.stringify({
    search: { state: searchReport.state, passed: searchReport.passed, failed: searchReport.failed },
    presentation: Object.fromEntries(Object.entries(presentationReport).filter(([key]) => key !== 'caseResults' && key !== 'failures')),
    browser: browserReport,
  }, null, 2));
  if (searchReport.state !== 'PASS') process.exitCode = 1;
} finally {
  await stopServer(devServer);
  await stopServer(previewServer);
  await browser.close();
}
