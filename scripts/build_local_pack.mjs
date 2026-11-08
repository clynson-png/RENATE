import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRuleChunks } from './rule_chunks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'data', 'imports', 'day1_2026-11-06');
const libraryRoot = path.join(root, 'library');
const outputRoot = path.join(root, 'public', 'renate-pack');
const packageInfo = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = [];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readJsonl(relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8').trim();
  return text ? text.split(/\r?\n/).map((line) => JSON.parse(line)) : [];
}

function parseCsv(text) {
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); records.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); records.push(row); }
  const [header, ...rows] = records;
  if (!header?.length) throw new Error('Manifesto CSV vazio ou inválido.');
  return rows.filter((record) => record.some(Boolean)).map((record) => Object.fromEntries(header.map((name, index) => [name, record[index] ?? ''])));
}

function localPath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || /^[a-z]+:/i.test(relativePath)) throw new Error(`Path local ausente ou externo: ${relativePath}`);
  const absolute = path.resolve(root, relativePath.replaceAll('/', path.sep));
  if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error(`Path escapa da raiz RENATE: ${relativePath}`);
  return absolute;
}

function copyHashed(sourcePath, destinationPath, expectedHash, context) {
  const source = localPath(sourcePath);
  if (!fs.existsSync(source)) throw new Error(`${context}: arquivo local não existe (${sourcePath}).`);
  const observed = sha256(source);
  if (expectedHash && observed !== expectedHash.toLowerCase()) throw new Error(`${context}: SHA-256 divergente em ${sourcePath}; esperado ${expectedHash}, observado ${observed}.`);
  const destination = path.join(outputRoot, destinationPath.replaceAll('/', path.sep));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return { path: `./${destinationPath}`, sha256: observed, bytes: fs.statSync(destination).size };
}

function extractSvgText(svg) {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)]
    .map((match) => match[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim())
    .filter(Boolean);
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

const manifestRows = parseCsv(fs.readFileSync(path.join(libraryRoot, 'manifest.csv'), 'utf8'));
const documents = new Map();
const sourceToDocument = new Map();
for (const row of manifestRows) {
  const documentSourceId = row.document_source_id?.trim();
  if (!documentSourceId) continue;
  const doc = documents.get(documentSourceId) ?? { documentSourceId, pdfRow: null, ocrRows: [], locators: [], routes: [] };
  if (row.artifact_kind === 'documents' && row.local_pdf_path) doc.pdfRow = row;
  if (row.artifact_kind === 'ocr' && row.local_ocr_path) doc.ocrRows.push(row);
  doc.locators.push(...(row.page_or_locator ?? '').split(';').map((value) => value.trim()));
  doc.routes.push(...(row.referenced_by ?? '').split(';').map((value) => value.trim()));
  documents.set(documentSourceId, doc);
  if (row.source_id) sourceToDocument.set(row.source_id.trim(), documentSourceId);
  sourceToDocument.set(documentSourceId, documentSourceId);
}

const atlasPath = 'data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl';
const bindingPath = 'data/imports/day1_2026-11-06/atlas/atlas_source_bindings_2026-11-06.jsonl';
const supplementPath = 'data/imports/atlas_supplement_2026-11-07/atlas_qa_renate_supplement_2026-11-07.jsonl';
const tieBreakingSupplementPath = 'data/imports/tie_breaking_qa_supplement_2026-11-07.jsonl';
const rifleApparelQaPath = 'data/imports/rifle_apparel_qa_2026-11-08.jsonl';
const qaReconciliationPath = 'data/imports/qa_reconciliation_2026-11-08.json';
const alphaomegaAssociationPath = 'data/imports/day1_2026-11-06/atlas/alphaomega_question_association_2026-11-06.jsonl';
const pretestPath = 'data/imports/day1_2026-11-06/chatbot-candidates/pretest_responses_candidate.json';
const cardPath = 'data/imports/day1_2026-11-06/cards/cards_allowlist_p4_p5.json';
const adanaCardSnapshotPath = 'data/imports/adana_cards_2026-11-06/adana_competition_cards_v1.snapshot.json';
const adanaCardAuditPath = 'data/imports/adana_cards_2026-11-06/IMPORT_AUDIT.json';
const importedAtlas = readJsonl(atlasPath);
const atlasSupplement = readJsonl(supplementPath);
const tieBreakingSupplement = readJsonl(tieBreakingSupplementPath);
const rifleApparelQa = readJsonl(rifleApparelQaPath);
const alphaomegaAssociations = readJsonl(alphaomegaAssociationPath);
const alphaomegaQuestionIds = new Set(alphaomegaAssociations.map((row) => row.atlas_id));
const atlas = [...importedAtlas, ...atlasSupplement, ...tieBreakingSupplement, ...rifleApparelQa];
const qaReconciliation = readJson(qaReconciliationPath);
const reconciliationIds = new Set(Object.keys(qaReconciliation.answer_updates));
for (const row of atlas) {
  const answer = qaReconciliation.answer_updates[row.atlas_id];
  if (!answer) continue;
  row.answer = answer;
  row.adana_response = answer;
  row.answer_key_hint = answer;
  row.atlas_response_status = 'SOURCE_GROUNDED_RECONCILIATION_2026-11-08';
  row.rule_locators = qaReconciliation.issf_source.locators_by_id[row.atlas_id]
    ?? qaReconciliation.cbte_source.locators;
  if (row.atlas_id.startsWith('ISSF:')) {
    row.source_ids = [qaReconciliation.issf_source.source_id];
  } else {
    row.source_ids = [qaReconciliation.cbte_source.source_id];
  }
}
for (const [questionId, canonicalId] of Object.entries(qaReconciliation.event_question_alias_targets ?? {})) {
  const questionRow = atlas.find((row) => row.atlas_id === questionId);
  const canonicalRow = atlas.find((row) => row.atlas_id === canonicalId);
  if (!questionRow || !canonicalRow) {
    errors.push(`Alias de desempate ISSF sem registro de origem/canônico: ${questionId} -> ${canonicalId}.`);
    continue;
  }
  canonicalRow.aliases = dedupe([...(canonicalRow.aliases ?? []), questionRow.question]);
}
if ([...reconciliationIds].some((id) => !atlas.some((row) => row.atlas_id === id))) {
  errors.push('A reconciliação Q&A referencia um atlas_id ausente no pacote.');
}
// Correct stale cross-discipline route fan-out in inherited tie Q&As. The new
// RENATE supplement contains an event-specific answer for every concrete proof.
const issfRifleRoutes = [...Array.from({ length: 6 }, (_, index) => `issf.event.${String(index + 1).padStart(2, '0')}`), 'cbte.issf.carabina'];
const issfPistolRoutes = [...Array.from({ length: 6 }, (_, index) => `issf.event.${String(index + 7).padStart(2, '0')}`), 'cbte.issf.pistola'];
const issfShotgunRoutes = ['issf.event.13', 'issf.event.14', 'cbte.shotgun.issf', 'cbte.shotgun.trap_light'];
const legacyTieRouteScopes = new Map([
  ['ISSF:ISSF-082:A01', Array.from({ length: 19 }, (_, index) => `issf.event.${String(index + 1).padStart(2, '0')}`)],
  ['ISSF:ISSF-083:A01', issfRifleRoutes],
  ['ISSF:ISSF-083:A02', issfPistolRoutes],
  ['ISSF:ISSF-148:A01', issfRifleRoutes],
  ['ISSF:ISSF-194:A01', issfPistolRoutes],
  ['ISSF:ISSF-245:A01', issfShotgunRoutes],
  ['ISSF:ISSF-247:A01', issfShotgunRoutes],
  ['ISSF:ISSF-297:A01', ['issf.event.19']],
]);
for (const row of atlas) {
  const scope = legacyTieRouteScopes.get(row.atlas_id);
  if (!scope) continue;
  row.route_ids = scope;
  row.discipline_routes = scope;
  row.route_classification_status = 'RENATE_ROUTE_SCOPE_CORRECTED_TO_NORMATIVE_DISCIPLINE_2026-11-07';
}
const bindings = readJsonl(bindingPath);
for (let index = bindings.length - 1; index >= 0; index -= 1) {
  if (reconciliationIds.has(bindings[index].atlas_id)) bindings.splice(index, 1);
}
for (const [atlasId, locators] of Object.entries(qaReconciliation.issf_source.locators_by_id)) {
  bindings.push({
    atlas_id: atlasId,
    source_id: qaReconciliation.issf_source.source_id,
    document_source_id: qaReconciliation.issf_source.document_source_id,
    edition: qaReconciliation.issf_source.edition,
    locators,
    status: 'RENATE_LOCAL_RULEBOOK_THIRD_PRINT_2026-10_HASH_VERIFIED',
  });
}
bindings.push({
  atlas_id: qaReconciliation.cbte_source.atlas_ids[0],
  source_id: qaReconciliation.cbte_source.source_id,
  document_source_id: qaReconciliation.cbte_source.document_source_id,
  edition: qaReconciliation.cbte_source.edition,
  locators: qaReconciliation.cbte_source.locators,
  status: 'RENATE_LOCAL_CBTE_RULE_HASH_VERIFIED',
});
bindings.push({
  atlas_id: qaReconciliation.cbte_source.atlas_ids[1],
  source_id: qaReconciliation.cbte_source.source_id,
  document_source_id: qaReconciliation.cbte_source.document_source_id,
  edition: qaReconciliation.cbte_source.edition,
  locators: qaReconciliation.cbte_source.locators,
  status: 'RENATE_LOCAL_CBTE_RULE_HASH_VERIFIED',
});
for (const row of atlasSupplement) {
  for (const reference of row.source_references ?? []) {
    bindings.push({
      atlas_id: row.atlas_id,
      source_id: reference.source_id,
      document_source_id: reference.document_source_id,
      edition: reference.edition,
      locators: reference.locators ?? [],
      authority: reference.authority ?? row.authority,
      status: reference.verification_status ?? 'USER_PROVIDED_LOCAL_SOURCE_REFERENCE',
    });
  }
}
for (const row of tieBreakingSupplement) {
  for (const reference of row.source_references ?? []) {
    bindings.push({
      atlas_id: row.atlas_id,
      source_id: reference.source_id,
      document_source_id: reference.document_source_id,
      edition: reference.edition,
      locators: reference.locators ?? [],
      authority: reference.authority ?? row.authority,
      status: reference.verification_status ?? 'RENATE_LOCAL_MANIFEST_HASH_BOUND; USER_DIRECTED_TIE_BREAKING_COVERAGE',
    });
  }
}
for (const row of rifleApparelQa) {
  for (const reference of row.source_references ?? []) {
    bindings.push({
      atlas_id: row.atlas_id,
      source_id: reference.source_id,
      document_source_id: reference.document_source_id,
      edition: reference.edition,
      locators: reference.locators ?? [],
      authority: reference.authority ?? row.authority,
      status: reference.verification_status ?? 'RENATE_LOCAL_RULEBOOK_HASH_VERIFIED; USER_DIRECTED_EQUIPMENT_QA_2026-11-08',
    });
  }
}
const pretest = readJson(pretestPath);
const cardAllowlist = readJson(cardPath);
const adanaCardSnapshot = readJson(adanaCardSnapshotPath);
const adanaCardAudit = readJson(adanaCardAuditPath);
const sourceBindingById = new Map();
for (const binding of bindings) {
  const list = sourceBindingById.get(binding.source_id) ?? [];
  list.push(binding);
  sourceBindingById.set(binding.source_id, list);
  if (binding.source_id && binding.document_source_id) sourceToDocument.set(binding.source_id, binding.document_source_id);
  if (binding.document_source_id) sourceToDocument.set(binding.document_source_id, binding.document_source_id);
  const sourceDocument = documents.get(binding.document_source_id);
  if (sourceDocument?.pdfRow) {
    if (binding.renate_pdf_path && binding.renate_pdf_path !== sourceDocument.pdfRow.local_pdf_path) errors.push(`Binding ${binding.atlas_id}/${binding.source_id}: PDF RENATE diverge do manifesto local.`);
    if (binding.pdf_sha256 && binding.pdf_sha256.toLowerCase() !== sourceDocument.pdfRow.pdf_sha256_observed.toLowerCase()) errors.push(`Binding ${binding.atlas_id}/${binding.source_id}: hash PDF diverge do manifesto local.`);
  }
}

if (importedAtlas.length !== 960) errors.push(`Snapshot de origem ATLAS contém ${importedAtlas.length} linhas; esperado 960.`);
if (atlasSupplement.length !== 50) errors.push(`Complemento ATLAS RENATE contém ${atlasSupplement.length} linhas; esperado 50.`);
if (tieBreakingSupplement.length < 80) errors.push(`Complemento de empate/desempate contém ${tieBreakingSupplement.length} linhas; esperado ao menos 80 provas.`);
if (new Set(atlas.map((row) => row.atlas_id)).size !== atlas.length) errors.push('Snapshot ATLAS contém atlas_id duplicado.');
for (const row of atlas) {
  if (!row.atlas_id || !row.question?.trim() || !row.answer?.trim()) errors.push(`Q&A sem id/pergunta/resposta: ${row.atlas_id ?? '(sem id)'}`);
  for (const sourceId of row.source_ids ?? []) {
    if (!sourceBindingById.has(sourceId)) errors.push(`ATLAS ${row.atlas_id}: source_id sem vínculo local no sidecar (${sourceId}).`);
    const docId = sourceToDocument.get(sourceId);
    const doc = docId ? documents.get(docId) : null;
    if (!doc?.pdfRow || !doc.ocrRows.length) errors.push(`ATLAS ${row.atlas_id}: fonte ${sourceId} não resolve para PDF+OCR local allowlisted.`);
  }
}

const eligiblePretests = [];
for (const entry of pretest.entries ?? []) {
  if (entry.recorded_case_status !== 'PASS') continue;
  const sourceIds = Array.isArray(entry.source_ids_cited) ? entry.source_ids_cited : [entry.source_ids_cited].filter(Boolean);
  const linkedSources = sourceIds.map((sourceId) => {
    const documentSourceId = sourceToDocument.get(sourceId);
    const doc = documentSourceId ? documents.get(documentSourceId) : null;
    if (!doc?.pdfRow || !doc.ocrRows.length) errors.push(`Preteste ${entry.case_id}: fonte não tem PDF+OCR local (${sourceId}).`);
    return { sourceId, documentSourceId };
  });
  eligiblePretests.push({ ...entry, source_ids_cited: sourceIds, local_sources: linkedSources, runtime_eligibility: 'RECORDED_PASS_USER_REQUESTED_LOCAL_BANK' });
}

const referencedDocumentIds = new Set();
for (const row of atlas) for (const sourceId of row.source_ids ?? []) if (sourceToDocument.has(sourceId)) referencedDocumentIds.add(sourceToDocument.get(sourceId));
for (const entry of eligiblePretests) for (const source of entry.local_sources) if (source.documentSourceId) referencedDocumentIds.add(source.documentSourceId);
for (const event of cardAllowlist.events ?? []) for (const phase of Object.values(event.phase_cards ?? {})) for (const source of phase.source_refs ?? []) if (sourceToDocument.has(source.source_id)) referencedDocumentIds.add(sourceToDocument.get(source.source_id));

// This locally hash-verified CBTE planning document is an approved RENATE source
// for its registered Trap Nacional route, even when no ATLAS answer cites it.
const routeScopedLocalSources = new Map([
  ['ADANA-SRC-5AD016EBD99EEDAA', new Set(['cbte.shotgun.trap_nacional'])],
]);
for (const [documentSourceId, routeIds] of routeScopedLocalSources) {
  const doc = documents.get(documentSourceId);
  if (!doc?.pdfRow || !doc.ocrRows.length) {
    errors.push(`Fonte local aprovada sem PDF/OCR pareados: ${documentSourceId}`);
    continue;
  }
  if (!routeIds.size || !doc.routes.some((routeId) => routeIds.has(routeId))) {
    errors.push(`Fonte local aprovada sem rota correspondente no manifesto: ${documentSourceId}`);
    continue;
  }
  referencedDocumentIds.add(documentSourceId);
}

const packedDocs = [];
const ruleChunks = [];
for (const documentSourceId of [...referencedDocumentIds].sort()) {
  const doc = documents.get(documentSourceId);
  if (!doc?.pdfRow) { errors.push(`Documento referenciado sem linha PDF: ${documentSourceId}`); continue; }
  if (!doc.pdfRow.license_status?.trim()) errors.push(`PDF sem status de licença registrado: ${documentSourceId}`);
  const pdf = copyHashed(doc.pdfRow.local_pdf_path, `library/${doc.pdfRow.local_pdf_path.slice('library/'.length)}`, doc.pdfRow.pdf_sha256_observed, `PDF ${documentSourceId}`);
  const linkedOcrs = [];
  for (const ocrRow of doc.ocrRows) {
    if (!ocrRow.ocr_sha256_observed) { errors.push(`OCR sem hash observado: ${ocrRow.local_ocr_path}`); continue; }
    const ocr = copyHashed(ocrRow.local_ocr_path, `library/${ocrRow.local_ocr_path.slice('library/'.length)}`, ocrRow.ocr_sha256_observed, `OCR ${documentSourceId}`);
    const text = fs.readFileSync(localPath(ocrRow.local_ocr_path), 'utf8');
    if (!text.trim()) { errors.push(`OCR vazio: ${ocrRow.local_ocr_path}`); continue; }
    const item = { sourceId: ocrRow.source_id, path: ocr.path, sha256: ocr.sha256, bytes: ocr.bytes, humanApproval: ocrRow.human_ocr_approval || 'HUMAN_APPROVED_BY_USER_2026-11-06', citationStatus: ocrRow.citation_status, locators: dedupe((ocrRow.page_or_locator ?? '').split(';').map((value) => value.trim())) };
    linkedOcrs.push(item);
    for (const chunk of makeRuleChunks(text)) ruleChunks.push({ id: `${documentSourceId}:${linkedOcrs.length}:${ruleChunks.length}`, documentSourceId, sourceId: ocrRow.source_id, title: doc.pdfRow.title, edition: ocrRow.edition || doc.pdfRow.edition, licenseStatus: doc.pdfRow.license_status, pdfPath: pdf.path, pdfSha256: pdf.sha256, ocrPath: ocr.path, ocrSha256: ocr.sha256, humanApproval: item.humanApproval, locator: chunk.locator ?? item.locators[0] ?? '', locatorAliases: chunk.locatorAliases, text: chunk.text, referencedBy: dedupe(doc.routes) });
  }
  if (!linkedOcrs.length) errors.push(`Documento sem OCR local (${documentSourceId}).`);
  packedDocs.push({ documentSourceId, title: doc.pdfRow.title, edition: doc.pdfRow.edition, licenseStatus: doc.pdfRow.license_status, pdf, ocrs: linkedOcrs, locators: dedupe(doc.locators), referencedBy: dedupe(doc.routes) });
}

const normalizeLocatorText = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const chunksByDocument = new Map();
for (const chunk of ruleChunks) {
  const group = chunksByDocument.get(chunk.documentSourceId) ?? [];
  group.push(chunk);
  chunksByDocument.set(chunk.documentSourceId, group);
}
for (const row of atlas) {
  const documentIds = dedupe([
    ...(row.source_ids ?? []).map((sourceId) => sourceToDocument.get(sourceId)),
    ...bindings.filter((binding) => binding.atlas_id === row.atlas_id).map((binding) => binding.document_source_id),
  ].filter(Boolean));
  for (const locator of row.rule_locators ?? []) {
    const wanted = normalizeLocatorText(locator);
    if (!wanted) continue;
    for (const documentSourceId of documentIds) {
      const sourceChunks = chunksByDocument.get(documentSourceId) ?? [];
      const indexed = sourceChunks.filter((chunk) => [chunk.locator, ...(chunk.locatorAliases ?? [])].some((value) => normalizeLocatorText(value) === wanted));
      if (indexed.length) continue;
      const literalMatches = sourceChunks.filter((chunk) => ` ${normalizeLocatorText(chunk.text)} `.includes(` ${wanted} `));
      for (const chunk of literalMatches) chunk.locatorAliases = dedupe([...(chunk.locatorAliases ?? []), locator]);
      // ATLAS uses the display form "1.500" for the P5 maximum pistol weight.
      // The local appendix prints the same approved value as "1500g" in its §3 table.
      if (normalizeLocatorText(locator) === '1 500' && documentSourceId === 'ADANA-SRC-3B1650384F55C206') {
        for (const chunk of sourceChunks.filter((item) => item.locator === 'Appendix 6 §3' && /maximum pistol weight\s*1500\s*g/i.test(item.text))) {
          chunk.locatorAliases = dedupe([...(chunk.locatorAliases ?? []), locator]);
        }
      }
    }
  }
}

const cardRecords = [];
const packedDocumentById = new Map(packedDocs.map((doc) => [doc.documentSourceId, doc]));
const packedDocumentByIdSafe = (documentSourceId) => packedDocumentById.get(documentSourceId) ?? null;
const archiveDir = path.join(outputRoot, 'cards', 'old_cards');
fs.mkdirSync(archiveDir, { recursive: true });
for (const event of cardAllowlist.events ?? []) {
  for (const [phase, card] of Object.entries(event.phase_cards ?? {})) {
    const legacyPath = `${input ? 'data/imports/day1_2026-11-06/cards/assets' : ''}/${card.image}`;
    const legacySource = localPath(legacyPath);
    if (!fs.existsSync(legacySource)) { errors.push(`Card legado ausente: ${card.image}`); continue; }
    const actualCardHash = sha256(legacySource);
    if (actualCardHash !== card.asset_sha256.toLowerCase()) errors.push(`Hash do card legado divergente: ${card.image}`);
    const archived = copyHashed(legacyPath, `cards/old_cards/${card.image}`, card.asset_sha256, `Card legado ${event.event_id}/${phase}`);
    const photoName = card.background_image ?? event.background_image;
    const photoHash = card.background_image_sha256 ?? event.background_image_sha256;
    let photo = null;
    if (photoName) photo = copyHashed(`${input ? 'data/imports/day1_2026-11-06/cards/assets' : ''}/${photoName}`, `cards/photos/${photoName}`, photoHash, `Foto do card ${event.event_id}/${phase}`);
    const legacyText = extractSvgText(fs.readFileSync(legacySource, 'utf8'));
    const rawRefs = card.source_refs ?? [];
    const humanDecisionRef = rawRefs.find((reference) => reference.authority === 'USER_DECISION') ?? null;
    const docRefs = rawRefs.filter((reference) => reference.authority !== 'USER_DECISION').flatMap((reference) => {
      const documentSourceId = sourceToDocument.get(reference.source_id);
      const localDocument = documentSourceId ? packedDocumentByIdSafe(documentSourceId) : null;
      if (!documentSourceId || !referencedDocumentIds.has(documentSourceId) || !localDocument) return [];
      const { path: sourcePath, ...safeReference } = reference;
      return [{ ...safeReference, documentSourceId, localPdfPath: localDocument.pdf.path, localPdfSha256: localDocument.pdf.sha256, localEvidence: true }];
    });
    const contextRefs = docRefs.length ? [] : (event.phase_cards.qualification?.source_refs ?? []).flatMap((reference) => {
      const documentSourceId = sourceToDocument.get(reference.source_id);
      const localDocument = documentSourceId ? packedDocumentByIdSafe(documentSourceId) : null;
      if (!documentSourceId || !referencedDocumentIds.has(documentSourceId) || !localDocument) return [];
      const { path: sourcePath, ...safeReference } = reference;
      return [{ ...safeReference, documentSourceId, localPdfPath: localDocument.pdf.path, localPdfSha256: localDocument.pdf.sha256, contextOnly: true }];
    });
    if (!docRefs.length && !contextRefs.length && !humanDecisionRef) errors.push(`Card ${event.event_id}/${phase}: nenhum vínculo local de fonte ou decisão humana preservável.`);
    cardRecords.push({
      cardId: `${event.event_id}:${phase}`,
      eventId: event.event_id,
      authority: event.authority,
      event: event.event,
      phase,
      role: card.role,
      layout: 'RENATE_PHOTO_FACTS_V1',
      photoPath: photo?.path ?? null,
      photoSha256: photo?.sha256 ?? null,
      photoProvenance: card.image_provenance ?? event.image_provenance ?? 'SOURCE_ALLOWLISTED_CARD_ASSET',
      contentBlocksInOriginalOrder: legacyText,
      caption: card.caption,
      ruleReferences: card.rule_references ?? [],
      sourceRefs: docRefs,
      contextRefs,
      humanDecisionRef,
      excludedNonLocalSourceRefs: rawRefs.filter((reference) => reference.authority !== 'USER_DECISION' && !docRefs.some((local) => local.source_id === reference.source_id)).map((reference) => ({ sourceId: reference.source_id, authority: reference.authority, reason: 'SOURCE_NOT_PRESENT_IN_RENATE_ALLOWLIST' })),
      localLegacyArchive: archived.path,
      legacyAssetSha256: archived.sha256,
      calculation: card.calculation ?? null,
      normative: card.normative ?? card.source_ref_is_answer_evidence === true,
    });
  }
}

const adanaAssetPathByName = new Map();
const importedCardAssets = [];
const importedOriginalCardArchives = [];
for (const asset of adanaCardAudit.assets ?? []) {
  if (asset.state !== 'HASH_VERIFIED') { errors.push(`Asset ADANA não íntegro no snapshot: ${asset.file}`); continue; }
  const imported = copyHashed(
    `data/imports/adana_cards_2026-11-06/assets/${asset.file}`,
    `cards/adana-assets/${asset.file}`,
    asset.expectedSha256,
    `Asset importado ${asset.file}`,
  );
  adanaAssetPathByName.set(asset.file, imported.path);
  importedCardAssets.push({ ...imported, sourceName: asset.file, usedBy: asset.usedBy, kinds: asset.kinds });
}
for (const event of adanaCardSnapshot.events ?? []) {
  for (const [phase, sourceCard] of Object.entries(event.phase_cards ?? {})) {
    if (!sourceCard.image || !sourceCard.image.toLowerCase().endsWith('.svg')) continue;
    importedOriginalCardArchives.push({
      cardId: `${event.event_id}:${phase}`,
      ...copyHashed(`data/imports/adana_cards_2026-11-06/assets/${sourceCard.image}`, `cards/old_cards/adana/${sourceCard.image}`, sourceCard.asset_sha256, `Arquivo original ${event.event_id}/${phase}`),
    });
  }
}

const approvalPath = 'data/imports/adana_cards_2026-11-06/governance/p6_cards_human_review_20261105.json';
const p6Approval = readJson(approvalPath);
const p6ApprovalPack = copyHashed(approvalPath, 'cards/governance/p6_cards_human_review_20261105.json', sha256(localPath(approvalPath)), 'Governança dos cards P6');
const r6PhotoSourcePath = 'data/imports/web_sources/R6_RIO2016_QUALIFICATION_THOMAS_LOVELOCK_OIS_IOC.jpg';
const r6PhotoMetadataPath = 'data/imports/web_sources/R6_RIO2016_QUALIFICATION_THOMAS_LOVELOCK_OIS_IOC.json';
const r6PhotoMetadata = readJson(r6PhotoMetadataPath);
const r6PhotoPack = copyHashed(r6PhotoSourcePath, 'cards/photos/R6_RIO2016_QUALIFICATION_THOMAS_LOVELOCK_OIS_IOC.jpg', r6PhotoMetadata.sha256, 'Foto ilustrativa R6');
const r3ProneImagePack = copyHashed('data/imports/generated_card_images_2026-11-06/RENATE_R3_R10_SH1_PRONE_10M.png', 'cards/photos/RENATE_R3_R10_SH1_PRONE_10M.png', '2d1f06128049c434bd4cf2e52fc8df93958a21d4098a256978d40921231f4cb8', 'Ilustração R3/R10 SH1 aprovada');
const r4QualificationPhoto = copyHashed('img/R4_wsps.png', 'cards/photos/R4_WSPS_USER_PROVIDED_1.png', '3c0824552fc0a3a9d3e0f9808069c87945985e5cd9267ff71eecff6a2da30034', 'Foto R4 fornecida pelo usuário');
const r4FinalPhoto = copyHashed('img/R4_2_wsps.png', 'cards/photos/R4_WSPS_USER_PROVIDED_2.png', 'dbad8697e57bbad640db1c01a50c4df5657d166b24f815cc57e1cef25843ab7b', 'Foto R4 fornecida pelo usuário');
const r7KneelingPhoto = copyHashed('img/R7_kneeling_wsps.png', 'cards/photos/R7_SH1_KNEELING_USER_PROVIDED.png', '1eff81acb598afd2dc570834571a3a59b30fd43fd00eb5f132a7ff61ee98255c', 'Foto R7 ajoelhado fornecida pelo usuário');
const r7PronePhoto = copyHashed('img/R7_prone_wsps.png', 'cards/photos/R7_SH1_PRONE_USER_PROVIDED.png', 'cec0b8e2da63028e188d78e13e7c5ce0cd03ae4535731923cdd9daed4588afbb', 'Foto R7 deitado fornecida pelo usuário');
const r7StandingPhoto = copyHashed('img/R7_standing_wsps.png', 'cards/photos/R7_SH1_STANDING_USER_PROVIDED.png', '75ed2d5198152b69375a6595dd31f69113d6c2f465691383f62b9d652033a198', 'Foto R7 em pé fornecida pelo usuário');
const r8StandingQualificationPhoto = copyHashed('img/R8_standing_wsps.png', 'cards/photos/R8_SH1_STANDING_USER_PROVIDED_1.png', '65b1b5a4858f7cf22b82360a3d5639e9886f399e4e7b70c7b9d227cded195010', 'Foto R8 em pé fornecida pelo usuário');
const r8StandingFinalPhoto = copyHashed('img/R8_standing_wsps_2.png', 'cards/photos/R8_SH1_STANDING_USER_PROVIDED_2.png', '29dd4ce3e9d94472327c5f23b755f62bdb3e7bd95a024c50a7308a11775f6ee9', 'Foto R8 em pé fornecida pelo usuário');
const p3Photo = copyHashed('img/WSPS_P3.png', 'cards/photos/WSPS_P3.png', null, 'Foto local da prova WSPS P3');
const p5Photo = copyHashed('img/WSPS_P5.png', 'cards/photos/WSPS_P5.png', null, 'Foto local da prova WSPS P5 SH1');
const duelPhoto = copyHashed('img/Duelo_20_10m_photo_reused.png', 'cards/photos/Duelo_20_photo_reused.png', null, 'Imagem fotorrealista reutilizada entre Duelo 20 s 10 m e 25 m');
const eventPhotoSources = {
  'issf.event.01': ['library/img/CARDS_PROVAS/ISSF_10m_Air_Rifle_Position_Realistic.png', 'Rifle ISSF 10 m; ilustração fotorrealista local'],
  'issf.event.02': ['img/3P_50m_ISSF.jpg', 'Rifle ISSF 50 m três posições'],
  'issf.event.03': ['img/50m-prone_ISSF.jpeg', 'Rifle ISSF 50 m deitado'],
  'issf.event.04': ['img/3P_300m_ISSF.jpg', 'Rifle ISSF 300 m três posições'],
  'issf.event.05': ['img/300m_prone_ISSF.png', 'Rifle ISSF 300 m deitado'],
  'issf.event.06': ['img/300M_STD_ISSF.jpg', 'Rifle ISSF 300 m standard'],
  'issf.event.08': ['img/25m_Pistol_ISSF.jpeg', 'Pistola ISSF 25 m'],
  'issf.event.09': ['img/rapidfire_pistol_ISSF.jpeg', 'Pistola ISSF 25 m tiro rápido'],
  'issf.event.10': ['img/25m_Center_Fire_ISSF.jpeg', 'Pistola ISSF 25 m center fire'],
  'issf.event.11': ['img/Standard_25m_ISSF.jpeg', 'Pistola ISSF 25 m standard'],
  'issf.event.12': ['img/Free_pistol_50m_ISSF.jpeg', 'Pistola ISSF 50 m'],
  'issf.event.13': ['img/Trap_ISSF.jpeg', 'Trap ISSF'],
  'issf.event.14': ['img/Skeet_ISSF.jpeg', 'Skeet ISSF'],
  'issf.event.15': ['img/MovTgt_10m_ISSF.jpeg', 'Alvo móvel ISSF 10 m'],
  'issf.event.16': ['img/MovTgt_Mix_ISSF.jpeg', 'Alvo móvel ISSF 10 m misto'],
  'issf.event.17': ['img/MovTgt_50m_ISSF.jpeg', 'Alvo móvel ISSF 50 m'],
  'issf.event.18': ['img/MovTgt_50m_MIX_ISSF.jpeg', 'Alvo móvel ISSF 50 m misto'],
  'cbte.duelo.10m': ['img/Duelo_20_10m_photo_reused.png', 'Duelo 20 s 10 m'],
  'cbte.duelo.25m': ['img/Duelo_20_10m_photo_reused.png', 'Duelo 20 s 25 m; imagem reutilizada da prova de 10 m'],
  'cbte.shotgun.automatic_trap': ['img/Trap_ISSF.jpeg', 'Fossa Automática CBTE; imagem de Trap reutilizada por decisão do usuário'],
  'cbte.shotgun.trap_light': ['img/Skeet_ISSF.jpeg', 'Skeet Light CBTE; imagem de Skeet reutilizada por decisão do usuário'],
  'cbte.shotgun.trap_nacional': ['img/Trap_ISSF.jpeg', 'Trap Nacional; imagem de Trap reutilizada por decisão do usuário'],
  'cbte.shotgun.trap_nacional_25_2024': ['img/Trap_ISSF.jpeg', 'Trap Nacional 25; imagem de Trap reutilizada por decisão do usuário'],
  'cbte.shotgun.trap_nacional_50_2024': ['img/Trap_ISSF.jpeg', 'Trap Nacional 50; imagem de Trap reutilizada por decisão do usuário'],
};
const eventPhotoPacks = new Map(Object.entries(eventPhotoSources).map(([eventId, [sourcePath, alt]]) => [
  eventId,
  { ...copyHashed(sourcePath, `cards/photos/${path.basename(sourcePath)}`, null, `Imagem de evento ${eventId}`), alt, kind: eventId === 'issf.event.01' ? 'photorealistic_illustration' : 'event_photo' },
]));
const eventPhotoFor = (eventId, eventName = '') => {
  if (eventId === 'cbte.shotgun.issf') {
    const isSkeet = /skeet/i.test(eventName);
    const sourcePath = isSkeet ? 'img/Skeet_ISSF.jpeg' : 'img/Trap_ISSF.jpeg';
    return { ...copyHashed(sourcePath, `cards/photos/${path.basename(sourcePath)}`, null, `Foto ${isSkeet ? 'Skeet' : 'Trap'} olímpico`), alt: isSkeet ? 'Atleta em prova de Skeet; imagem compartilhada com Skeet CBTE.' : 'Atleta em prova de Trap; imagem compartilhada com Fossa, Trap e Trap Nacional conforme decisão do usuário.', kind: 'event_photo' };
  }
  if (eventId === 'cbte.duelo.10m' || eventId === 'cbte.duelo.25m') return { ...duelPhoto, alt: eventId === 'cbte.duelo.25m' ? 'Imagem fotorrealista da prova Duelo 20 s, reutilizada da prova de 10 m por decisão do usuário.' : 'Imagem fotorrealista da prova Duelo 20 s a 10 m.', kind: 'photorealistic_illustration' };
  return eventPhotoPacks.get(eventId) ?? null;
};
const slotLabels = {
  event_identity: 'Identificação do evento', gender_class: 'Gênero e classe', discipline_distance: 'Modalidade e distância',
  caliber_and_energy: 'Calibre e energia', team_eligibility: 'Elegibilidade da equipe', shot_count: 'Número de disparos',
  time_and_target_mode: 'Tempo e modo de alvo', target_type: 'Tipo de alvo', team_positions: 'Posições da equipe',
  call_and_setup: 'Apresentação e preparação', preparation_sighting: 'Preparação e ensaio', scoring_format: 'Pontuação',
  maximum_score_rag: 'Máximo teórico (cálculo)', ranking_and_tie_break: 'Classificação e desempate',
  final_qualification: 'Classificação para a final', coaching: 'Orientação técnica', series_format: 'Formato das séries',
  finalists: 'Finalistas', series_and_shots: 'Séries e disparos', elimination_sequence: 'Sequência de eliminações',
  final_tie_break: 'Desempate da final', report_and_setup: 'Apresentação e montagem', commands_and_roles: 'Comandos e funções',
  team_ranking: 'Classificação da equipe',
};
const importedCardCatalog = [];
const p6RuntimeCards = [];
const importedRuntimeCards = [];
for (const event of adanaCardSnapshot.events ?? []) {
  for (const [phase, sourceCard] of Object.entries(event.phase_cards ?? {})) {
    const cardId = `${event.event_id}:${phase}`;
    const phaseApproval = p6Approval.cards?.[phase];
    const assetPath = sourceCard.image ? adanaAssetPathByName.get(sourceCard.image) ?? null : null;
    const backgroundPath = sourceCard.background_image ? adanaAssetPathByName.get(sourceCard.background_image) ?? null : null;
    const sourceReviewState = sourceCard.draft_review_state ?? 'NOT_RECORDED_IN_SOURCE_CATALOG';
    const approvalMatches = event.event_id === p6Approval.route_id
      && p6Approval.state === 'HUMAN_APPROVED'
      && phaseApproval?.sha256 === sourceCard.asset_sha256;
    const localSourceRefs = (sourceCard.source_refs ?? []).map((reference) => {
      const documentSourceId = sourceToDocument.get(reference.source_id);
      const document = documentSourceId ? packedDocumentByIdSafe(documentSourceId) : null;
      return {
        sourceId: reference.source_id,
        authority: reference.authority,
        edition: reference.edition,
        sourceSha256: reference.source_sha256,
        documentSourceId: documentSourceId ?? null,
        sourcePresentLocally: Boolean(document),
        localPdfPath: document?.pdf.path ?? null,
        localPdfSha256: document?.pdf.sha256 ?? null,
      };
    });
    const sourceStatus = assetPath
      ? approvalMatches ? 'READY_HUMAN_APPROVED' : 'IMPORTED_REVIEW_STATUS_NOT_RECORDED'
      : sourceCard.image ? 'NOT_READY_ASSET_INTEGRITY' : 'MISSING_ASSET_DEFINITION';
    const catalogRecord = {
      cardId,
      eventId: event.event_id,
      authority: event.authority,
      event: event.event,
      phase,
      role: sourceCard.role,
      sourceReviewState,
      runtimeStatus: sourceStatus,
      sourceAsset: { originalName: sourceCard.image ?? null, sha256: sourceCard.asset_sha256 ?? null, localPath: assetPath },
      backgroundAsset: { originalName: sourceCard.background_image ?? event.background_image ?? null, sha256: sourceCard.background_image_sha256 ?? event.background_image_sha256 ?? null, localPath: backgroundPath },
      caption: sourceCard.caption ?? event.caption ?? '',
      ruleReferences: sourceCard.rule_references ?? [],
      sourceReferences: localSourceRefs,
      slotCount: Object.keys(sourceCard.slot_values ?? {}).length,
      sourceApproval: approvalMatches ? { state: p6Approval.state, evidencePath: p6ApprovalPack.path, evidenceSha256: p6ApprovalPack.sha256, approvedAssetSha256: phaseApproval.sha256 } : null,
      assetPolicy: adanaCardSnapshot.asset_policy,
    };
    importedCardCatalog.push(catalogRecord);
    if (approvalMatches) {
      const displayRows = Object.entries(sourceCard.slot_values ?? {}).map(([slotId, slot]) => ({
        slotId,
        label: slotLabels[slotId] ?? slotId.replaceAll('_', ' '),
        value: slot.value,
        authority: slot.authority,
        locator: slot.locator,
        valueMode: slot.value_mode,
        sourceId: slot.source_id,
        sourceSha256: slot.source_sha256,
      }));
      p6RuntimeCards.push({
        cardId, eventId: event.event_id, authority: event.authority, event: event.event, phase,
        role: sourceCard.role, layout: 'RENATE_P6_SOURCE_FACTS_V1', skinReference: 'wsps.event.p6',
        photoPath: backgroundPath, photoSha256: sourceCard.background_image_sha256 ?? event.background_image_sha256,
        photoProvenance: sourceCard.image_provenance ?? event.image_provenance,
        displayRows, caption: sourceCard.caption, ruleReferences: sourceCard.rule_references ?? [],
        sourceRefs: localSourceRefs.filter((reference) => reference.sourcePresentLocally).map((reference) => ({ ...reference, localEvidence: true })),
        sourceApproval: catalogRecord.sourceApproval,
        localLegacyArchive: assetPath,
        legacyAssetSha256: sourceCard.asset_sha256,
        normative: false,
        figureCrops: [],
      });
    } else if (sourceCard.image && assetPath && !cardRecords.some((record) => record.cardId === cardId)) {
      const sourceAsset = sourceCard.image ? localPath(`data/imports/adana_cards_2026-11-06/assets/${sourceCard.image}`) : null;
      const sourceText = sourceAsset && sourceCard.image.toLowerCase().endsWith('.svg')
        ? extractSvgText(fs.readFileSync(sourceAsset, 'utf8'))
        : [];
      const photoName = sourceCard.background_image ?? event.background_image ?? event.image;
      const photoPath = event.event_id === 'wsps.event.r6' ? r6PhotoPack.path : photoName ? adanaAssetPathByName.get(photoName) ?? null : null;
      const r6DisplaySections = event.event_id !== 'wsps.event.r6' ? null : phase === 'qualification' ? [
        { heading: 'Formato da prova', items: ['60 tiros · 50 metros', '50 min com alvos eletrônicos ou 60 min com porta-alvos/poço', '15 min para preparação e tiros de ensaio'] },
        { heading: 'Posições permitidas', items: ['Deitado no solo · posição ISSF', 'Cadeira + mesa · adaptação SH1'] },
        { heading: 'Posição sentada · regras SH1', items: ['Ambos os cotovelos apoiados na mesa ou prancha.', 'Braços superiores sem tocar a mesa; antebraços a pelo menos 30° da horizontal.'] },
        { heading: 'Pontuação', items: ['60 × 10,9 = 654,0 · máximo teórico quando se aplica o decimal ISSF.'] },
        { heading: 'Referências do card', items: ['WSPS Technical Rules 2026, 4.1.3 e 4.2.2.3–4.2.2.5, pp. 39 e 41–42; ISSF Rule Book 2026, 6.11.9.3 e 7.7.5.'] },
      ] : [
        { heading: 'Formato da final', items: ['8 finalistas · 24 tiros', '2 séries de 5 tiros · até 150 s por série', 'Depois: tiros individuais · 30 s por tiro', 'Preparação e ensaio: 5 min · comandos WSPS.'] },
        { heading: 'Eliminações progressivas', items: ['Após 12 tiros · sai o 8º', 'Após 14 tiros · sai o 7º', 'Após 16 tiros · sai o 6º', 'Após 18 tiros · sai o 5º', 'Após 20 tiros · sai o 4º', 'Após 22 tiros · disputa do 3º/bronze', 'Após 24 tiros · disputa do 1º/2º'] },
        { heading: 'Desempate', items: ['Empate na eliminação: tiro(s) extra(s) individual(is) até desempatar.'] },
        { heading: 'Adaptação SH1', items: ['No modo cadeira + mesa, aplicam-se os limites de postura do WSPS 4.2.2.5.'] },
        { heading: 'Referências do card', items: ['WSPS 4.1.9 e 4.2.2.3–4.2.2.5; WSPS Finals Commands 2026, aba R6; ISSF 7.7.5.'] },
      ];
      const safeSourceRefs = localSourceRefs.map((reference) => ({
        sourceId: reference.sourceId,
        authority: reference.authority,
        edition: reference.edition,
        sourceSha256: reference.sourceSha256,
        documentSourceId: reference.documentSourceId,
        localEvidence: reference.sourcePresentLocally,
        localPdfPath: reference.localPdfPath,
        localPdfSha256: reference.localPdfSha256,
      }));
      importedRuntimeCards.push({
        cardId, eventId: event.event_id, authority: event.authority, event: event.event, phase,
        role: sourceCard.role, layout: 'RENATE_P6_SOURCE_FACTS_V1', skinReference: 'wsps.event.p6',
        cardKind: 'phase', sourceReviewState, runtimeReviewDisclosure: sourceReviewState,
        photoPath, photoSha256: photoName ? (sourceCard.background_image_sha256 ?? event.background_image_sha256 ?? event.asset_sha256) : null,
        photoProvenance: sourceCard.image_provenance ?? event.image_provenance ?? 'SOURCE_ALLOWLISTED_CARD_ASSET',
        ...(event.event_id === 'wsps.event.r6' ? {
          photoPath: r6PhotoPack.path,
          photoSha256: r6PhotoPack.sha256,
          photoProvenance: `${r6PhotoMetadata.credit}; ${r6PhotoMetadata.sourcePage}`,
          photoAlt: 'Atletas na qualificação R6 SH1 do Rio 2016; a foto não mostra suporte sob as armas.',
          photoCredit: r6PhotoMetadata.credit,
          photoSourcePage: r6PhotoMetadata.sourcePage,
          photoNote: 'Foto histórica do R6 em Rio 2016. O termo “Mixed” na fonte pertence à nomenclatura daquela edição; não altera a regra atual de Open nem indica equipe mista.',
          clarificationText: 'OPEN: homens e mulheres podem participar. Open não significa equipe mista.',
          displaySections: r6DisplaySections,
        } : {}),
        contentBlocksInOriginalOrder: sourceText.length ? sourceText : [sourceCard.caption ?? event.caption ?? 'Card visual complementar.'],
        caption: sourceCard.caption ?? event.caption ?? '',
        ruleReferences: sourceCard.rule_references ?? [], sourceRefs: safeSourceRefs,
        sourceApproval: null,
        localLegacyArchive: sourceCard.image ? `./cards/old_cards/adana/${sourceCard.image}` : null,
        legacyAssetSha256: sourceCard.asset_sha256 ?? null,
        normative: false, figureCrops: [],
      });
    }
  }
}
for (const equipment of adanaCardSnapshot.equipment_cards ?? []) {
  importedCardCatalog.push({
    cardId: equipment.id,
    eventIds: equipment.event_ids ?? [],
    authority: equipment.authorities ?? [],
    category: 'equipment',
    role: equipment.role,
    sourceReviewState: 'NOT_RECORDED_IN_SOURCE_CATALOG',
    runtimeStatus: 'IMPORTED_REVIEW_STATUS_NOT_RECORDED',
    sourceAsset: { originalName: equipment.image, sha256: equipment.asset_sha256, localPath: adanaAssetPathByName.get(equipment.image) ?? null },
    linkedIllustration: equipment.linked_illustration ? {
      originalName: equipment.linked_illustration.image,
      sha256: equipment.linked_illustration.asset_sha256,
      localPath: adanaAssetPathByName.get(equipment.linked_illustration.image) ?? null,
      role: equipment.linked_illustration.role,
    } : null,
    caption: equipment.caption,
    ruleReferences: equipment.rule_references ?? [],
    sourceReferences: (equipment.source_refs ?? []).map((reference) => {
      const documentSourceId = sourceToDocument.get(reference.source_id);
      const document = documentSourceId ? packedDocumentByIdSafe(documentSourceId) : null;
      return { sourceId: reference.source_id ?? null, authority: reference.authority, edition: reference.edition, sourceSha256: reference.source_sha256, documentSourceId: documentSourceId ?? null, sourcePresentLocally: Boolean(document), localPdfPath: document?.pdf.path ?? null, localPdfSha256: document?.pdf.sha256 ?? null };
    }),
    assetPolicy: adanaCardSnapshot.asset_policy,
  });
}

const cropManifestPath = 'data/imports/day1_2026-11-06/figure-crops/manifest.json';
const cropManifest = fs.existsSync(path.join(root, cropManifestPath)) ? readJson(cropManifestPath) : { entries: [] };
const packedFigureCrops = [];
for (const crop of cropManifest.entries ?? []) {
  const document = packedDocumentById.get(crop.document_source_id);
  if (!document) { errors.push(`Recorte ${crop.figure_id}: documento não está no pacote local (${crop.document_source_id}).`); continue; }
  if (document.pdf.sha256 !== String(crop.pdf_sha256).toLowerCase()) { errors.push(`Recorte ${crop.figure_id}: hash do PDF de origem diverge.`); continue; }
  if (!crop.human_visual_review?.startsWith('VISUALLY_CHECKED_')) errors.push(`Recorte ${crop.figure_id}: falta conferência visual registrada.`);
  if (!Number.isInteger(crop.page) || crop.page < 1 || !crop.locator) errors.push(`Recorte ${crop.figure_id}: página ou localizador ausente.`);
  const asset = copyHashed(crop.asset_source_path, `figures/${crop.figure_id}.png`, crop.asset_sha256, `Recorte PDF ${crop.figure_id}`);
  packedFigureCrops.push({ ...crop, assetPath: asset.path, assetSha256: asset.sha256, assetBytes: asset.bytes });
}
for (const card of [...cardRecords, ...p6RuntimeCards]) card.figureCrops = packedFigureCrops.filter((crop) => crop.event_ids.includes(card.eventId));
const runtimeCardRecords = [...cardRecords, ...p6RuntimeCards, ...importedRuntimeCards];

// Normalize every active qualification/final card to the same readable sections.
// Source text and citations are retained; this only changes its presentation.
function cardSectionsFromLines(lines = []) {
  const sections = [];
  const headingPattern = /^(IDENTIDADE|FORMATO|FORMATO DA PROVA|FORMATO DA QUALIFICAÇÃO|FORMATO DA FINAL|POSIÇÃO|POSIÇÕES PERMITIDAS|POSIÇÃO E APOIO|POSIÇÃO SENTADA|ARMAMENTO|ARMA E DISTÂNCIA|ARMA\/POSIÇÃO|TEMPO|TEMPO DE PROVA WSPS|PREPARAÇÃO|PREPARAÇÃO E VISADA|PONTUAÇÃO|PONTUAÇÃO \/ AVANÇO|PONTUAÇÃO \/ SISTEMA DECIMAL|ALVO|SÉRIES|SEQUÊNCIA|SEQUÊNCIA DA FINAL|ELIMINAÇÕES|ELIMINAÇÕES \/ PONTUAÇÃO|DESEMPATE|FINALISTAS|FASE INICIAL|TIROS INDIVIDUAIS|COMPOSIÇÃO|DISPAROS|CALIBRE|CLASSIFICAÇÃO|REFERÊNCIAS DE CONSULTA|BASE NORMATIVA.*|REGRAS E LOCALIZADORES.*|REGRAS E REFERÊNCIAS.*|ATENÇÃO À FONTE OPERACIONAL|STATUS DA FINAL|STATUS)$/i;
  const isHeading = (line) => {
    const clean = line.trim().replace(/[·•|]+$/g, '').trim();
    if (headingPattern.test(clean)) return true;
    return clean.length <= 64 && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(clean)
      && clean === clean.toLocaleUpperCase('pt-BR') && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3}/.test(clean);
  };
  const add = (heading, item) => {
    let section = sections.at(-1);
    if (!section || section.heading !== heading) { section = { heading, items: [] }; sections.push(section); }
    if (item && !section.items.includes(item)) section.items.push(item);
  };
  for (const raw of lines) {
    const line = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (/^(WSPS\s*[·•]|TIRO ESPORTIVO PARALÍMPICO MUNDIAL|WORLD SHOOTING PARA SPORT|DISCIPLINE CARD)/i.test(line)) continue;
    if (/^(QUALIFICAÇÃO|FINAL|FASE FINAL)$/i.test(line)) continue;
    if (/^(Card complementar|Complemento visual|Imagem ilustrativa|Ilustração .*não normativa|Ilustração .*não é fotografia|Visual ilustrativo|Resumo visual complementar|Card visual complementar)/i.test(line)) continue;
    if (/^(Fontes?:|Normas?:|Fonte:|WSPS\s*§|ISSF\s*§|P\d+ Commands|.*Commands 2026|.*worksheet.*linhas|BASE NORMATIVA)/i.test(line)) {
      add('Fontes e localizadores', line); continue;
    }
    if (isHeading(line)) { add(line.replace(/[·•|]+$/g, '').trim(), ''); continue; }
    add('Dados da prova', line);
  }
  return sections.filter((section) => section.items.length);
}

for (const card of runtimeCardRecords) {
  // A full-card SVG is not a photo. Use only a separate local raster illustration/photo.
  if (card.photoPath?.toLowerCase().endsWith('.svg')) {
    card.photoPath = null;
    card.photoSha256 = null;
    card.photoProvenance = null;
  }
  if (!card.displaySections?.length && card.displayRows?.length) {
    const groups = new Map();
    for (const row of card.displayRows) {
      const group = row.slotId.includes('final') || row.slotId.includes('elimination') ? 'Final e eliminações'
        : row.slotId.includes('shot') || row.slotId.includes('series') || row.slotId.includes('time') ? 'Formato da prova'
          : row.slotId.includes('team') || row.slotId.includes('ranking') ? 'Equipe e classificação'
            : row.slotId.includes('target') || row.slotId.includes('equipment') || row.slotId.includes('caliber') ? 'Alvo e equipamento'
              : 'Dados da prova';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(`${row.label}: ${row.value}${row.locator ? ` · ${row.authority} ${row.locator}` : ` · ${row.authority}`}`);
    }
    card.displaySections = [...groups].map(([heading, items]) => ({ heading, items }));
  }
  if (!card.displaySections?.length) card.displaySections = cardSectionsFromLines(card.contentBlocksInOriginalOrder);
  card.layout = 'RENATE_UNIFIED_CARD_V1';
  card.skinReference = 'RENATE_R6_APPROVED_VISUAL_MODEL';
  card.category ??= 'event_phase';
}

// Close two sparse cards with event facts transcribed from the RENATE-local 2026 WSPS OCR.
const r3Facts = [
  { heading: 'Identidade e formato', items: ['R3 · 10 m Air Rifle Prone · Open SH1', '60 disparos de qualificação'] },
  { heading: 'Tempo de prova', items: ['50 min com alvos eletrônicos', '60 min com transportadores de alvo ou competição pit-operated'] },
  { heading: 'Adaptação SH1', items: ['Em 10 m prone, o atleta não pode deitar: usa cadeira de tiro e mesa.', 'Ambos os cotovelos apoiam na mesa ou prancha; braços superiores não tocam a superfície; antebraços a pelo menos 30° da horizontal.'] },
  { heading: 'Fontes e localizadores', items: ['WSPS Technical Rules 2026 §§2.1.1, 4.1.3, 4.2.2.4 e 4.2.2.5(a–c), pp. 11, 39 e 42–43.'] },
];
const r5QualificationFacts = [
  { heading: 'Identidade e formato', items: ['R5 · 10 m Air Rifle Prone · Open SH2', '60 disparos de qualificação'] },
  { heading: 'Tempo de prova', items: ['1 h com alvos eletrônicos', '1 h 10 min com transportadores de alvo ou competição pit-operated'] },
  { heading: 'Fontes e localizadores', items: ['WSPS Technical Rules 2026 §§2.1.1 e 4.1.3, pp. 11 e 39.'] },
];
const r5FinalFacts = [
  { heading: 'Identidade da prova', items: ['R5 · 10 m Air Rifle Prone · Open SH2 · Final'] },
  { heading: 'Tempos e comandos', items: ['As finais seguem os tempos ISSF, salvo especificação WSPS diferente (WSPS 4.1.9.1).', 'A sequência e os comandos específicos da final R5 devem ser conferidos no documento WSPS Finals Commands. Esse documento não está no pacote local de regras.'] },
  { heading: 'Operação SH2', items: ['Atleta/loader: concluir o carregamento em até 10 segundos após “LOAD” (WSPS 4.1.9.4).', 'Durante a final, o loader fica 1 m atrás do atleta entre disparos e só retorna após “STOP” na série de tiro individual (WSPS 4.1.9.2).'] },
  { heading: 'Segurança e localizadores', items: ['Não tocar no rifle com pellet/bullet antes do comando “LOAD” (WSPS 4.1.9.3).', 'WSPS Technical Rules 2026 §§2.1.1 e 4.1.9.1–4.1.9.4, pp. 11 e 40–41.'] },
];
for (const card of runtimeCardRecords) {
  if (card.cardId.startsWith('wsps.event.r3:')) card.displaySections = r3Facts;
  if (card.cardId === 'wsps.event.r5:qualification') card.displaySections = r5QualificationFacts;
  if (card.cardId === 'wsps.event.r5:final') {
    card.displaySections = r5FinalFacts;
    card.sourceRefs = [sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['2.1.1', '4.1.9.1–4.1.9.4'])].filter(Boolean);
    card.ruleReferences = ['WSPS Technical Rules 2026 §§2.1.1 e 4.1.9.1–4.1.9.4, pp. 11 e 40–41'];
  }
  card.displaySections = card.displaySections?.map((section) => ({ ...section, items: [...section.items] })) ?? [];
}

// Apply only the six image candidates explicitly approved for RENATE cards.
// Other source art stays in the local archive and is not presented as a photo.
const approvedCardImages = {
  'wsps.event.p1': { path: './cards/photos/ADANA_WSPS_P1_AIR_PISTOL_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de atleta P1 SH1 em cadeira de rodas, com pistola de ar em posição de tiro.' },
  'wsps.event.p2': { path: './cards/adana-assets/ADANA_WSPS_P2_AIR_PISTOL_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de atleta P2 SH1 em cadeira de rodas, com pistola de ar em posição de tiro.' },
  'wsps.event.p3': { path: p3Photo.path, kind: 'event_photo', alt: 'Atleta WSPS P3 em prova de pistola 25 m; a imagem é complementar e os fatos normativos estão no card.' },
  'wsps.event.p4': { path: './cards/photos/ADANA_WSPS_P4_PARALYMPIC_RANGE_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de prova de pistola paralímpica em estande.' },
  'wsps.event.p5': { path: p5Photo.path, kind: 'event_photo', alt: 'Atleta WSPS P5 SH1 em prova de pistola de ar 10 m; o card P5 não possui fase final.', note: 'P5 é classe SH1. A prova não possui fase final.' },
  'wsps.event.p6': { path: './cards/adana-assets/ADANA_WSPS_P6_MIXED_AIR_PISTOL_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de equipe P6 de pistola de ar em estande.' },
  'wsps.event.r3': { path: r3ProneImagePack.path, kind: 'photorealistic_illustration', alt: 'Ilustração R3 SH1 10 m prone: atleta em cadeira e mesa, rifle sem qualquer apoio sob a arma.' },
  'wsps.event.r4': {
    qualification: { path: r4QualificationPhoto.path, kind: 'official_user_provided_photo', alt: 'Fotografia oficial fornecida pelo usuário da prova R4, rifle de ar 10 m em pé SH2, com suporte de rifle permitido para SH2.', note: 'Captura oficial do evento R4 fornecida pelo usuário. A fase exata retratada não foi confirmada visualmente.' },
    final: { path: r4FinalPhoto.path, kind: 'official_user_provided_photo', alt: 'Fotografia oficial fornecida pelo usuário de atletas da prova R4, rifle de ar 10 m SH2, com suportes permitidos para SH2.', note: 'Fotografia oficial da competição R4 fornecida pelo usuário. A fase exata retratada não foi confirmada visualmente.' },
  },
  'wsps.event.r7': {
    qualification: { path: r7StandingPhoto.path, kind: 'official_user_provided_photo', alt: 'Atleta R7 SH1 na posição em pé; as três posições da prova são mostradas abaixo.', note: 'Os apoios que aparecem nas fotos são suportes de descanso; não sustentam o rifle durante o tiro.', gallery: [
      { path: r7KneelingPhoto.path, sha256: r7KneelingPhoto.sha256, label: 'Ajoelhado', alt: 'Atleta R7 SH1 na posição ajoelhada.' },
      { path: r7PronePhoto.path, sha256: r7PronePhoto.sha256, label: 'Deitado', alt: 'Atleta R7 SH1 na posição deitada.' },
      { path: r7StandingPhoto.path, sha256: r7StandingPhoto.sha256, label: 'Em pé', alt: 'Atleta R7 SH1 na posição em pé.' },
    ] },
    final: { path: r7StandingPhoto.path, kind: 'official_user_provided_photo', alt: 'Atleta R7 SH1 na posição em pé durante a final.', note: 'Os apoios que aparecem nas fotos são suportes de descanso; não sustentam o rifle durante o tiro.', gallery: [
      { path: r7StandingPhoto.path, sha256: r7StandingPhoto.sha256, label: 'Em pé', alt: 'Atleta R7 SH1 na posição em pé.' },
    ] },
  },
  'wsps.event.r8': {
    qualification: { path: r8StandingQualificationPhoto.path, kind: 'official_user_provided_photo', alt: 'Atleta R8 SH1 na posição em pé; foto oficial fornecida pelo usuário.', note: 'Imagem da posição em pé; as demais posições constam no conteúdo do card.', gallery: [
      { path: r8StandingQualificationPhoto.path, sha256: r8StandingQualificationPhoto.sha256, label: 'Em pé', alt: 'Atleta R8 SH1 na posição em pé.' },
    ] },
    final: { path: r8StandingFinalPhoto.path, kind: 'official_user_provided_photo', alt: 'Atleta R8 SH1 na posição em pé durante a final; foto oficial fornecida pelo usuário.', note: 'Imagem da posição em pé; consulte o conteúdo do card para a sequência da prova.', gallery: [
      { path: r8StandingFinalPhoto.path, sha256: r8StandingFinalPhoto.sha256, label: 'Em pé', alt: 'Atleta R8 SH1 na posição em pé.' },
    ] },
  },
  'wsps.event.r5': { path: './cards/adana-assets/WSPS_R5_10m_Air_Rifle_SH2_Phase_2026.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de atleta R5 SH2 usando suporte de rifle; não representa eventos SH1.', note: 'O apoio visível pertence à ilustração da prova SH2. Não se aplica a cards SH1.' },
  'wsps.event.r9': { path: './cards/adana-assets/WSPS_R5_10m_Air_Rifle_SH2_Phase_2026.png', kind: 'photorealistic_illustration', alt: 'Ilustração de posição prone SH2 com suporte, compartilhada entre R5/R9; o armamento e a distância podem diferir do evento R9.', note: 'Imagem reutilizada por mostrar a posição prone SH2; não use como referência para distância ou calibre.' },
  'wsps.event.r10': { path: r3ProneImagePack.path, kind: 'photorealistic_illustration', alt: 'Ilustração da posição prone adaptada SH1; compartilhada com R3. Não representa a composição de equipe mista R10.', note: 'Imagem de posição SH1 compartilhada; o formato de equipe mista está descrito no conteúdo do card.' },
  'wsps.event.r11': { path: './cards/adana-assets/WSPS_R5_10m_Air_Rifle_SH2_Phase_2026.png', kind: 'photorealistic_illustration', alt: 'Ilustração de posição prone SH2 com suporte, compartilhada com R5/R9; não mostra a composição completa da equipe R11.', note: 'Imagem reutilizada por mostrar a posição prone SH2; conteúdo do card define equipe mista R11.' },
};
for (const card of runtimeCardRecords) {
  if (card.eventId === 'wsps.event.r6') {
    card.imageKind = 'historical_photograph';
    continue;
  }
  const eventImages = approvedCardImages[card.eventId];
  const approvedImage = eventImages?.[card.phase] ?? eventImages;
  if (!approvedImage) {
    card.photoPath = null;
    card.photoSha256 = null;
    card.photoProvenance = null;
    card.imageKind = null;
    continue;
  }
  const imageFile = path.join(outputRoot, approvedImage.path.slice(2));
  if (!fs.existsSync(imageFile)) { errors.push(`Imagem aprovada ausente para ${card.cardId}: ${approvedImage.path}`); continue; }
  card.photoPath = approvedImage.path;
  card.photoSha256 = sha256(imageFile);
  card.photoGallery = approvedImage.gallery ?? null;
  card.photoProvenance = approvedImage.kind === 'official_user_provided_photo'
    ? 'FOTOGRAFIA_FORNECIDA_PELO_USUARIO; DESCRITA_PELO_USUARIO_COMO_OFICIAL; ARQUIVO_PRESERVADO_SEM_EDICAO; SHA256_REGISTRADO'
    : approvedImage.kind === 'event_photo'
      ? 'FOTOGRAFIA_LOCAL_RENATE_IMG; ARQUIVO_ORIGINAL_PRESERVADO; SHA256_REGISTRADO'
      : 'IMAGEM_LOCAL_APROVADA_PELO_USUARIO_2026-11-06; ILUSTRACAO_FOTORREALISTA_NAO_FOTOGRAFIA_OFICIAL';
  card.imageKind = approvedImage.kind;
  card.photoAlt = approvedImage.alt;
  if (approvedImage.note) card.photoNote = approvedImage.note;
}

const safeAtlas = atlas.map((row) => {
  const localReferences = [];
  for (const binding of bindings.filter((item) => item.atlas_id === row.atlas_id)) {
    const sourceDocumentId = binding.document_source_id;
    const doc = packedDocumentById.get(sourceDocumentId);
    if (!doc) continue;
    localReferences.push({
      source_id: binding.source_id,
      document_source_id: sourceDocumentId,
      title: doc.title,
      authority: row.authority,
      edition: binding.edition || doc.edition,
      locators: binding.locators ?? [],
      pdf_path: doc.pdf.path,
      pdf_sha256: doc.pdf.sha256,
      ocr_paths: doc.ocrs.map((ocr) => ocr.path),
      verification_status: binding.status,
    });
  }
  const sourceReferences = dedupe(localReferences.map((reference) => `${reference.source_id}:${reference.document_source_id}:${reference.locators.join('|')}`))
    .map((key) => localReferences.find((reference) => `${reference.source_id}:${reference.document_source_id}:${reference.locators.join('|')}` === key));
  const isAlphaOmegaMember = alphaomegaQuestionIds.has(row.atlas_id);
  return {
    ...row,
    ...(isAlphaOmegaMember ? {
      route_ids: dedupe([...(row.route_ids ?? []), 'renate.alphaomega']),
      renate_supplemental_route_id: 'renate.alphaomega',
    } : {}),
    source_references: sourceReferences,
  };
});

const eventEvidenceCards = [];
const shotgunOlympicCardAssets = [
  { file: 'fossa-olimpica-qualification.svg', event: 'Fossa Olímpica · Trap Olímpico', phase: 'qualification', sourceIds: ['RENATE:CBTE-ISSF-TRAP:001:A01', 'RENATE:CBTE-ISSF-TRAP:005:A01', 'RENATE:CBTE-ISSF-TRAP:006:A01', 'RENATE:CBTE-ISSF-TRAP:008:A01'] },
  { file: 'fossa-olimpica-final.svg', event: 'Fossa Olímpica · Trap Olímpico', phase: 'final', sourceIds: ['RENATE:CBTE-ISSF-TRAP:003:A01', 'RENATE:CBTE-ISSF-TRAP:005:A01'] },
  { file: 'skeet-olimpico-qualification.svg', event: 'Skeet Olímpico', phase: 'qualification', sourceIds: ['RENATE:CBTE-ISSF-TRAP:002:A01', 'RENATE:CBTE-ISSF-TRAP:005:A01', 'RENATE:CBTE-ISSF-TRAP:006:A01', 'RENATE:CBTE-ISSF-TRAP:007:A01', 'RENATE:CBTE-ISSF-TRAP:008:A01'] },
  { file: 'skeet-olimpico-final.svg', event: 'Skeet Olímpico', phase: 'final', sourceIds: ['RENATE:CBTE-ISSF-TRAP:003:A01', 'RENATE:CBTE-ISSF-TRAP:005:A01'] },
];
const supplementAssetPaths = shotgunOlympicCardAssets.map(({ file }) => `data/imports/renate_generated_cards_2026-11-07/${file}`);
const olympicRowsById = new Map(safeAtlas.map((row) => [row.atlas_id, row]));
for (const card of shotgunOlympicCardAssets) {
  const rowsForCard = card.sourceIds.map((id) => olympicRowsById.get(id)).filter((row) => row?.renate_approved_as_evidence === true && row.answer && row.source_references?.length);
  if (rowsForCard.length !== card.sourceIds.length) {
    errors.push(`Card normativo ${card.event}/${card.phase}: resposta RENATE aprovada ou referência local ausente.`);
    continue;
  }
  const asset = copyHashed(supplementAssetPaths[shotgunOlympicCardAssets.indexOf(card)], `cards/renate-generated/${card.file}`, null, `Card normativo ${card.event}/${card.phase}`);
  const sourceReferences = [...new Map(rowsForCard.flatMap((row) => row.source_references)
    .map((reference) => [`${reference.document_source_id}:${(reference.locators ?? []).join('|')}`, reference])).values()];
  eventEvidenceCards.push({
    cardId: `cbte.shotgun.issf:${card.event.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}:${card.phase}`,
    eventId: 'cbte.shotgun.issf', routeIds: ['cbte.shotgun.issf'], authority: 'CBTE', event: card.event, phase: card.phase,
    role: 'normative_evidence', evidenceType: 'USER_APPROVED_ATLAS_ANSWER_WITH_LOCAL_LIBRARY_BINDING',
    imagePath: asset.path, imageSha256: asset.sha256, imageKind: 'normative_card', imageAlt: `${card.event} — evidência normativa da ${card.phase === 'final' ? 'final' : 'qualificação'}`,
    ...(() => { const photo = eventPhotoFor('cbte.shotgun.issf', card.event); return photo ? { photoPath: photo.path, photoSha256: photo.sha256, photoAlt: photo.alt, photoProvenance: 'FOTOGRAFIA LOCAL RENATE IMG; ARQUIVO ORIGINAL PRESERVADO' } : {}; })(),
    sourceReferences, sourceQnaIds: rowsForCard.map((row) => row.atlas_id),
    displaySections: rowsForCard.map((row) => ({ heading: row.question, items: [row.answer] })),
    sourceReviewDisclosure: 'Card normativo RENATE. Conteúdo preservado das respostas aprovadas no snapshot local e ligado às regras e à edição ISSF indicadas nas fontes.',
  });
}
const cbteEvents = (adanaCardSnapshot.events ?? []).filter((event) => event.authority === 'CBTE');
const cbteRouteNames = new Map();
for (const event of cbteEvents) {
  const entries = cbteRouteNames.get(event.event_id) ?? [];
  entries.push(event.event);
  cbteRouteNames.set(event.event_id, entries);
}
const normalizedTokens = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').split(/[^a-z0-9]+/).filter((term) => term.length > 1);
const cbteRouteSignatures = new Map([...cbteRouteNames].map(([routeId, names]) => {
  const routeTokens = new Set(normalizedTokens(`${routeId} ${names.join(' ')}`));
  const otherTokens = new Set([...cbteRouteNames].filter(([otherRoute]) => otherRoute !== routeId).flatMap(([otherRoute, otherNames]) => normalizedTokens(`${otherRoute} ${otherNames.join(' ')}`)));
  const uniqueTokens = [...routeTokens].filter((term) => !otherTokens.has(term) && !['cbte', 'provas', 'prova', 'tiro', 'tiros', 'esportivo'].includes(term));
  return [routeId, uniqueTokens.length ? uniqueTokens : [...routeTokens].filter((term) => !['cbte', 'provas', 'prova', 'tiro', 'tiros', 'esportivo'].includes(term))];
}));
const finalPositive = (row) => /final|semifinal/i.test(row.question ?? '')
  && /final|semifinal/i.test(row.answer ?? '')
  && !/\b(não há|não existe|não possui|não prevê|não institui|sem final|final não é|não é realizada final)\b/i.test(row.answer ?? '');
const qualificationPriority = (row) => {
  const question = row.question ?? '';
  return (/(como (é|se desenvolve)|formato|quantos? (disparos|tiros|pratos)|qualificação|classificat[oó]ria)/i.test(question) ? 5 : 0)
    + (/(calibre|arma|espingarda|munição|equipamento|divisão|tempo|séries|postos|rodadas)/i.test(question) ? 2 : 0)
    - (/final|semifinal/i.test(question) ? 4 : 0);
};
for (const [routeId, eventNames] of cbteRouteNames) {
  if (routeId === 'cbte.shotgun.issf') continue;
  const events = cbteEvents.filter((event) => event.event_id === routeId);
  const routeTokens = cbteRouteSignatures.get(routeId) ?? [];
  const routeRows = safeAtlas.filter((row) => (row.route_ids ?? []).includes(routeId)
    && row.renate_approved_as_evidence === true
    && row.answer
    && (row.source_references ?? []).length > 0
    && (row.route_classification_status?.startsWith('USER_EXPLICIT_ROUTE_ID_FROM_SOURCE_HEADING')
      || routeTokens.length === 0
      || routeTokens.some((term) => normalizedTokens(row.question).includes(term))));
  const qualificationRows = routeRows.filter((row) => !/final|semifinal/i.test(row.question ?? ''))
    .sort((a, b) => qualificationPriority(b) - qualificationPriority(a) || a.atlas_id.localeCompare(b.atlas_id)).slice(0, 3);
  const finalRows = routeRows.filter(finalPositive)
    .sort((a, b) => a.atlas_id.localeCompare(b.atlas_id)).slice(0, 3);
  const phases = [
    { phase: 'qualification', rows: qualificationRows },
    ...(finalRows.length ? [{ phase: 'final', rows: finalRows }] : []),
  ];
  for (const { phase, rows: phaseRows } of phases) {
    if (!phaseRows.length) continue;
    const event = events[0];
    const imagePath = event.image ? adanaAssetPathByName.get(event.image) ?? null : null;
    const sourceReferences = [...new Map(phaseRows.flatMap((row) => row.source_references ?? [])
      .map((reference) => [`${reference.document_source_id}:${(reference.locators ?? []).join('|')}`, reference])).values()];
    eventEvidenceCards.push({
      cardId: `${routeId}:${phase}`,
      eventId: routeId,
      routeIds: [routeId],
      authority: 'CBTE',
      event: eventNames[0],
      phase,
      role: 'normative_evidence',
      evidenceType: 'USER_APPROVED_ATLAS_ANSWER_WITH_LOCAL_LIBRARY_BINDING',
      imagePath,
      imageSha256: imagePath ? sha256(path.join(outputRoot, imagePath.slice(2))) : null,
      imageAlt: `${eventNames[0]} — card normativo ${phase === 'final' ? 'da final' : 'de qualificação'}`,
      ...(() => { const photo = eventPhotoFor(routeId, eventNames[0]); return photo ? { photoPath: photo.path, photoSha256: photo.sha256, photoAlt: photo.alt, photoProvenance: 'FOTOGRAFIA LOCAL RENATE IMG; ARQUIVO ORIGINAL PRESERVADO' } : {}; })(),
      sourceReferences,
      sourceQnaIds: phaseRows.map((row) => row.atlas_id),
      displaySections: phaseRows.map((row) => ({ heading: row.question, items: [row.answer] })),
      sourceReviewDisclosure: 'Fatos transcritos sem reescrita de respostas RENATE aprovadas; referências locais, edição e localizadores preservados.',
    });
  }
}

// Split the aggregate CBTE cards into one normative card per proof/division.
// The archived SVGs are retained as the visual source; each runtime card adds
// the proof-specific facts and binds them to the local regulation and exact
// section/page locator.
const addSplitNormativeCard = ({ routeId, event, aliases = [], assetName, documentSourceId, locators, sections, disclosure }) => {
  const asset = assetBySourceName(assetName);
  const sourceReference = sourceReferenceForLocalDocument(documentSourceId, locators);
  if (!asset || !sourceReference) {
    errors.push(`Card normativo dividido ${routeId}/${event}: asset ou referência local ausente.`);
    return;
  }
  const slug = normalizedTokens(event).join('-');
  eventEvidenceCards.push({
    cardId: `${routeId}:${slug}:qualification`,
    eventId: routeId,
    routeIds: [routeId],
    authority: 'CBTE',
    event,
    eventAliases: aliases,
    phase: 'qualification',
    role: 'normative_evidence',
    evidenceType: 'LOCAL_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    imagePath: asset.path,
    imageSha256: asset.sha256,
    imageKind: 'normative_card',
    imageAlt: `${event} — card normativo RENATE`,
    sourceReferences: [sourceReference],
    sourceQnaIds: [],
    displaySections: sections,
    sourceReviewDisclosure: disclosure,
  });
};

// Pistol measuring cards share the ISSF standards with WSPS events unless a
// WSPS provision overrides them. The image on each card is a source-page crop;
// a focused grip crop is also attached to the answer through figures.json.
const pistol10mRoutes = ['issf.event.07', 'wsps.event.p1', 'wsps.event.p2', 'wsps.event.p5', 'wsps.event.p6'];
const pistol25mRoutes = ['issf.event.08', 'issf.event.09', 'issf.event.10', 'issf.event.11', 'wsps.event.p3'];
const pistolSpecificationCards = [
  {
    cardId: 'issf.pistol.specifications.10m', eventId: 'issf.event.07', eventIds: pistol10mRoutes,
    event: 'Pistola de Ar 10 m — dimensões, peso, gatilho e punho',
    aliases: ['Pistola 10m', 'Pistola 10 m', 'Pistola de Ar 10m', 'Pistola de Ar 10 m', '10m Air Pistol', 'WSPS P1', 'WSPS P2', 'WSPS P5', 'WSPS P6', 'P1 10m Air Pistol', 'P2 10m Air Pistol', 'P5 10m Air Pistol Standard', 'P6 Mixed Team 10m Air Pistol'],
    imageSource: 'data/imports/renate_generated_cards_2026-11-07/figures/issf-pistol-10m-spec-table-p375.png',
    imageName: 'issf-pistol-10m-spec-table-p375.png',
    sourceRefs: [
      sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['ISSF 8.1.1; 8.4.1.5; 8.4.2; 8.4.3.5; 8.12, p. 375']),
      sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['WSPS 1.1.3; 5.1.3 (P1, P2, P5 e P6); 5.1.5']),
      sourceReferenceForLocalDocument('ADANA-SRC-3B1650384F55C206', ['WSPS Appendix 6, §§1.1 e 3, p. 34 (P5)']),
    ],
    sections: [
      { heading: 'Pistola de Ar 10 m', items: ['Caixa de medição: 420 × 200 × 50 mm. A tolerância de fabricação permitida é de 0 a +1 mm em cada dimensão.', 'Peso máximo da pistola: 1.500 g. O peso inclui acessórios, pesos de equilíbrio e carregador vazio. Pode ser verificada com todos os acessórios instalados.', 'Peso mínimo do gatilho: 500 g. O controle é feito com o cano na vertical e peso de teste suspenso próximo ao meio do gatilho; o mínimo deve ser mantido durante a competição.'] },
      { heading: 'Punho e acessórios', items: ['Nenhuma parte do punho, armação ou acessório pode tocar o pulso. O apoio do calcanhar deve formar pelo menos 90° com o punho; a extremidade junto ao pulso tem corte de pelo menos 30°.', 'Na parte que repousa sobre a mão entre polegar e indicador, o comprimento máximo é 40 mm; a parte traseira deve subir pelo menos 45° em relação ao eixo do cano. A curvatura deve ser para baixo e o punho não pode envolver a mão.', 'Na prova WSPS P5 (10 m padrão), o Appendix 6 confirma caixa de 420 × 200 × 50 mm, 1.500 g máximo e 500 g mínimo; prevê regras próprias adicionais de punho.'] },
      { heading: 'Abrangência WSPS', items: ['Aplica-se às provas de pistola de ar WSPS P1, P2, P5 e P6, respeitadas as disposições específicas do WSPS. P5 segue também o Appendix 6.'] },
    ],
    disclosure: 'Evidência normativa local: quadro ISSF 8.12 e regras de punho 8.4.1.5; para WSPS, aplicam-se as regras ISSF salvo disposição WSPS específica. O card traz o recorte da linha 10 m e a resposta apresenta ao lado o desenho oficial do punho.',
  },
  {
    cardId: 'issf.pistol.specifications.25m', eventId: 'issf.event.08', eventIds: pistol25mRoutes,
    event: 'Pistola 25 m — dimensões, peso, gatilho e punho',
    aliases: ['Pistola 25m', 'Pistola 25 m', 'Pistola de Tiro Rápido 25m', 'Pistola de Tiro Rápido 25 m', 'Pistola Standard 25m', 'Pistola Standard 25 m', 'Pistola Center Fire 25m', 'Pistola Center Fire 25 m', 'Pistola Fogo Central 25m', '25m Pistol', '25m Rapid Fire Pistol', 'WSPS P3', 'P3 25m Pistol'],
    imageSource: 'data/imports/renate_generated_cards_2026-11-07/figures/issf-pistol-25m-spec-table-p375.png',
    imageName: 'issf-pistol-25m-spec-table-p375.png',
    sourceRefs: [
      sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['ISSF 8.1.1; 8.4.1.6; 8.4.2; 8.4.3.1–8.4.3.3; 8.12, p. 375']),
      sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['WSPS 1.1.3; 5.1.3 (P3); 5.1.4']),
    ],
    sections: [
      { heading: 'Pistolas 25 m — Rimfire e Centre Fire', items: ['Caixa de medição: 300 × 150 × 50 mm. A tolerância de fabricação permitida é de 0 a +1 mm em cada dimensão.', 'Peso máximo da pistola: 1.400 g. O peso inclui acessórios, pesos de equilíbrio e carregador vazio.', 'Peso mínimo do gatilho: 1.000 g. O controle é feito com o cano na vertical e peso de teste suspenso próximo ao meio do gatilho; o mínimo deve ser mantido durante a competição.', 'Comprimento máximo do cano: 153 mm; raio máximo da linha de mira: 220 mm.'] },
      { heading: 'Punho e acessórios', items: ['Nenhuma parte do punho, armação ou acessório pode tocar o pulso. O apoio do calcanhar deve formar pelo menos 90° com o punho; a extremidade junto ao pulso tem corte de pelo menos 30°.', 'Na parte que repousa sobre a mão entre polegar e indicador, o comprimento máximo é 30 mm; a parte traseira deve subir pelo menos 45° em relação ao eixo do cano.', 'Compensadores, freios de boca, canos perfurados e dispositivos de efeito semelhante não são permitidos.'] },
      { heading: 'Abrangência WSPS', items: ['Aplica-se às provas ISSF de pistola 25 m abrangidas pelo quadro e à prova WSPS P3, que segue as regras ISSF de pistola 25 m, salvo disposição WSPS específica.'] },
    ],
    disclosure: 'Evidência normativa local: quadro ISSF 8.12, regra específica de punho 8.4.1.6 e regras de medição; para WSPS P3, aplicam-se as regras ISSF conforme WSPS 5.1.4. O card traz o recorte das linhas 25 m e a resposta apresenta ao lado o desenho oficial do punho.',
  },
];
for (const card of pistolSpecificationCards) {
  const sourceRefs = card.sourceRefs.filter(Boolean);
  const image = copyHashed(card.imageSource, `cards/renate-generated/${card.imageName}`, null, `Card normativo ${card.event}`);
  eventEvidenceCards.push({
    cardId: card.cardId, eventId: card.eventId, eventIds: card.eventIds, routeIds: card.eventIds,
    authority: 'ISSF / WSPS', event: card.event, eventAliases: card.aliases, phase: 'equipment', category: 'equipment',
    role: 'normative_evidence', evidenceType: 'LOCAL_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    imagePath: image.path, imageSha256: image.sha256, imageKind: 'normative_card', imageAlt: `${card.event} — recorte do quadro ISSF 8.12, p. 375`,
    sourceReferences: sourceRefs, sourceQnaIds: [], displaySections: card.sections, sourceReviewDisclosure: card.disclosure,
  });
}

const lightSourceId = 'ADANA-SRC-0DF327513A5FB06C';
const lightAsset = 'CBTE_Provas_Nacionais_Light.svg';
const lightCards = [
  { event: 'Revólver 5 m', aliases: ['Revólver 5m', 'Revolver 5m', 'Prova Light de revólver 5m'], locators: ['III.1.1, p. 4'], sections: [
    { heading: 'Formato e pontuação', items: ['Alvo de pistola de precisão a 5 m · 5 disparos · centro olímpico vale 12 pontos · cada centro vale um X para desempate · máximo indicado: 60,5 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio; posição inicial com arma apontada a no máximo 45° do solo · revólver ou pistola de qualquer calibre permitido pela legislação, sujeito às limitações do estande · qualquer mira, gatilho ou empunhadura · 20 segundos.'] },
  ] },
  { event: 'Pistola 5 m', aliases: ['Pistola 5m', 'Prova Light de pistola 5m'], locators: ['III.1.2, p. 4'], sections: [
    { heading: 'Formato e pontuação', items: ['Alvo de pistola de precisão a 5 m · 5 disparos · centro olímpico vale 12 pontos · cada centro vale um X para desempate · máximo indicado: 60,5 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio; posição inicial com arma apontada a no máximo 45° do solo · revólver ou pistola de qualquer calibre permitido pela legislação, sujeito às limitações do estande · qualquer mira, gatilho ou empunhadura · 20 segundos.'] },
  ] },
  { event: 'Rifle de Precisão 15 m · Bolt Action / Lever Action', aliases: ['Rifle de Precisão 15m', 'Fuzil de Precisão 15m', 'Rifle de Precisão 15m Bolt Action', 'Rifle de Precisão 15m Lever Action'], locators: ['III.2.1, pp. 4–5'], sections: [
    { heading: 'Formato e pontuação', items: ['Alvo de pistola de precisão a 15 m · 5 disparos · centro olímpico vale 12 pontos · cada centro vale um X para desempate · máximo indicado: 60,5 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio · carabina de repetição bolt action ou lever action, em calibre permitido pela legislação e pelas limitações do estande · mira aberta ou óptica · 1 minuto.'] },
  ] },
  { event: 'Rifle Rápido 10 m · Semi-Auto', aliases: ['Rifle Rápido 10m', 'Rifle Rápido 10m Semi-Auto', 'Rifle Rapido 10m', 'Rifle Rapido 10m Semi Auto'], locators: ['III.2.2, p. 5'], sections: [
    { heading: 'Formato e pontuação', items: ['Alvo de pistola de precisão a 10 m · 5 disparos · centro olímpico vale 12 pontos · cada centro vale um X para desempate · máximo indicado: 60,5 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio; posição inicial com arma apontada a no máximo 45° do solo · carabina longa semiautomática, inclusive modelo tático; a regra também permite bolt action ou lever action mantendo o tempo da prova · mira aberta ou óptica · 20 segundos.'] },
  ] },
  { event: 'Fuzil Tático 25 m', aliases: ['Fuzil Tático 25m', 'Fuzil Tatico 25m'], locators: ['III.2.3, p. 5'], sections: [
    { heading: 'Formato e pontuação', items: ['Alvo de pistola de precisão a 25 m · 5 disparos · centro olímpico vale 12 pontos · cada centro vale um X para desempate · máximo indicado: 60,5 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio; posição inicial com arma apontada a no máximo 45° do solo · carabina longa semiautomática de modelo tático, em calibre permitido pela legislação e pelas limitações do estande · mira aberta ou óptica · 20 segundos.'] },
  ] },
  { event: 'Fuzil de Precisão 50 m', aliases: ['Fuzil de Precisão 50m', 'Fuzil de Precisão Light 50m', 'Fuzil de Precisao 50m', 'Fuzil de Precisao Light 50m'], locators: ['III.2.4, pp. 5–6'], sections: [
    { heading: 'Formato e pontuação', items: ['Alvo de pistola de precisão a 50 m · 5 disparos · centro olímpico vale 12 pontos · cada centro vale um X para desempate · máximo indicado: 60,5 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé ou sentado em bancada (bench rest) · carabina longa de repetição bolt action ou lever action em calibre igual ou superior a 5,56 mm, conforme a regra · mira aberta ou óptica · bipé ou front rest permitidos · 1 minuto.'] },
  ] },
  { event: 'Espingarda 10 m', aliases: ['Espingarda 10m', 'Espingarda Light 10m', 'Espingarda 10m Light'], locators: ['III.3.1, p. 6'], sections: [
    { heading: 'Formato e pontuação', items: ['A 10 m, 5 pratos de argila de 110 mm ficam em linha, a 1 m de altura e espaçados 50 cm · 5 disparos · 5 pontos por prato quebrado · máximo 25 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio · espingarda ou garrucha de alma lisa, um ou dois canos, calibres 40 Ga a 12 Ga · qualquer mira e cartucho permitido, sujeito às limitações do estande · 1 minuto.'] },
  ] },
  { event: 'Espingarda 10 m · Semi-Auto', aliases: ['Espingarda 10m Semi-Auto', 'Espingarda 10m Semi Auto', 'Espingarda Light 10m Semi-Auto'], locators: ['III.3.2, p. 6'], sections: [
    { heading: 'Formato e pontuação', items: ['A 10 m, 5 pratos de argila de 110 mm ficam em linha, a 1 m de altura e espaçados 50 cm · 5 disparos · 5 pontos por prato quebrado · máximo 25 pontos.'] },
    { heading: 'Posição, arma e tempo', items: ['Em pé, sem apoio · espingarda ou garrucha semiautomática de alma lisa, calibres 40 Ga a 12 Ga · qualquer mira e cartucho permitido, sujeito às limitações do estande · 20 segundos.'] },
  ] },
];
const lightOverview = eventEvidenceCards.find((card) => card.eventId === 'cbte.national_light' && card.phase === 'qualification');
if (lightOverview) {
  lightOverview.eventAliases = ['Provas Nacionais Light CBTE', 'Provas Light CBTE'];
  lightOverview.sourceQnaIds = [];
  lightOverview.sourceReferences = [sourceReferenceForLocalDocument(lightSourceId, ['III.1–III.3, pp. 4–6'])].filter(Boolean);
  lightOverview.displaySections = [{ heading: 'Provas cadastradas no regulamento', items: lightCards.map((card) => card.event) }];
  lightOverview.sourceReviewDisclosure = 'Card geral das oito provas Light, com catálogo e distinção por modalidade. As especificações de cada prova aparecem no card individual correspondente, com localizador próprio.';
}
for (const card of lightCards) addSplitNormativeCard({
  routeId: 'cbte.national_light', authority: 'CBTE', ...card, assetName: lightAsset,
  documentSourceId: lightSourceId,
  disclosure: 'Card individual transcrito do Regulamento CBTE — Provas Nacionais Light. A imagem é o card-catálogo da série; os fatos abaixo são específicos da prova e vinculados ao localizador indicado.',
});

const wrabfSourceId = 'ADANA-SRC-02E3760715D532DF';
const wrabfAsset = 'WRABF_International_Target_and_Bench_Card.svg';
const wrabfCards = [
  { event: 'WRABF Rimfire International Sporter · 50 m', aliases: ['Rimfire International Sporter Rifle', 'Rimfire Internacional Sporter Rifle 50m', 'Rimfire International Sporter 50m', 'WRABF International Sporter'], locators: ['B.6.2 #1(a), p. 5'], sections: [
    { heading: 'Classe e equipamento', items: ['Fogo circular .22 · 50 m · mecanismo de disparo mecânico/manual · massa máxima de 3,855 kg (8,5 lb), com tolerância regulamentar · luneta até 12×, sujeita às condições da regra.'] },
  ] },
  { event: 'WRABF Rimfire Light Rifle · 50 m', aliases: ['Rimfire Light Rifle', 'Rimfire Light 50m', 'WRABF Rimfire Light'], locators: ['B.6.2 #1(b), pp. 5–6'], sections: [
    { heading: 'Classe e equipamento', items: ['Fogo circular .22 · 50 m · mecanismo de disparo mecânico/manual · massa máxima de 4,762 kg (10,5 lb), com tolerância regulamentar; acessórios integrados entram no peso total.'] },
  ] },
  { event: 'WRABF Rimfire Heavy Rifle · 50 m', aliases: ['Rimfire Heavy Rifle', 'Rimfire Heavy 50m', 'WRABF Rimfire Heavy'], locators: ['B.6.2 #1(c), p. 6'], sections: [
    { heading: 'Classe e equipamento', items: ['Fogo circular .22 · 50 m · mecanismo de disparo mecânico/manual · massa máxima de 6,803 kg (15 lb), com tolerância regulamentar; acessórios integrados entram no peso total.'] },
  ] },
  { event: 'WRABF Air Light Rifle · 25 m', aliases: ['Air Light Rifle', 'Air Light 25m', 'WRABF Air Light'], locators: ['B.6.2 #2(a), pp. 6–7'], sections: [
    { heading: 'Classe e equipamento', items: ['Ar comprimido · 25 m · calibres 4,5 mm, 5,0 mm ou 5,5 mm · massa máxima de 4,762 kg (10,5 lb), com tolerância regulamentar · potência máxima de 16,27 J (12 ft·lb).'] },
  ] },
  { event: 'WRABF Air Heavy Rifle · 25 m', aliases: ['Air Heavy Rifle', 'Air Heavy 25m', 'WRABF Air Heavy'], locators: ['B.6.2 #2(b), p. 7'], sections: [
    { heading: 'Classe e equipamento', items: ['Ar comprimido · 25 m · calibres 4,5 mm, 5,0 mm ou 5,5 mm · massa máxima de 6,803 kg (15 lb), com tolerância regulamentar · potência máxima de 27,12 J (20 ft·lb).'] },
  ] },
  { event: 'WRABF Air Unlimited Rifle · 50 m', aliases: ['Air Unlimited Rifle', 'Air Unlimited 50m', 'WRABF Air Unlimited'], locators: ['B.6.2 #2(c), p. 7'], sections: [
    { heading: 'Classe e equipamento', items: ['Ar comprimido até 5,5 mm · 50 m · sem limite de massa ou energia nesta divisão; disparo manual, mecânico ou eletrônico integrado · alvo e distância iguais aos das divisões Rimfire (50 m).'] },
  ] },
  { event: 'WRABF Air Springer Rifle · 25 m', aliases: ['Air Springer Rifle', 'Air Springer 25m', 'WRABF Springer'], locators: ['B.6.2 #2(d), p. 7'], sections: [
    { heading: 'Escopo nacional e equipamento', items: ['Carabina de ar por mola ou pistão pneumático (Gas Ram) · 25 m · mecanismo manual/mecânico · calibres 4,5 mm, 5,0 mm ou 5,5 mm · sem limite de massa. O próprio regulamento CBTE declara que esta divisão é praticada exclusivamente no Brasil e não consta da versão internacional WRABF.'] },
  ] },
];
const wrabfOverview = eventEvidenceCards.find((card) => card.eventId === 'cbte.wrabf.rifle_international' && card.phase === 'qualification');
if (wrabfOverview) {
  wrabfOverview.eventAliases = ['Carabina WRABF CBTE', 'Provas CBTE WRABF'];
  wrabfOverview.sourceQnaIds = [];
  wrabfOverview.sourceReferences = [sourceReferenceForLocalDocument(wrabfSourceId, ['B.6.2, pp. 5–7'])].filter(Boolean);
  wrabfOverview.displaySections = [{ heading: 'Divisões cadastradas no regulamento', items: wrabfCards.map((card) => card.event) }];
  wrabfOverview.sourceReviewDisclosure = 'Card geral de catálogo da disciplina WRABF. As especificações e o escopo nacional/internacional aparecem nos cards individuais das divisões.';
}
for (const card of wrabfCards) addSplitNormativeCard({
  routeId: 'cbte.wrabf.rifle_international', ...card, assetName: wrabfAsset,
  documentSourceId: wrabfSourceId,
  disclosure: 'Card individual transcrito do Regulamento Específico CBTE WRABF, V2/2024 e anexos vigentes. A ilustração de alvo e bancada é compartilhada; as regras abaixo identificam a divisão e o localizador próprios.',
});

const cmpSourceId = 'ADANA-SRC-0DB5E360F55EA1DD';
const cmpAsset = 'DISCIPLINE_CARD_CMP_SPORTER_OVERVIEW.svg';
const cmpCards = [
  { event: 'CMP Rimfire Sporter · Mira Aberta · Class O', aliases: ['CMP Class O', 'CMP Open Sights', 'CMP Mira Aberta', 'CMP Rimfire Sporter Divisão Mira Aberta', 'Rimfire Sporter Open Sights'], locators: ['1.2; 2.1, pp. 2–3'], sections: [
    { heading: 'Divisão e miras', items: ['Classe O · mira aberta: alça e massa abertas, observadas as proibições de componentes especializados previstas no regulamento.'] },
    { heading: 'Formato comum da prova', items: ['Carabina .22 LR · seis estágios de dez disparos, distribuídos entre 50 m e 25 m · a regra específica não institui final eliminatória.'] },
  ] },
  { event: 'CMP Rimfire Sporter · Mira Fechada · Class T', aliases: ['CMP Class T', 'CMP Telescopic Sights', 'CMP Aperture Sights', 'CMP Mira Fechada', 'CMP Rimfire Sporter Divisão Mira Fechada', 'Rimfire Sporter Telescopic Sights'], locators: ['1.2; 2.1, pp. 2–3'], sections: [
    { heading: 'Divisão e miras', items: ['Classe T · dioptro/peep, mira óptica ou red dot. A mira óptica pode ter até 6×; se oferecer aumento maior, deve permanecer imobilizada em até 6×.'] },
    { heading: 'Formato comum da prova', items: ['Carabina .22 LR · seis estágios de dez disparos, distribuídos entre 50 m e 25 m · a regra específica não institui final eliminatória.'] },
  ] },
  { event: 'CMP Carabina Tática Rimfire', aliases: ['CMP Tactical Rimfire', 'Carabina Tática Rimfire CMP', 'CMP Divisão Tática'], locators: ['1.2; 2.1, pp. 2–3'], sections: [
    { heading: 'Divisão e miras', items: ['Carabina tática Rimfire .22 LR, reconhecida como terceira divisão. A organização pode oferecê-la como categoria própria ou incluí-la na classe de mira fechada, conforme o regulamento.'] },
    { heading: 'Formato comum da prova', items: ['A prova segue os seis estágios de dez disparos da Carabina CMP Sporter · a regra específica não institui final eliminatória.'] },
  ] },
];
const cmpOverview = eventEvidenceCards.find((card) => card.eventId === 'cbte.cmp.rimfire_sporter' && card.phase === 'qualification');
if (cmpOverview) {
  cmpOverview.eventAliases = ['Carabina CMP Sporter', 'Carabina CMP Fogo Circular Sporter'];
  cmpOverview.displaySections = [{ heading: 'Divisões', items: cmpCards.map((card) => card.event) }];
}
for (const card of cmpCards) addSplitNormativeCard({
  routeId: 'cbte.cmp.rimfire_sporter', ...card, assetName: cmpAsset,
  documentSourceId: cmpSourceId,
  disclosure: 'Card individual transcrito do Regulamento CBTE — Carabina CMP Sporter, atualizado em 09/01/2025. A visão geral da disciplina é compartilhada; classe, mira e regra específica constam abaixo com a fonte local.',
});

// Target Sprint route card: use the current ISSF Third Print and user-provided
// local event photos. The event page supplies photo provenance, while the card
// facts below are bound to the local rulebook and its exact locators.
const targetSprintSourceId = 'ADANA-SRC-2A79B10E08375DE1';
const targetSprintPdf = documents.get(targetSprintSourceId)?.pdfRow;
const targetSprintPhotoFiles = [
  { file: 'Tgt_Sprint1_tiro.jpg', label: 'Etapa de tiro' },
  { file: 'Tgt_Sprint2_change_mix.jpg', label: 'Transição da equipe mista' },
  { file: 'Tgt_Sprint3_run.jpg', label: 'Etapa de corrida' },
  { file: 'Tgt_Sprint1.jpg', label: 'Linha de tiro' },
];
const targetSprintRowsById = new Map(safeAtlas.map((row) => [row.atlas_id, row]));
const targetSprintPhases = [
  {
    phase: 'qualification',
    locators: ['11.4.2.1', '11.8.2.1', '11.8.2.2', '11.8.2.3', '11.10.4.3'],
    qnaIds: ['ISSF:ISSF-276:A01', 'ISSF:ISSF-278:A01', 'ISSF:ISSF-280:A01', 'ISSF:ISSF-294:A01'],
    sections: [
      { heading: 'Formato da prova', items: ['A prova combina corrida e tiro: três trechos de 400–500 m e duas etapas de tiro em pé, cada uma com cinco alvos rebatíveis. O atleta não carrega o rifle durante a corrida.'] },
      { heading: 'Tiro e penalidade', items: ['Em cada etapa, são permitidos até 15 disparos para derrubar os cinco alvos. Cada alvo não derrubado após 15 disparos gera 15 segundos na zona de penalidade.'] },
      { heading: 'Equipamento e resultado', items: ['Rifle de ar de 4,5 mm (.177), tiro único; velocidade de boca abaixo de 175 m/s. O resultado é o tempo total da largada à chegada.'] },
    ],
  },
  {
    phase: 'final',
    locators: ['11.8.2.1', '11.8.2.2', '11.8.2.3', '11.10.4.3', '11.10.4.4'],
    qnaIds: ['ISSF:ISSF-276:A01', 'ISSF:ISSF-294:A01', 'ISSF:ISSF-297:A01'],
    sections: [
      { heading: 'Formato da final', items: ['A final repete o formato de corrida e tiro definido para a prova. Os finalistas largam ao mesmo tempo; a classificação segue a ordem de chegada ou o tempo total, conforme o formato aplicado.'] },
      { heading: 'Avanço à final', items: ['Quando há mais atletas que postos de tiro, os oito melhores tempos da qualificação avançam. Se houver menos atletas que postos, a regra prevê duas corridas finais somadas, sem bateria classificatória.'] },
      { heading: 'Etapas de tiro', items: ['Em cada uma das duas etapas, o atleta atira em cinco alvos; o limite é 15 disparos e cada alvo restante após esse limite acrescenta 15 segundos na zona de penalidade.'] },
    ],
  },
];
if (!targetSprintPdf) {
  errors.push(`Card normativo Target Sprint: documento local ${targetSprintSourceId} ausente.`);
} else {
  const localPdfRelativePath = targetSprintPdf.local_pdf_path.replaceAll('\\', '/');
  const localPdfAbsolutePath = localPath(localPdfRelativePath);
  const observedPdfHash = sha256(localPdfAbsolutePath);
  if (observedPdfHash !== targetSprintPdf.pdf_sha256_observed.toLowerCase()) {
    errors.push(`Card normativo Target Sprint: SHA-256 divergente em ${localPdfRelativePath}.`);
  }
  const targetSprintPhotos = targetSprintPhotoFiles.map(({ file, label }) => {
    const copied = copyHashed(`IMG/${file}`, `cards/target-sprint/${file}`, null, `Foto Target Sprint (${label})`);
    return { path: copied.path, sha256: copied.sha256, alt: `ISSF Target Sprint — ${label.toLocaleLowerCase('pt-BR')}`, label, provenance: 'Foto local fornecida pelo usuário; galeria oficial ISSF World Tour Target Sprint Munich 2026: https://www.issf-sports.org/competitions/3566' };
  });
  const targetSprintSourceReference = {
    source_id: targetSprintSourceId,
    document_source_id: targetSprintSourceId,
    title: targetSprintPdf.title,
    authority: 'ISSF',
    edition: targetSprintPdf.edition,
    locators: [],
    pdf_path: `./${localPdfRelativePath}`,
    pdf_sha256: observedPdfHash,
    verification_status: 'RESOLVED_TO_RENATE_LIBRARY',
  };
  for (const card of targetSprintPhases) {
    const qnaRows = card.qnaIds.map((id) => targetSprintRowsById.get(id)).filter((row) => row?.renate_approved_as_evidence === true && row.answer);
    if (qnaRows.length !== card.qnaIds.length) {
      errors.push(`Card normativo Target Sprint/${card.phase}: Q&A aprovado ausente no ATLAS local.`);
      continue;
    }
    const imageAsset = targetSprintPhotos[0];
    eventEvidenceCards.push({
      cardId: `issf.event.19:${card.phase}`,
      eventId: 'issf.event.19',
      routeIds: ['issf.event.19'],
      authority: 'ISSF',
      event: 'Target Sprint',
      phase: card.phase,
      role: 'normative_evidence',
      evidenceType: 'LOCAL_LIBRARY_RULEBOOK_WITH_SHA256_AND_LOCATORS',
      imagePath: imageAsset.path,
      imageSha256: imageAsset.sha256,
      imageKind: 'user_provided_official_event_photos',
      imageAlt: 'ISSF Target Sprint — fotos oficiais de prova fornecidas localmente',
      photoGallery: targetSprintPhotos,
      sourceReferences: [{ ...targetSprintSourceReference, locators: card.locators }],
      sourceQnaIds: qnaRows.map((row) => row.atlas_id),
      displaySections: card.sections,
      sourceReviewDisclosure: 'Card normativo RENATE. Fatos vinculados ao ISSF Rule Book 2026, terceira impressão de outubro, vigente desde 19/10/2026; as fotos identificam visualmente a prova e não substituem as regras citadas.',
    });
  }
}

function sourceReferenceForLocalDocument(documentSourceId, locators) {
  const pdfRow = documents.get(documentSourceId)?.pdfRow;
  if (!pdfRow) {
    errors.push(`Card normativo: documento local ${documentSourceId} ausente.`);
    return null;
  }
  const pdfRelativePath = pdfRow.local_pdf_path.replaceAll('\\', '/');
  const pdfSha256 = sha256(localPath(pdfRelativePath));
  if (pdfSha256 !== pdfRow.pdf_sha256_observed.toLowerCase()) errors.push(`Card normativo: SHA-256 divergente em ${pdfRelativePath}.`);
  return {
    source_id: documentSourceId,
    document_source_id: documentSourceId,
    title: pdfRow.title,
    authority: pdfRow.title.startsWith('WSPS') ? 'WSPS' : pdfRow.title.startsWith('ISSF') ? 'ISSF' : 'CBTE',
    edition: pdfRow.edition,
    locators,
    pdf_path: `./${pdfRelativePath}`,
    pdf_sha256: pdfSha256,
    verification_status: 'RESOLVED_TO_RENATE_LIBRARY',
  };
}
function assetBySourceName(sourceName) { return importedCardAssets.find((asset) => asset.sourceName === sourceName); }
function addAssetEvidenceCard({ routeId, authority, event, phase, assetName, sourceRefs, sourceQnaIds = [], displaySections = [], photoGallery = null, photo = null }) {
  const asset = assetBySourceName(assetName);
  if (!asset) {
    errors.push(`Card normativo ${routeId}/${phase}: asset ${assetName} ausente no pacote local.`);
    return;
  }
  eventEvidenceCards.push({
    cardId: `${routeId}:${phase}`,
    eventId: routeId,
    routeIds: [routeId],
    authority,
    event,
    phase,
    role: 'normative_evidence',
    evidenceType: 'LOCAL_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    imagePath: asset.path,
    imageSha256: asset.sha256,
    imageKind: 'normative_card',
    imageAlt: `${event} — evidência normativa de ${phase === 'final' ? 'final' : 'qualificação'}`,
    ...(photo ? { photoPath: photo.path, photoSha256: photo.sha256, photoAlt: photo.alt, photoProvenance: photo.provenance, photoNote: photo.note } : {}),
    ...(photoGallery ? { photoGallery } : {}),
    sourceReferences: sourceRefs.filter(Boolean),
    sourceQnaIds,
    displaySections,
    sourceReviewDisclosure: 'Card normativo RENATE: fatos apresentados com vínculo ao regulamento local, à edição e aos localizadores indicados.',
  });
}

// Existing approved explanatory cards were present as local assets but were
// not bound to these route identities in the runtime card registry.
for (const phase of ['qualification', 'final']) {
  const trapCard = eventEvidenceCards.find((card) => card.eventId === 'cbte.shotgun.issf' && card.event.toLowerCase().includes('trap olímpico') && card.phase === phase);
  const skeetCard = eventEvidenceCards.find((card) => card.eventId === 'cbte.shotgun.issf' && card.event.toLowerCase().includes('skeet olímpico') && card.phase === phase);
  for (const [sourceCard, routeId, authority, event] of [
    [trapCard, 'issf.event.13', 'ISSF', 'Trap'],
    [skeetCard, 'issf.event.14', 'ISSF', 'Skeet'],
  ]) {
    if (!sourceCard) continue;
    eventEvidenceCards.push({
      ...sourceCard,
      cardId: `${routeId}:${phase}`,
      eventId: routeId,
      routeIds: [routeId],
      authority,
      event,
      sourceReviewDisclosure: 'Card normativo RENATE para a rota ISSF; fatos e localizadores do ISSF Rule Book 2026 preservados.',
    });
  }
}

const issfAirRifleAssetNames = {
  qualification: 'ISSF_10m_Air_Rifle_Operation.svg',
  final: 'ISSF_10m_Air_Rifle_Final.svg',
};
for (const [phase, assetName] of Object.entries(issfAirRifleAssetNames)) {
  addAssetEvidenceCard({
    routeId: 'issf.event.01', authority: 'ISSF', event: '10m Air Rifle', phase, assetName,
    sourceRefs: [sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', phase === 'final' ? ['6.3.4.3', '6.11.9.1', '6.17.2'] : ['6.3.4.3', '7.1', '7.4.4.1', '7.7'])],
    sourceQnaIds: phase === 'final' ? [] : ['ISSF:ISSF-063:A01', 'ISSF:ISSF-101:A01'],
  });
}

const cbteEvidenceAssets = [
  { routeId: 'cbte.fclass.rimfire', event: 'Carabina F-Class Rimfire', assetName: 'CBTE_F-Class_Rimfire_2026-01.svg', sourceId: 'ADANA-SRC-932F8D349597AC5E', locators: ['II', 'III'] },
  { routeId: 'cbte.field_target', event: 'Carabina Field Target', assetName: 'CBTE_Carabina_Field_Target_2025.svg', sourceId: 'ADANA-SRC-42944A61178F7B21', locators: ['2.2.1', '2.4', '2.6.1–2.8.4', '4.2', '5.1', '5.8', '5.12'] },
  { routeId: 'cbte.nra', event: 'Carabina NRA / Rifle Esporte', assetName: 'CBTE_Carabina_NRA_Rifle_Esporte_2025.svg', sourceId: 'ADANA-SRC-B814AF7D19CC3FFC', locators: ['I', 'II', 'III', 'p. 5'] },
];
for (const card of cbteEvidenceAssets) {
  addAssetEvidenceCard({
    ...card, authority: 'CBTE', phase: 'qualification',
    sourceRefs: [sourceReferenceForLocalDocument(card.sourceId, card.locators)],
  });
}

const wspsQnaById = new Map(safeAtlas.map((row) => [row.atlas_id, row]));
const wspsCardRows = (ids) => ids.map((id) => wspsQnaById.get(id)).filter((row) => row?.renate_approved_as_evidence === true && row.answer && row.source_references?.length);
const addWspsQuestionCard = ({ routeId, event, imageName, phase = 'qualification', qnaIds }) => {
  const rows = wspsCardRows(qnaIds);
  if (!rows.length || rows.length !== qnaIds.length) {
    errors.push(`Card normativo ${routeId}/${phase}: Q&A aprovado ou vínculo local ausente.`);
    return;
  }
  const snapshotEvent = (adanaCardSnapshot.events ?? []).find((candidate) => candidate.event_id === routeId);
  const imageAsset = snapshotEvent?.image ? assetBySourceName(snapshotEvent.image) : null;
  const sourceReferences = [...new Map(rows.flatMap((row) => row.source_references)
    .map((reference) => [`${reference.document_source_id}:${(reference.locators ?? []).join('|')}`, reference])).values()];
  if (!imageAsset || imageAsset.sourceName !== imageName) {
    errors.push(`Card normativo ${routeId}/${phase}: imagem da rota ${imageName} ausente ou divergente.`);
    return;
  }
  eventEvidenceCards.push({
    cardId: `${routeId}:${phase}`, eventId: routeId, routeIds: [routeId], authority: 'WSPS', event, phase,
    role: 'normative_evidence', evidenceType: 'USER_APPROVED_ATLAS_ANSWER_WITH_LOCAL_LIBRARY_BINDING',
    imagePath: imageAsset.path, imageSha256: imageAsset.sha256,
    imageKind: 'normative_card', imageAlt: `${event} — evidência normativa WSPS`,
    sourceReferences, sourceQnaIds: rows.map((row) => row.atlas_id),
    displaySections: rows.map((row) => ({ heading: row.question, items: [row.answer] })),
    sourceReviewDisclosure: 'Card normativo RENATE com respostas aprovadas, edição e localizadores vinculados à Library local.',
  });
};
for (const [routeId, event, classQnaId, imageName] of [
  ['wsps.event.pt1', 'Para Trap PT1 · Seated', 'WSPS:WSPS-SRC-014:A01', 'Imagem do ChatGPT 29 de set. de 2026, 08_50_09.png'],
  ['wsps.event.pt2', 'Para Trap PT2 · Lower Limb', 'WSPS:WSPS-SRC-014:A01', 'Imagem do ChatGPT 29 de set. de 2026, 08_50_09.png'],
  ['wsps.event.pt3', 'Para Trap PT3 · Upper Limb', 'WSPS:WSPS-SRC-014:A01', 'Imagem do ChatGPT 29 de set. de 2026, 08_50_09.png'],
]) {
  addWspsQuestionCard({ routeId, event, imageName, qnaIds: [classQnaId, 'WSPS:WSPS-SRC-015:A01'] });
}
for (const [routeId, event, phaseQnaId, imageName] of [
  ['wsps.event.vip', '10m Air Rifle VI Prone · VIP', 'WSPS:WSPS-SRC-018:A02', 'Imagem do ChatGPT 29 de set. de 2026, 08_56_45.png'],
  ['wsps.event.vis', '10m Air Rifle VI Standing · VIS', 'WSPS:WSPS-SRC-018:A01', 'Imagem do ChatGPT 29 de set. de 2026, 08_56_45.png'],
]) {
  addWspsQuestionCard({ routeId, event, imageName, qnaIds: ['WSPS:WSPS-SRC-017:A02', phaseQnaId] });
}

const issfRecognizedEvents = [
  { routeId: 'issf.event.02', event: '50m Rifle 3 Positions', programme: 'Programa olímpico: 3 × 20 disparos (ajoelhado, deitado e em pé).', final: 'Final individual: 35 disparos.', status: 'Olympic / WCH' },
  { routeId: 'issf.event.03', event: '50m Rifle Prone', programme: 'Programa completo: 60 disparos.', status: 'WCH' },
  { routeId: 'issf.event.04', event: '300m Rifle 3 Positions', programme: 'Programa completo: 3 × 20 disparos (ajoelhado, deitado e em pé).', status: 'M / WCHS' },
  { routeId: 'issf.event.05', event: '300m Rifle Prone', programme: 'Programa completo: 60 disparos.', status: 'M / WCHS' },
  { routeId: 'issf.event.06', event: '300m Standard Rifle', programme: 'Programa completo: 3 × 20 disparos (ajoelhado, deitado e em pé).', status: 'M / WCHS' },
  { routeId: 'issf.event.07', event: '10m Air Pistol', programme: 'Programa olímpico: 60 disparos.', final: 'Final individual: 24 disparos.', status: 'Olympic / WCH' },
  { routeId: 'issf.event.08', event: '25m Pistol', programme: 'O quadro distingue os programas por categoria: 30 + 30 disparos nas séries de precisão e rápida; o evento feminino consta do programa olímpico.', final: 'Final feminina: 50 disparos.', status: 'WCH; categoria feminina olímpica' },
  { routeId: 'issf.event.09', event: '25m Rapid-Fire Pistol', programme: 'Programa olímpico: 30 + 30 disparos, em séries de 8, 6 e 4 segundos.', final: 'Final: até 40 disparos.', status: 'Olympic / WCH' },
  { routeId: 'issf.event.10', event: '25m Centre Fire Pistol', programme: 'Programa completo: 30 + 30 disparos nas séries de precisão e rápida.', status: 'WCH' },
  { routeId: 'issf.event.11', event: '25m Standard Pistol', programme: 'Programa completo: 20 + 20 + 20 disparos; séries de 150, 20 e 10 segundos.', status: 'WCH' },
  { routeId: 'issf.event.12', event: '50m Pistol', programme: 'Programa completo: 60 disparos.', status: 'WCH' },
  { routeId: 'issf.event.15', event: '10m Moving Target', programme: 'Programa completo: 30 disparos em corrida lenta + 30 em corrida rápida.', final: 'O quadro prevê Medal Match; consultar a regra 10.8.', status: 'WCHS' },
  { routeId: 'issf.event.16', event: '10m Moving Target Mixed', programme: 'Prova mista: 40 disparos.', status: 'WCHS' },
  { routeId: 'issf.event.17', event: '50m Moving Target', programme: 'Programa completo: 30 disparos em corrida lenta + 30 em corrida rápida.', final: 'O quadro prevê Medal Match; consultar a regra 10.8.', status: 'WCHS' },
  { routeId: 'issf.event.18', event: '50m Moving Target Mixed', programme: 'Prova mista: 40 disparos.', status: 'WCHS' },
];
const issfEventTableReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['ISSF Recognized Shooting Events, pp. 185–187']);
// Human review corrections: these imported illustrations depict other
// disciplines. Use route-bound local event photos while keeping the snapshot
// itself intact as an imported artifact.
const reviewedEventImageOverrides = new Set([
  'issf.event.10', 'issf.event.15', 'issf.event.16', 'issf.event.17', 'issf.event.18',
]);
for (const spec of issfRecognizedEvents) {
  const snapshotEvent = (adanaCardSnapshot.events ?? []).find((candidate) => candidate.event_id === spec.routeId);
  const approvedPhoto = reviewedEventImageOverrides.has(spec.routeId) ? eventPhotoFor(spec.routeId, spec.event) : null;
  const asset = approvedPhoto ?? (snapshotEvent?.image ? assetBySourceName(snapshotEvent.image) : null);
  if (!asset) {
    errors.push(`Card normativo ${spec.routeId}: imagem local da rota ausente.`);
    continue;
  }
  const programmeCard = {
    cardId: `${spec.routeId}:qualification`, eventId: spec.routeId, routeIds: [spec.routeId], authority: 'ISSF', event: spec.event,
    phase: 'qualification', role: 'normative_evidence', evidenceType: 'ISSF_RECOGNIZED_EVENT_TABLE_WITH_LOCAL_SHA256_BINDING',
    imagePath: asset.path, imageSha256: asset.sha256, imageKind: approvedPhoto?.kind ?? 'event_photo', imageAlt: approvedPhoto?.alt ?? `${spec.event} — foto da prova`,
    sourceReferences: [{ ...issfEventTableReference, locators: ['ISSF Recognized Shooting Events, pp. 185–187'] }],
    sourceQnaIds: [],
    displaySections: [
      { heading: 'Programa reconhecido', items: [spec.status, spec.programme] },
      { heading: 'Fase', items: [spec.final ? 'O quadro oficial separa qualificação e final para esta prova.' : 'O quadro oficial apresenta o programa completo; não lista final individual para esta entrada.'] },
    ],
    sourceReviewDisclosure: 'Card normativo RENATE transcrito da tabela ISSF Recognized Shooting Events do Rule Book 2026, terceira impressão, vigente desde 19/10/2026. A tabela define o programa e o número de disparos; as regras técnicas detalhadas seguem os capítulos de cada disciplina.',
  };
  eventEvidenceCards.push(programmeCard);
  if (spec.final) {
    eventEvidenceCards.push({
      ...programmeCard,
      cardId: `${spec.routeId}:final`,
      phase: 'final',
      displaySections: [{ heading: spec.event.includes('Moving Target') ? 'Medal Match' : 'Final', items: [spec.final] }],
    });
  }
}

const issfMalfunctionReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', [
  'ISSF 8.7.6.4, pp. 364–365',
  'ISSF 8.8.1(d), p. 366',
  'ISSF 8.9.1, p. 369',
  'ISSF 8.9.3–8.9.4.6, pp. 369–372',
  'ISSF 6.17.4.o; 6.17.5.k (finais de 25 m)',
]);
const issfMalfunctionCards = [
  {
    routeId: 'issf.event.11', event: 'Pistola Standard ISSF',
    claimLimit: 'Na partida de 60 tiros: até duas reclamações de falha (admissível ou não admissível). Se, excepcionalmente, a partida for disputada em duas etapas de 30 tiros, o limite é uma por etapa.',
    procedure: 'Em falha admissível na série masculina de 5 tiros, registrar os tiros disparados na primeira linha do formulário STDP e repetir a série com cinco tiros. Se ocorrer nova falha na repetição, registrar os tiros disparados na segunda linha e acrescentar zeros à linha com mais tiros disparados até uma linha totalizar cinco valores; esses zeros contam. A pontuação final da série é a soma dos cinco menores valores de todos os tiros registrados, incluindo zeros acrescentados. Exemplo: série original com X e 8, falha admissível no terceiro tiro; na repetição, X, X, X, 9 e 9. X vale 10. Entre os sete valores (10, 8, 10, 10, 10, 9, 9), contam os cinco menores: 8 + 9 + 9 + X(10) + X(10) = 46 pontos.',
    form: 'Formulário STDP · ISSF 8.9.4.5',
  },
  {
    routeId: 'issf.event.09', event: 'Pistola de Tiro Rápido ISSF (25 m)',
    claimLimit: 'Até uma reclamação de falha (admissível ou não admissível) em cada etapa de 30 tiros.',
    procedure: 'Em falha admissível numa série masculina de 5 tiros, registrar os tiros disparados na primeira linha do formulário RFPM e repetir a série com cinco tiros. Se ocorrer nova falha na repetição, registrar os tiros disparados na segunda linha e acrescentar zeros à linha com mais tiros disparados até uma linha totalizar cinco valores; esses zeros contam. A pontuação final da série soma, para cada um dos cinco alvos, o menor valor registrado naquele alvo. Exemplo: na série original, T1=X(10) e T2=8; há falha admissível no terceiro tiro. Na repetição: T1=9, T2=9, T3=X(10), T4=8, T5=9. Conta-se o menor por alvo: T1=9, T2=8, T3=10, T4=8, T5=9; total = 44 pontos. Diferente da Standard, não se escolhem globalmente os cinco menores tiros: compara-se alvo por alvo.',
    form: 'Formulário RFPM · ISSF 8.9.4.5',
  },
  {
    routeId: 'issf.event.08', event: 'Pistola 25 m ISSF',
    claimLimit: 'Até uma reclamação de falha (admissível ou não admissível) em cada etapa de 30 tiros.',
    procedure: 'Em falha admissível, registra-se o número de tiros disparados e a série pode ser completada na próxima série de competição. Etapa de precisão: a série normal tem 240 segundos para cinco tiros (ISSF 8.7.6.4); cada tiro faltante recebe 48 segundos, conforme 8.9.4.6(b) e 8.8.1(d). Cálculo: tempo = (240 ÷ 5) × tiros faltantes. Exemplo: se 3 tiros foram disparados, faltam 2; 48 × 2 = 96 segundos para completar. Etapa rápida: não use esse cálculo; a complementação começa na primeira exposição do alvo (8.9.4.6(b)). Tiros não disparados ou que não atingirem o alvo valem zero; a série de cinco tiros é pontuada normalmente.',
    form: 'Formulário IR · ISSF 8.9.4.6',
  },
  {
    routeId: 'issf.event.10', event: 'Fogo Central ISSF (25 m)',
    claimLimit: 'Até uma reclamação de falha (admissível ou não admissível) em cada etapa de 30 tiros.',
    procedure: 'Em falha admissível, registra-se o número de tiros disparados e a série pode ser completada na próxima série de competição. Etapa de precisão: a série normal tem 240 segundos para cinco tiros (ISSF 8.7.6.4); cada tiro faltante recebe 48 segundos, conforme 8.9.4.6(b) e 8.8.1(d). Cálculo: tempo = (240 ÷ 5) × tiros faltantes. Exemplo: se 3 tiros foram disparados, faltam 2; 48 × 2 = 96 segundos para completar. Etapa rápida: não use esse cálculo; a complementação começa na primeira exposição do alvo (8.9.4.6(b)). Tiros não disparados ou que não atingirem o alvo valem zero; a série de cinco tiros é pontuada normalmente.',
    form: 'Formulário IR · ISSF 8.9.4.6',
  },
];
for (const spec of issfMalfunctionCards) {
  eventEvidenceCards.push({
    cardId: `${spec.routeId}:malfunctions`, eventId: spec.routeId, routeIds: [spec.routeId],
    applicableRouteIds: [spec.routeId], authority: 'ISSF', event: spec.event,
    title: `Falhas — ${spec.event}`,
    category: 'malfunction', phase: 'malfunction', role: 'normative_evidence',
    evidenceType: 'LOCAL_ISSF_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReferences: [issfMalfunctionReference], sourceQnaIds: [],
    displaySections: [
      { heading: 'Falhas admissíveis (AM)', items: [
        'Exemplos previstos: projétil preso no cano; mecanismo do gatilho que não funciona; cartucho não disparado após o gatilho ter sido acionado; estojo que não foi extraído/ejetado; cartucho, carregador, tambor ou outra peça emperrada; percussor quebrado ou dano que impeça o funcionamento; disparo automático sem soltar o gatilho; ferrolho preso ou estojo não ejetado.',
        'No disparo automático, o atleta deve parar imediatamente e não voltar a usar a pistola sem autorização do Árbitro de Linha ou de um membro do Júri.',
      ] },
      { heading: 'Falhas não admissíveis (NAM)', items: [
        'Incluem tocar a culatra, o mecanismo ou a trava de segurança antes da inspeção; trava não liberada; pistola não carregada ou carregada com menos cartuchos; gatilho sem retorno suficiente; munição incorreta; carregador mal inserido ou que caiu, salvo dano do mecanismo; e causa que o atleta pudesse razoavelmente corrigir.',
        'A classificação é feita pelo Árbitro de Linha após inspecionar a pistola.',
      ] },
      { heading: 'Como comunicar e limite', items: [
        'Se quiser reclamar após um tiro não disparado, mantenha a pistola apontada para a direção dos alvos, preserve a empunhadura e avise imediatamente o Árbitro de Linha levantando a mão livre. Se tentar corrigir a falha, em regra perde o direito de alegar AM, exceto por percussor quebrado ou dano que impeça o funcionamento.',
        spec.claimLimit,
        'Falhas na série de ensaio não podem ser reclamadas. Em finais de 25 m, aplicam-se as regras ISSF 6.17.4.o ou 6.17.5.k, conforme a final.',
      ] },
      { heading: 'Contagem nesta prova', items: [spec.procedure, spec.form] },
      { heading: 'Efeito da falha não admissível', items: [
        'Tiros não disparados valem zero; não há repetição nem complementação da série. Os valores dos tiros disparados são creditados, e o atleta pode continuar o restante da prova.',
      ] },
    ],
    sourceReviewDisclosure: 'Resumo explicativo da ISSF Rule Book 2026, Edition 2025, Third Print 10/2026, vigente desde 19/10/2026. O Árbitro de Linha/Júri decide a classificação e a aplicação da regra; este card não substitui a inspeção nem as regras específicas de finais.',
  });
}

const r1R2Cards = [
  { routeId: 'wsps.event.r1', event: 'WSPS R1 · 10m Air Rifle Standing', genderClass: 'Homens · SH1', prefix: 'WSPS_R1_10m_Air_Rifle' },
  { routeId: 'wsps.event.r2', event: 'WSPS R2 · 10m Air Rifle Standing', genderClass: 'Mulheres · SH1', prefix: 'WSPS_R2_10m_Air_Rifle' },
];
const r1R2StandingPhoto = eventPhotoFor('issf.event.01');
for (const spec of r1R2Cards) {
  for (const phase of ['qualification', 'final']) {
    const assetName = `${spec.prefix}_${phase === 'final' ? 'Final' : 'Qualification'}.svg`;
    const issfRefs = phase === 'final'
      ? [sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['6.11.9.1', '6.17.2'])]
      : [];
    addAssetEvidenceCard({
      routeId: spec.routeId,
      authority: 'WSPS',
      event: spec.event,
      phase,
      assetName,
      sourceRefs: [sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['4.1.3', '4.1.9.1–4.1.9.4']), ...issfRefs],
      displaySections: [{ heading: 'Evento e classe', items: [spec.genderClass] }],
      photo: {
        path: r1R2StandingPhoto.path,
        sha256: r1R2StandingPhoto.sha256,
        alt: `Ilustração fotorrealista de atleta ${spec.routeId.endsWith('r1') ? 'R1 masculino' : 'R2 feminino'} SH1 em pé com carabina de ar 10 m.`,
        provenance: 'ILUSTRACAO_FOTORREALISTA_LOCAL; NAO_E_FOTOGRAFIA_OFICIAL; POSICAO_SH1_EM_PE',
        note: 'Imagem ilustrativa da posição em pé SH1; não representa uma fase específica da competição.',
      },
    });
  }
}

const fClassOpenPhoto = (adanaCardSnapshot.events ?? []).find((event) => event.event_id === 'cbte.fclass.centerfire');
const fClassOpenAsset = fClassOpenPhoto?.image ? assetBySourceName(fClassOpenPhoto.image) : null;
if (!fClassOpenAsset) {
  errors.push('Card normativo cbte.fclass.centerfire: imagem local da rota ausente.');
} else {
  eventEvidenceCards.push({
    cardId: 'cbte.fclass.centerfire:qualification', eventId: 'cbte.fclass.centerfire', routeIds: ['cbte.fclass.centerfire'],
    authority: 'CBTE', event: 'Carabina F-Class · fogo central', phase: 'qualification', role: 'normative_evidence',
    evidenceType: 'LOCAL_CBTE_RULEBOOK_WITH_SHA256_AND_LOCATORS', imagePath: fClassOpenAsset.path, imageSha256: fClassOpenAsset.sha256,
    imageKind: 'event_photo', imageAlt: 'Carabina F-Class CBTE — apoio visual da prova',
    sourceReferences: [sourceReferenceForLocalDocument('ADANA-SRC-158DF36CC16073A4', ['1.1', '1.2', '4.1', '5.1.2'])],
    sourceQnaIds: [],
    displaySections: [
      { heading: 'Divisões e equipamento', items: ['Open: fogo central até .35; peso total até 10 kg; mira óptica permitida e incluída no peso. F-T/R: .308 Winchester/7,62 NATO ou .223 Remington/5,56 NATO; peso total até 8,25 kg.'] },
      { heading: 'Posição e programa', items: ['Posição deitado. A série nacional é composta por 3 séries de prova de 10 disparos cada, com ensaio antes de cada série.'] },
    ],
    sourceReviewDisclosure: 'Card normativo RENATE transcrito do Regulamento CBTE de Carabina F-Class, edição 09/01/2025, itens 1.1, 1.2, 4.1 e 5.1.2.',
  });
}

if (errors.length) {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  console.error(JSON.stringify({ state: 'BLOCKED', errors: [...new Set(errors)] }, null, 2));
  process.exitCode = 1;
} else {
  const writeJson = (filename, value) => fs.writeFileSync(path.join(outputRoot, filename), `${JSON.stringify(value)}\n`);
  const writeJsonl = (filename, rows) => fs.writeFileSync(path.join(outputRoot, filename), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  writeJsonl('atlas.jsonl', safeAtlas);
  writeJson('pretest-responses.json', { schema: 'RENATE_PRETEST_RESPONSE_BANK_V1', approvalBasis: 'USER_REQUESTED_PASS_CASES_2026-11-06', entries: eligiblePretests });
  writeJson('library-index.json', { schema: 'RENATE_LOCAL_LIBRARY_INDEX_V1', documents: packedDocs, ruleChunkCount: ruleChunks.length });
  writeJson('rules.json', { schema: 'RENATE_LOCAL_RULE_CHUNKS_V1', chunks: ruleChunks });
  const equipmentCards = (adanaCardSnapshot.equipment_cards ?? []).map((sourceCard) => {
    const card = importedCardCatalog.find((item) => item.cardId === sourceCard.id);
    if (!card) return null;
    const authorityNames = Array.isArray(card.authority) ? card.authority : [card.authority].filter(Boolean);
    const references = (sourceCard.source_refs ?? []).flatMap((reference) => {
      const documentSourceId = sourceToDocument.get(reference.source_id);
      const document = documentSourceId ? packedDocumentByIdSafe(documentSourceId) : null;
      if (!document?.pdf?.path) return [];
      return [{
        source_id: reference.source_id,
        document_source_id: documentSourceId,
        title: document.title,
        authority: reference.authority,
        edition: reference.edition ?? document.edition,
        locators: reference.rules ?? [],
        pdf_path: document.pdf.path,
        pdf_sha256: document.pdf.sha256,
        verification_status: 'IMPORTED_CARD_SOURCE_BOUND_TO_RENATE_LIBRARY',
      }];
    });
    return {
      cardId: card.cardId,
      eventId: (card.eventIds ?? [])[0] ?? 'renate.alphaomega',
      eventIds: card.eventIds ?? [],
      authority: authorityNames.join(' / '),
      event: sourceCard.caption.split(/[·:]/)[0].trim() || 'Equipamento esportivo',
      phase: 'equipment',
      category: 'equipment',
      role: card.role,
      imagePath: card.sourceAsset?.localPath ?? null,
      imageSha256: card.sourceAsset?.sha256 ?? null,
      imageKind: 'local_equipment_card',
      imageAlt: card.caption,
      displaySections: [
        { heading: 'Escopo do card', items: [sourceCard.caption] },
        ...(sourceCard.rule_references?.length ? [{ heading: 'Referências indicadas', items: sourceCard.rule_references }] : []),
      ],
      sourceReferences: references,
      evidenceType: references.length ? 'LOCAL_RULEBOOK_WITH_SHA256_AND_LOCATORS' : null,
      sourceReviewDisclosure: card.role === 'visual_supplement_only'
        ? 'Card de equipamento importado. Use como complemento; a resposta normativa permanece vinculada às passagens locais.'
        : 'Card de equipamento com fontes locais vinculadas.',
      alphaomegaPriority: true,
      sourceReviewState: card.sourceReviewState,
      applicableRouteIds: card.eventIds ?? [],
    };
  }).filter(Boolean);
  const wrabfEquipmentImage = copyHashed(
    'data/imports/renate_generated_cards_2026-11-07/wrabf-front-rest-appendix-g.png',
    'cards/renate-generated/wrabf-front-rest-appendix-g.png',
    '2f2520fe97477a3b8bec33180c6ae6677a24d280c314aab6bf00269284540e14',
    'Imagem de apoio WRABF Appendix G',
  );
  const wrabfCbteReference = sourceReferenceForLocalDocument('ADANA-SRC-02E3760715D532DF', ['B.6', 'B.8–B.8.2.2', 'B.9', 'B.10']);
  const wrabfInternationalReference = sourceReferenceForLocalDocument('ADANA-SRC-8F6C57074DE63477', ['Appendix G, p. 59']);
  equipmentCards.unshift({
    cardId: 'CBTE_WRABF_EQUIPMENT_RESTS_V1',
    eventId: 'cbte.wrabf.rifle_international',
    eventIds: ['cbte.wrabf.rifle_international'],
    authority: 'CBTE / WRABF',
    event: 'WRABF · carabina, apoios e equipamento',
    phase: 'equipment',
    category: 'equipment',
    role: 'normative_evidence',
    imagePath: wrabfEquipmentImage.path,
    imageSha256: wrabfEquipmentImage.sha256,
    imageKind: 'local_equipment_card',
    imageAlt: 'Exemplos de apoios frontais reproduzidos no Appendix G do regulamento WRABF V4.4; imagem ilustrativa, não define sozinha a conformidade.',
    displaySections: [
      { heading: 'Apoios e bancada', items: [
        'O apoio frontal sustenta somente a parte dianteira; o traseiro, somente a parte traseira. Nenhum pode ser fixado à bancada ou à carabina, nem conectado ao outro: devem mover-se independentemente.',
        'Apoio frontal (exceto bipé): deve ter almofada flexível; a carabina apoia-se apenas nela, salvo o batente limitador. Ajustes verticais e horizontais são permitidos.',
        'Apoio traseiro pode ser bolsa ou estrutura que a sustente. Pode ter ajuste vertical; ajuste horizontal e contenção do apoio não são permitidos.',
        'Saco de areia: couro e/ou tecido, com enchimento que ceda prontamente à pressão ou ao peso.'
      ] },
      { heading: 'Bipé e recuo', items: [
        'Bipé simples: limite de 800 g; até esse limite, seu peso não integra o peso da carabina. O excedente acima de 800 g é somado ao peso total da carabina.',
        'Bipé mecânico com ajuste vertical e horizontal é tratado como apoio frontal e pesado junto com a carabina.',
        'Os apoios não podem conter o recuo. A carabina deve poder ser levantada verticalmente ou deslizar livremente para frente e para trás; pontas ou garras que se prendam à bancada são proibidas.',
        'Calibre, potência, velocidade e peso máximo dependem da divisão WRABF. Verifique a divisão específica no item B.6 antes de avaliar a carabina.'
      ] },
      { heading: 'Imagem', items: ['Exemplos de projeto de apoio frontal do Appendix G do regulamento internacional WRABF. A imagem ilustra equipamentos; os limites e critérios acima vêm do regulamento CBTE local.'] },
    ],
    sourceReferences: [wrabfCbteReference, wrabfInternationalReference].filter(Boolean).map((reference) => ({
      source_id: reference.source_id,
      document_source_id: reference.document_source_id,
      title: reference.title,
      authority: reference.authority,
      edition: reference.edition,
      locators: reference.locators,
      pdf_path: reference.pdf_path,
      pdf_sha256: reference.pdf_sha256,
      verification_status: reference.verification_status,
    })),
    evidenceType: 'LOCAL_CBTE_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReviewDisclosure: 'Card normativo RENATE. Regras de equipamento vinculadas ao Regulamento Específico CBTE WRABF atualizado em 20/11/2024; a imagem do Appendix G é ilustração oficial e não substitui os critérios escritos. Os limites de carabina variam por divisão.',
    alphaomegaPriority: true,
    sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES_AND_OFFICIAL_WRABF_ILLUSTRATION',
    applicableRouteIds: ['cbte.wrabf.rifle_international'],
  });
  const duelo10mReference = sourceReferenceForLocalDocument('ADANA-SRC-13851AFE541DA476', ['III — Divisões, p. 5']);
  equipmentCards.push({
    cardId: 'CBTE_DUELO_20S_10M_EQUIPMENT_CLASSIFICATION_V1',
    eventId: 'cbte.duelo.10m',
    eventIds: ['cbte.duelo.10m'],
    authority: 'CBTE',
    event: 'Duelo 20 segundos · 10 m · equipamentos e divisões',
    phase: 'equipment',
    category: 'equipment',
    role: 'normative_evidence',
    imagePath: null,
    imageSha256: null,
    imageKind: 'local_equipment_card',
    imageAlt: 'Resumo das classes de pistolas e revólveres do Duelo 20 Segundos 10 m.',
    displaySections: [
      { heading: 'Revólveres', items: [
        'Calibre menor: .22, cano até 6,5 pol.',
        'Calibre maior: .32, .38, .357, 9 mm, .454, .44 ou .45, cano até 6,5 pol.',
        'Snub: .32, .38, .357 ou .44, cano de 2 ou 3 pol.'
      ] },
      { heading: 'Pistolas', items: [
        'Calibre menor: .22 LR ou 6,35 mm, cano até 6 pol.',
        'Calibre maior: 7,65, .380, .38, .38 Super Auto, 9 mm, .40, .44 ou .45, cano até 6 pol.',
        'A regra da prova lista também a divisão Red Dot para todos os calibres, pistolas e revólveres.'
      ] },
      { heading: 'Escopo', items: ['Esta classificação é específica do Duelo 20 Segundos de 10 m. Não aplicar automaticamente ao Duelo de 25 m ou a outras provas.'] },
    ],
    sourceReferences: duelo10mReference ? [{
      source_id: duelo10mReference.source_id,
      document_source_id: duelo10mReference.document_source_id,
      title: duelo10mReference.title,
      authority: duelo10mReference.authority,
      edition: duelo10mReference.edition,
      locators: duelo10mReference.locators,
      pdf_path: duelo10mReference.pdf_path,
      pdf_sha256: duelo10mReference.pdf_sha256,
      verification_status: duelo10mReference.verification_status,
    }] : [],
    evidenceType: 'LOCAL_CBTE_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReviewDisclosure: 'Card normativo RENATE. Classificações transcritas do Regulamento CBTE — Duelo 20 Segundos 10 m, atualizado em 07/01/2025, seção III, p. 5.',
    alphaomegaPriority: true,
    sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
    applicableRouteIds: ['cbte.duelo.10m'],
  });
  const issfShotgunReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['9.4.1–9.4.3.1, pp. 387–390']);
  equipmentCards.push({
    cardId: 'ISSF_TRAP_SKEET_EQUIPMENT_V1',
    eventId: 'issf.event.13',
    eventIds: ['issf.event.13', 'issf.event.14', 'cbte.shotgun.issf'],
    authority: 'ISSF',
    event: 'Trap e Skeet Olímpicos · arma e munição',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Requisitos de arma e munição para Trap e Skeet ISSF.',
    displaySections: [
      { heading: 'Espingarda', items: [
        'Espingarda de alma lisa, até calibre 12. Armas menores que calibre 12 são permitidas; semiautomáticas e pump action são excluídas.',
        'Arma com acabamento camuflado é proibida. Gatilho do tipo release é proibido; bandoleira também.',
        'Miras ópticas ou dispositivos que ampliem ou melhorem visualmente o alvo são proibidos.',
        'Durante a rodada, não se pode trocar uma arma funcional nem suas peças, inclusive choques intercambiáveis.'
      ] },
      { heading: 'Cartuchos', items: [
        'Carga de chumbo: máximo de 24,0 g, com tolerância de +0,5 g para controle. Os chumbos devem ser esféricos e ter até 2,6 mm.',
        'Cartuchos com bucha colorida são proibidos; o chumbo não pode receber cor.'
      ] },
      { heading: 'Escopo', items: ['Aplicável às provas ISSF de Trap e Skeet. Não substitui regras específicas de segurança nem regras CBTE nacionais.'] },
    ],
    sourceReferences: issfShotgunReference ? [{ source_id: issfShotgunReference.source_id, document_source_id: issfShotgunReference.document_source_id, title: issfShotgunReference.title, authority: issfShotgunReference.authority, edition: issfShotgunReference.edition, locators: issfShotgunReference.locators, pdf_path: issfShotgunReference.pdf_path, pdf_sha256: issfShotgunReference.pdf_sha256, verification_status: issfShotgunReference.verification_status }] : [],
    evidenceType: 'LOCAL_ISSF_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReviewDisclosure: 'Card normativo RENATE. ISSF Rule Book 2026, edição 2025, terceira impressão 10/2026; vigente desde 19/10/2026.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
    applicableRouteIds: ['issf.event.13', 'issf.event.14', 'cbte.shotgun.issf'],
  });
  const cbteTrapReference = sourceReferenceForLocalDocument('ADANA-SRC-277F6EDC18262298', ['2.5.1–2.5.2']);
  equipmentCards.push({
    cardId: 'CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1',
    eventId: 'cbte.shotgun.trap_nacional', eventIds: ['cbte.shotgun.trap_nacional'],
    authority: 'CBTE', event: 'Trap Nacional · arma e munição',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Requisitos CBTE de espingarda e munição para Trap Nacional.',
    displaySections: [
      { heading: 'Calibre 12', items: [
        'São aceitos cartuchos novos ou recarregados em cápsula plástica, com até 32 g de chumbo e granulometria 7½ ou mais fina (8 ou 9).',
        'A câmara da espingarda não pode exceder calibre 12. Semiautomática exige limitador de ejeção ou aviso prévio e consentimento do atleta ao lado, no lado da ejeção.',
        'Nas etapas regionais e na Final, somente munição nova; a regra prevê pesagem de amostra de dez cartuchos e limite de 370 g. Cápsulas de papelão recarregadas não são aceitas.'
      ] },
      { heading: 'Arma de calibre menor', items: ['Permitida. Os cartuchos devem ser novos, com até 24 g de chumbo e granulometria 7½ ou mais fina (8 ou 9).'] },
      { heading: 'Escopo', items: ['Regulamento Geral CBTE 2026 de Trap. As condições de munição e pesagem variam conforme etapa e calibre; confira o item citado para a situação da prova.'] },
    ],
    sourceReferences: cbteTrapReference ? [{ source_id: cbteTrapReference.source_id, document_source_id: cbteTrapReference.document_source_id, title: cbteTrapReference.title, authority: cbteTrapReference.authority, edition: cbteTrapReference.edition, locators: cbteTrapReference.locators, pdf_path: cbteTrapReference.pdf_path, pdf_sha256: cbteTrapReference.pdf_sha256, verification_status: cbteTrapReference.verification_status }] : [],
    evidenceType: 'LOCAL_CBTE_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReviewDisclosure: 'Card normativo RENATE. Regulamento Geral de Trap CBTE 2026, item 2.5.1–2.5.2.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
    applicableRouteIds: ['cbte.shotgun.trap_nacional'],
  });
  const movingTargetReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['10.5.1–10.5.1.2, p. 462']);
  equipmentCards.push({
    cardId: 'ISSF_MOVING_TARGET_MARKER_TAPE_V1',
    eventId: 'issf.event.15', eventIds: ['issf.event.15', 'issf.event.16', 'issf.event.17', 'issf.event.18'],
    authority: 'ISSF', event: 'Moving Target · fita de marcação',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Especificação e posicionamento da fita ISSF de Moving Target.',
    displaySections: [
      { heading: 'Especificação da fita', items: ['Fita oficial ISSF: 250 mm de comprimento, 30 mm de largura, amarela e com logotipo ISSF; deve ficar permanentemente presa no lado direito da roupa externa.'] },
      { heading: 'Posição e conferência', items: [
        'Fixar horizontalmente abaixo da ponta do cotovelo.',
        'Para verificar a posição: bolsos da roupa externa vazios; braço do gatilho junto ao corpo e dobrado na posição totalmente fechada, inclinada para cima; ombros sem elevação.',
        'O Controle de Equipamento pode verificar e aplicar selo ou marca.'
      ] },
      { heading: 'Escopo', items: ['Aplicável às provas ISSF de Moving Target de 10 m e 50 m, inclusive eventos mistos. Não confundir com a fita de Skeet, regida por outra seção.'] },
    ],
    sourceReferences: movingTargetReference ? [{ source_id: movingTargetReference.source_id, document_source_id: movingTargetReference.document_source_id, title: movingTargetReference.title, authority: movingTargetReference.authority, edition: movingTargetReference.edition, locators: movingTargetReference.locators, pdf_path: movingTargetReference.pdf_path, pdf_sha256: movingTargetReference.pdf_sha256, verification_status: movingTargetReference.verification_status }] : [],
    evidenceType: 'LOCAL_ISSF_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReviewDisclosure: 'Card normativo RENATE. ISSF Rule Book 2026, edição 2025, terceira impressão 10/2026; vigente desde 19/10/2026.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
    applicableRouteIds: ['issf.event.15', 'issf.event.16', 'issf.event.17', 'issf.event.18'],
  });
  const wspsKneelingReference = sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['4.2.1.2, p. 41']);
  equipmentCards.push({
    cardId: 'WSPS_RIFLE_KNEELING_TABLE_SUPPORT_V1',
    eventId: 'wsps.event.r7', eventIds: ['wsps.event.r7', 'wsps.event.r8'],
    authority: 'WSPS', event: 'R7/R8 · ajoelhado com cadeira e mesa',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Regras WSPS para apoio de cotovelo e antebraço no ajoelhado com cadeira e mesa.',
    displaySections: [
      { heading: 'Apoio do atleta', items: [
        'Quando se usa cadeira de tiro e mesa na posição ajoelhada, somente um cotovelo pode repousar na mesa ou prancha; o corpo deve permanecer bem afastado da prancha.',
        'O antebraço de apoio deve formar ângulo mínimo de 30° em relação à horizontal. Somente a ponta do cotovelo pode ficar apoiada no bloco de 10 cm.',
        'Não se pode obter apoio na estrutura da mesa/prancha ou nos braços da cadeira; os braços da cadeira que não servem para fixar a mesa/prancha devem ser removidos.'
      ] },
      { heading: 'Escopo', items: ['Este trecho é da posição ajoelhada com cadeira e mesa, WSPS 4.2.1.2. A pergunta do snapshot atribui SH2, mas o item citado não limita a regra a SH2; use a classificação e a prova do atleta para decidir a aplicabilidade.'] },
    ],
    sourceReferences: wspsKneelingReference ? [{ source_id: wspsKneelingReference.source_id, document_source_id: wspsKneelingReference.document_source_id, title: wspsKneelingReference.title, authority: wspsKneelingReference.authority, edition: wspsKneelingReference.edition, locators: wspsKneelingReference.locators, pdf_path: wspsKneelingReference.pdf_path, pdf_sha256: wspsKneelingReference.pdf_sha256, verification_status: wspsKneelingReference.verification_status }] : [],
    evidenceType: 'LOCAL_WSPS_RULEBOOK_WITH_SHA256_AND_LOCATORS',
    sourceReviewDisclosure: 'Card normativo RENATE. Regras Técnicas WSPS 2026, item 4.2.1.2, p. 41.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES_SCOPE_DISCLOSURE',
    applicableRouteIds: ['wsps.event.r7', 'wsps.event.r8'],
  });
  const issfRifleEquipmentReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', [
    '6.5.3', '6.7', '7.4', '7.5.2.3', '7.5.3.1–7.5.3.6', '7.5.4.1–7.5.4.10',
    '7.5.5.1–7.5.5.6', '7.5.6.1–7.5.6.2', '7.5.8.2', '7.6.1.3(i)',
  ]);
  equipmentCards.push({
    cardId: 'ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1',
    eventId: 'issf.event.01',
    eventIds: ['issf.event.01', 'issf.event.02', 'issf.event.03', 'issf.event.04', 'issf.event.05', 'issf.event.06'],
    applicableRouteIds: ['issf.event.01', 'issf.event.02', 'issf.event.03', 'issf.event.04', 'issf.event.05', 'issf.event.06'],
    authority: 'ISSF', event: 'Rifle ISSF · equipamento, vestuário e apoios', title: 'Rifle ISSF — equipamento e vestuário',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Card textual de equipamento e vestuário para Rifle ISSF.',
    displaySections: [
      { heading: 'Posição e apoios', items: [
        'Na posição em pé, o braço de suporte pode apoiar-se no tronco dentro dos limites da posição; apoio externo não é permitido. (ISSF 7.6.1)',
        'Apoio de palma e demais componentes dependem da configuração e dos limites dimensionais da posição; confira a regra específica antes de usar. (ISSF 7.4; 7.6)',
      ] },
      { heading: 'Bandoleira', items: [
        'Largura máxima: 40 mm. Deve ser usada somente na parte superior do braço esquerdo e conectada ao antebraço da coronha em um único ponto; se formar uma alça ao redor da mão ou do punho, as duas partes devem ser unidas e não podem exceder 40 mm de largura nesse trecho. (ISSF 7.5.8.2)',
        'A bandoleira é proibida na posição em pé. (ISSF 7.6.1.3(i))',
      ] },
      { heading: 'Sapato de tiro', items: [
        'Sapatos especiais de tiro são permitidos somente em 10 m, 50 m e 300 m três posições; não podem ser usados em Rifle Deitado. A sola deve ter até 10 mm de espessura na ponta; a altura máxima é 2/3 do comprimento da sola; o material superior tem até 4 mm e a sola não pode avançar mais de 5 mm além do contorno externo. (ISSF 7.5.3.1–7.5.3.6)',
        'No teste de flexibilidade, a sola deve dobrar pelo menos 22,5° com aplicação de 15 Newton-metros no calcanhar, no dispositivo de teste. A unidade é reproduzida como aparece no Rule Book. (ISSF 7.5.2.3; 6.5.3)',
      ] },
      { heading: 'Calça de tiro', items: [
        'Permitida em Rifle Deitado e em qualquer estágio das provas de Rifle Três Posições. Espessura máxima: 2,5 mm em camada simples ou 5 mm em camada dupla. (ISSF 7.5.5.1; 7.5.5.4)',
        'Não há um limite numérico de transpasse indicado para a calça nesses itens. A regra limita, entre outros pontos, cintura, bolsos, folga, fechos, cós e passadores. (ISSF 7.5.5.1–7.5.5.6)',
      ] },
      { heading: 'Casaco de tiro', items: [
        'Espessura máxima do material: 2,5 mm simples ou 5 mm duplo. No fechamento, o transpasse não pode exceder 100 mm; o casaco também deve permitir pelo menos 80 mm de transpasse além do fechamento normal, medidos conforme o método da regra. Podem ser usadas no máximo cinco casas de botão simultaneamente para fechar o casaco. (ISSF 7.5.4.1–7.5.4.2)',
      ] },
      { heading: 'Luva de tiro', items: [
        'Espessura total máxima de 16 mm; a luva não pode avançar mais de 50 mm além do pulso, medidos do centro da articulação indicada. Fecho ou tira no pulso são proibidos. (ISSF 7.5.6.1–7.5.6.2)',
      ] },
      { heading: 'Vestuário e controle', items: [
        'Jaqueta, calça, sapato e luva de tiro precisam cumprir as especificações ISSF. Calças estão sujeitas a limites de construção, espessura e rigidez. (ISSF 7.5; 7.5.5)',
        'Inspeções de equipamento podem ocorrer antes da prova e verificações pós-competição podem ser feitas segundo as regras de controle. (ISSF 6.7; 6.7.9)',
        'Camadas, bandagens, fitas e acessórios não podem criar apoio ou vantagem fora do permitido. (ISSF 6.7; 7.4–7.5)',
      ] },
      { heading: 'Escopo', items: ['Resumo do Rifle ISSF. Medidas e permissões variam por componente e posição; consulte os itens citados e as passagens locais antes de aplicar a um modelo ou prova específica.'] },
    ],
    sourceReferences: issfRifleEquipmentReference ? [issfRifleEquipmentReference] : [],
    evidenceType: 'LOCAL_ISSF_RULEBOOK_WITH_SHA256_AND_LOCATORS', sourceQnaIds: ['RENATE:ISSF-RIFLE-APPAREL:001:A01'],
    sourceReviewDisclosure: 'Resumo do ISSF Rule Book 2026, Edition 2025, Third Print 10/2026, vigente desde 19/10/2026. Sem imagem: o card apresenta regras textuais e remete aos itens normativos locais.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
  });
  const wspsRifleApparelReference = sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['1.1.3', '3.1.1–3.1.2', '3.2.1.1–3.2.1.7', '3.2.2.1–3.2.2.3', '3.2.3.1–3.2.3.2', '4.2.2.6(a)']);
  const wspsRifleApparelIssfReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['6.5.3', '7.5.2.3', '7.5.3.1–7.5.3.6', '7.5.4.1–7.5.4.2', '7.5.5.1–7.5.5.6', '7.5.6.1–7.5.6.2', '7.5.8.2', '7.6.1.3(i)']);
  equipmentCards.push({
    cardId: 'WSPS_RIFLE_APPAREL_AND_SLING_V1',
    eventId: 'wsps.event.r1',
    eventIds: ['wsps.event.r1', 'wsps.event.r2', 'wsps.event.r3', 'wsps.event.r4', 'wsps.event.r5', 'wsps.event.r6', 'wsps.event.r7', 'wsps.event.r8', 'wsps.event.r9', 'wsps.event.r10', 'wsps.event.r11', 'wsps.event.vip', 'wsps.event.vis'],
    applicableRouteIds: ['wsps.event.r1', 'wsps.event.r2', 'wsps.event.r3', 'wsps.event.r4', 'wsps.event.r5', 'wsps.event.r6', 'wsps.event.r7', 'wsps.event.r8', 'wsps.event.r9', 'wsps.event.r10', 'wsps.event.r11', 'wsps.event.vip', 'wsps.event.vis'],
    authority: 'WSPS', event: 'Rifle WSPS · vestuário, calçado e bandoleira', title: 'Rifle WSPS — vestuário, calçado e bandoleira',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Card textual sobre vestuário, calçado e bandoleira em Rifle WSPS.',
    displaySections: [
      { heading: 'Regra-base e sapatos', items: [
        'A regra de vestuário ISSF se aplica, salvo disposição WSPS diferente. Assim, as dimensões ISSF do sapato de tiro e o teste de flexibilidade são a base WSPS. Exceção: calçado ortopédico ou não conforme ao código ISSF pode ser autorizado por motivo médico e anotado na licença; nesse caso não é testado quanto à flexibilidade. (WSPS 1.1.3; 3.1.1–3.1.2; 3.2.3.2; ISSF 7.5.2.3; 7.5.3.1–7.5.3.6)',
      ] },
      { heading: 'Casaco WSPS', items: [
        'O casaco WSPS não pode ultrapassar o colo na frente nem o topo da almofada atrás; o comprimento é medido na posição de tiro em pé. O atleta não pode sentar sobre qualquer parte do casaco. SH1B, SH1C e SH2 Rifle devem usar casaco WSPS; atleta que atira no chão na posição deitado pode usar casaco ISSF. (WSPS 3.2.1.1–3.2.1.4)',
        'Para SH1A Rifle, o uso de casaco ISSF depende da posição/configuração da tabela 3.2.1.5. No tiro a partir de cadeira nas posições ajoelhada ou deitado, somente os três botões superiores podem ser fechados, não abaixo da parte inferior da caixa torácica; botões adicionais não podem ser usados. Casaco ISSF não é permitido para SH1A em pé a partir de cadeira. (WSPS 3.2.1.5)',
        'A WSPS não fixa um valor próprio de espessura/transpasse para o casaco WSPS nos itens 3.2.1.1–3.2.1.7; aplicam-se as regras ISSF de vestuário quando compatíveis, junto das restrições WSPS de comprimento, classe e posição. (WSPS 3.1.1–3.1.2; ISSF 7.5.4.1–7.5.4.2)',
      ] },
      { heading: 'Calça WSPS', items: [
        'Calças de tiro são proibidas para SH1B, SH1C e todas as classes SH2. Para SH1A Rifle, são permitidas em pé de banqueta alta ou sem apoio, ajoelhado e deitado, conforme as regras ISSF aplicáveis. (WSPS 3.2.2.1–3.2.2.2)',
        'Em R7/R8, atleta com prótese de membro inferior pode manter a calça nas posições ajoelhada de cadeira e deitado se não puder removê-la por causa da prótese; em posição, zíperes das pernas e cós devem ficar abertos. Quando permitida, valem os limites ISSF de espessura e construção. (WSPS 3.2.2.3; ISSF 7.5.5.1–7.5.5.6)',
      ] },
      { heading: 'Luva e bandoleira', items: [
        'Como regra-base ISSF, a luva pode ter até 16 mm de espessura total, avançar no máximo 50 mm além do pulso e não pode ter tira ou fecho no pulso. (ISSF 7.5.6.1–7.5.6.2; WSPS 1.1.3)',
        'Como regra-base ISSF, a bandoleira tem largura máxima de 40 mm; é proibida em pé pela regra ISSF. Exceção WSPS explícita: em SH2 deitado, o uso de bandoleira é proibido. Confirme a classe e posição da prova antes de aplicar. (ISSF 7.5.8.2; 7.6.1.3(i); WSPS 4.2.2.6(a))',
      ] },
    ],
    sourceReferences: [wspsRifleApparelReference, wspsRifleApparelIssfReference].filter(Boolean),
    evidenceType: 'LOCAL_WSPS_AND_ISSF_RULEBOOKS_WITH_SHA256_AND_LOCATORS', sourceQnaIds: ['RENATE:WSPS-RIFLE-APPAREL:001:A01'],
    sourceReviewDisclosure: 'Resumo das regras WSPS 2026 vFinal e das regras ISSF incorporadas pela WSPS quando não há disposição WSPS diferente. Veja as regras locais vinculadas; a classe/posição pode alterar a permissão.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES_SCOPE_DISCLOSURE',
  });
  const movingTargetSlingReference = sourceReferenceForLocalDocument('ADANA-SRC-2A79B10E08375DE1', ['10.5', '10.7']);
  equipmentCards.push({
    cardId: 'ISSF_MOVING_TARGET_SLING_RULE_V1',
    eventId: 'issf.event.15', eventIds: ['issf.event.15', 'issf.event.16', 'issf.event.17', 'issf.event.18'],
    applicableRouteIds: ['issf.event.15', 'issf.event.16', 'issf.event.17', 'issf.event.18'],
    authority: 'ISSF', event: 'Moving Target · uso de bandoleira', title: 'Moving Target ISSF — bandoleira',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Card textual ISSF sobre bandoleira em Moving Target.',
    displaySections: [
      { heading: 'Bandoleira', items: ['A bandoleira não é permitida na prova ISSF de Moving Target. (ISSF 10.5; 10.7)'] },
      { heading: 'Escopo', items: ['Aplicável às provas ISSF de Moving Target cobertas pelos itens citados. Consulte a regra local para a disciplina e a distância específicas.'] },
    ],
    sourceReferences: movingTargetSlingReference ? [movingTargetSlingReference] : [],
    evidenceType: 'LOCAL_ISSF_RULEBOOK_WITH_SHA256_AND_LOCATORS', sourceQnaIds: [],
    sourceReviewDisclosure: 'Resumo do ISSF Rule Book 2026, Edition 2025, Third Print 10/2026, vigente desde 19/10/2026. Sem imagem: a regra é apresentada em texto com vínculo ao PDF local.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
  });
  const wspsParaTrapSupportReference = sourceReferenceForLocalDocument('ADANA-SRC-892D95743F291E6F', ['6.2.2.2', '6.2.3.2', '6.3.1–6.3.3', '6.4.1–6.4.3']);
  equipmentCards.push({
    cardId: 'WSPS_PARATRAP_ADAPTIVE_SUPPORT_V1',
    eventId: 'wsps.event.pt1', eventIds: ['wsps.event.pt1', 'wsps.event.pt2', 'wsps.event.pt3'],
    applicableRouteIds: ['wsps.event.pt1', 'wsps.event.pt2', 'wsps.event.pt3'],
    authority: 'WSPS', event: 'Para Trap · suporte adaptativo e segurança', title: 'Para Trap WSPS — suportes adaptativos',
    phase: 'equipment', category: 'equipment', role: 'normative_evidence',
    imagePath: null, imageSha256: null, imageKind: 'local_equipment_card',
    imageAlt: 'Card textual WSPS de suporte adaptativo e segurança em Para Trap.',
    displaySections: [
      { heading: 'Aplicação por classe', items: [
        'SG-U deve usar o suporte de carregamento adaptativo fornecido pelo organizador em cada estação. (WSPS 6.3.1)',
        'Para outros casos, a classificação pode encaminhar à Jury uma avaliação individual de segurança sobre carregar, segurar ou disparar a espingarda. Se prótese aprovada e/ou suporte adaptativo não resolverem o risco de operação segura, o atleta não pode competir em Shotgun. (WSPS 6.3.2)',
      ] },
      { heading: 'Aprovação e limites', items: [
        'Salvo a exceção prevista na regra 6.3, os dispositivos adaptativos devem ser aprovados pela WSPS, inspecionados e, quando aprovados, anotados na licença do atleta. (WSPS 6.4.1)',
        'Não se deve generalizar a obrigatoriedade do suporte de carregamento para as três classes: a regra 6.3.1 nomeia SG-U e 6.3.2 prevê avaliação individual para outras situações.',
      ] },
    ],
    sourceReferences: wspsParaTrapSupportReference ? [wspsParaTrapSupportReference] : [],
    evidenceType: 'LOCAL_WSPS_RULEBOOK_WITH_SHA256_AND_LOCATORS', sourceQnaIds: [],
    sourceReviewDisclosure: 'Resumo textual do WSPS Rulebook 2026 vFinal, vigente desde 01/01/2026. O conteúdo segue as regras citadas da fonte local.',
    alphaomegaPriority: true, sourceReviewState: 'SOURCE_BOUND_LOCAL_RULES',
  });
  const wspsProgrammeReference = sourceReferenceForLocalDocument('ADANA-SRC-3B1650384F55C206', ['Appendix 2 §1.1–1.2, p. 7']);
  eventEvidenceCards.push({
    cardId: 'WSPS_PROGRAM_OF_EVENTS_V1',
    eventId: 'wsps.event.p1',
    eventIds: ['wsps.event.p1', 'wsps.event.p2', 'wsps.event.p3', 'wsps.event.p4', 'wsps.event.p5', 'wsps.event.p6', 'wsps.event.pt1', 'wsps.event.pt2', 'wsps.event.pt3', 'wsps.event.r1', 'wsps.event.r2', 'wsps.event.r3', 'wsps.event.r4', 'wsps.event.r5', 'wsps.event.r6', 'wsps.event.r7', 'wsps.event.r8', 'wsps.event.r9', 'wsps.event.r10', 'wsps.event.r11', 'wsps.event.vis', 'wsps.event.vip'],
    applicableRouteIds: ['wsps.event.p1', 'wsps.event.p2', 'wsps.event.p3', 'wsps.event.p4', 'wsps.event.p5', 'wsps.event.p6', 'wsps.event.pt1', 'wsps.event.pt2', 'wsps.event.pt3', 'wsps.event.r1', 'wsps.event.r2', 'wsps.event.r3', 'wsps.event.r4', 'wsps.event.r5', 'wsps.event.r6', 'wsps.event.r7', 'wsps.event.r8', 'wsps.event.r9', 'wsps.event.r10', 'wsps.event.r11', 'wsps.event.vis', 'wsps.event.vip'],
    authority: 'WSPS', event: 'Programas de eventos WSPS', title: 'WSPS — programas de competição',
    phase: 'program', category: 'event_program', role: 'normative_evidence', evidenceType: 'LOCAL_WSPS_APPENDIX_WITH_SHA256_AND_LOCATORS',
    sourceReferences: wspsProgrammeReference ? [wspsProgrammeReference] : [], sourceQnaIds: [],
    displaySections: [
      { heading: 'Programa 1 · Jogos Paralímpicos', items: ['Inclui R1–R9 e P1–P4. No quadro do Appendix 2, é aceito para Jogos Paralímpicos (PG), não para WCH nem para Grand Prix/World Cup/RCH.'] },
      { heading: 'Programa 2 · Campeonatos Mundiais', items: ['Inclui R1–R11, P1–P6, VIS–VIP e PT1–PT3. No quadro, é aceito para WCH, não para PG nem para Grand Prix/World Cup/RCH.'] },
      { heading: 'Programa 3 · Grand Prix', items: ['Permite qualquer combinação de eventos do Programa 2 aprovada pela WSPS; o quadro indica aceitação em Grand Prix, não em WCH nem em PG.'] },
      { heading: 'Jogos IPC', items: ['O programa dos Jogos IPC é confirmado no guia de qualificação da competição. (Appendix 2 §1.2)'] },
    ],
    sourceReviewDisclosure: 'Transcrição estruturada da tabela do WSPS Rulebook Appendices 2026 vFinal, Appendix 2 §1.1–1.2, p. 7. Sem imagem: os critérios e códigos dos programas são apresentados em texto.',
  });
  // One SPEC-defined visual contract across phase, normative and equipment cards.
  // Keep image content, IDs, sections, evidence bindings and source order intact.
  for (const card of eventEvidenceCards) {
    card.layout = 'RENATE_UNIFIED_CARD_V1';
    card.skinReference = 'RENATE_R6_APPROVED_VISUAL_MODEL';
    card.category ??= 'event_phase';
    card.displaySections ??= [];
    if (!card.displaySections.length && card.imagePath?.toLowerCase().endsWith('.svg')) {
      const svgPath = path.join(outputRoot, card.imagePath.replace(/^\.\//, '').replaceAll('/', path.sep));
      const svg = fs.readFileSync(svgPath, 'utf8');
      const description = svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/i)?.[1]
        ?.replace(/<[^>]*>/g, ' ').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'").trim();
      if (description) card.displaySections = [{ heading: 'Descrição do infográfico', items: [description] }];
    }
  }
  for (const card of equipmentCards) {
    card.layout = 'RENATE_UNIFIED_CARD_V1';
    card.skinReference = 'RENATE_R6_APPROVED_VISUAL_MODEL';
    card.category = 'equipment';
    card.displaySections ??= [];
    if (card.cardId === 'SHOTGUN_TRAP_SKEET_DIMENSIONS_V1') {
      const trapPhoto = copyHashed('img/Trap_ISSF.jpeg', 'cards/photos/Trap_ISSF.jpeg', null, 'Foto local de prova Trap para card de dimensões');
      const skeetPhoto = copyHashed('img/Skeet_ISSF.jpeg', 'cards/photos/Skeet_ISSF.jpeg', null, 'Foto local de prova Skeet para card de dimensões');
      const clayTarget = copyHashed('data/imports/renate_generated_cards_2026-11-07/ISSF_Clay_Target_Photorealistic.png', 'cards/photos/ISSF_Clay_Target_Photorealistic.png', null, 'Ilustração fotorrealista local de prato de Trap/Skeet');
      card.photoGallery = [
        { path: trapPhoto.path, sha256: trapPhoto.sha256, label: 'Trap · espingarda em prova', alt: 'Fotografia local de atleta com espingarda em prova de Trap.' },
        { path: skeetPhoto.path, sha256: skeetPhoto.sha256, label: 'Skeet · espingarda em prova', alt: 'Fotografia local de atleta com espingarda em prova de Skeet.' },
        { path: clayTarget.path, sha256: clayTarget.sha256, label: 'Prato · ilustração realista', alt: 'Ilustração fotorrealista de prato de argila usado em Trap e Skeet; imagem gerada por IA.' },
      ];
      card.photoNote = 'O diagrama técnico continua mostrando os pontos de medida. As fotografias e a ilustração realista complementam o esquema; a imagem do prato é gerada por IA.';
    }
  }
  const wrabfCompetitionPhoto = copyHashed('img/wrabf_issf.png', 'cards/photos/wrabf_issf.png', null, 'Fotografia de competidores WRABF adicionada em RENATE/img pela usuária');
  const wrabfTargetPhoto = copyHashed('library/img/CARDS_PROVAS/WRABF_Official_50m_Target_2024.jpg', 'cards/photos/WRABF_Official_50m_Target_2024.jpg', null, 'Alvo oficial WRABF 50 m já disponível na Library RENATE');
  const wrabfQualificationCard = eventEvidenceCards.find((card) => card.cardId === 'cbte.wrabf.rifle_international:qualification');
  if (wrabfQualificationCard) {
    wrabfQualificationCard.photoPath = wrabfCompetitionPhoto.path;
    wrabfQualificationCard.photoSha256 = wrabfCompetitionPhoto.sha256;
    wrabfQualificationCard.photoAlt = 'Atletas em prova de Benchrest, sentados nas bancadas e atirando com carabinas apoiadas; fotografia ilustrativa da competição.';
    wrabfQualificationCard.photoProvenance = 'FOTOGRAFIA_LOCAL_ADICIONADA_EM_RENATE_IMG; ARQUIVO_ORIGINAL_PRESERVADO; SHA256_REGISTRADO; NAO_EVIDENCIA_NORMATIVA';
    wrabfQualificationCard.photoGallery = [{ path: wrabfTargetPhoto.path, sha256: wrabfTargetPhoto.sha256, label: 'Alvo oficial WRABF 50 m', alt: 'Imagem local do alvo oficial WRABF 50 m, edição 2024.' }];
    wrabfQualificationCard.photoNote = 'A fotografia mostra competidores em uma linha de Benchrest e é ilustrativa; o alvo oficial WRABF é apresentado separadamente. Fatos e regras do card continuam apoiados nas fontes normativas locais.';
  }
  for (const card of eventEvidenceCards) {
    if (card.photoPath || card.photoGallery?.length) continue;
    const photo = eventPhotoFor(card.eventId, card.event);
    if (!photo || photo.path === card.imagePath) continue;
    card.photoPath = photo.path;
    card.photoSha256 = photo.sha256;
    card.photoAlt = photo.alt;
    card.photoProvenance = photo.kind === 'photorealistic_illustration'
      ? (card.eventId.startsWith('cbte.duelo.') ? 'ILUSTRACAO_FOTORREALISTA_LOCAL_RECORTADA_DE_CARD_DUELO_20S_10M; REUSO EM 25M APROVADO PELO USUARIO' : 'ILUSTRACAO_FOTORREALISTA_LOCAL; ARQUIVO ORIGINAL PRESERVADO')
      : 'FOTOGRAFIA LOCAL RENATE IMG; ARQUIVO ORIGINAL PRESERVADO';
  }
  writeJson('cards.json', { schema: 'RENATE_STANDARDIZED_CARDS_V3', layout: 'RENATE_UNIFIED_CARD_V1', skinReference: 'RENATE_R6_APPROVED_VISUAL_MODEL', cards: runtimeCardRecords, eventEvidenceCards, equipmentCards });
  writeJson('imported-cards-catalog.json', { schema: 'RENATE_IMPORTED_ADANA_CARDS_CATALOG_V1', sourceSnapshot: adanaCardSnapshotPath, sourceSnapshotSha256: sha256(localPath(adanaCardSnapshotPath)), assetPolicy: adanaCardSnapshot.asset_policy, cards: importedCardCatalog, assets: importedCardAssets });
  writeJson('figures.json', { schema: 'RENATE_RULE_PAGE_CROPS_V1', figures: packedFigureCrops });
  const inputPaths = [atlasPath, supplementPath, tieBreakingSupplementPath, rifleApparelQaPath, alphaomegaAssociationPath, bindingPath, pretestPath, cardPath, 'library/manifest.csv', 'data/imports/user_provided_card_images_2026-11-06/IMAGE_PROVENANCE.json', ...supplementAssetPaths, 'data/imports/renate_generated_cards_2026-11-07/wrabf-front-rest-appendix-g.png', ...targetSprintPhotoFiles.map(({ file }) => `IMG/${file}`), 'img/WSPS_P3.png', 'img/WSPS_P5.png', 'img/Duelo_20_10m_photo_reused.png', 'img/wrabf_issf.png', 'library/img/CARDS_PROVAS/Imagem do ChatGPT 29 de set. de 2026, 11_12_14-1.png', ...Object.values(eventPhotoSources).map(([sourcePath]) => sourcePath)];
  const sourceHashes = Object.fromEntries(inputPaths.map((file) => [file, sha256(path.join(root, file))]));
  const manifest = {
    schema: 'RENATE_VERSIONED_LOCAL_PACKAGE_V1',
    version: packageInfo.version,
    generatedAt: new Date().toISOString(),
    source: 'RENATE local snapshots only',
    noBackend: true,
    counts: {
      atlasQna: atlas.length,
      pretestPassResponses: eligiblePretests.length,
      documents: packedDocs.length,
      pdfs: packedDocs.length,
      ocrFiles: packedDocs.reduce((sum, doc) => sum + doc.ocrs.length, 0),
      ruleChunks: ruleChunks.length,
      standardizedCards: runtimeCardRecords.length + eventEvidenceCards.length + equipmentCards.length,
      runtimeEquipmentCards: equipmentCards.length,
      alphaomegaAssociatedQuestions: alphaomegaQuestionIds.size,
      normativeEvidenceCards: eventEvidenceCards.length,
      normativeQualificationCards: eventEvidenceCards.filter((card) => card.phase === 'qualification').length,
      normativeFinalCards: eventEvidenceCards.filter((card) => card.phase === 'final').length,
      cbteNormativeQualificationCards: eventEvidenceCards.filter((card) => card.authority === 'CBTE' && card.phase === 'qualification').length,
      cbteNormativeFinalCards: eventEvidenceCards.filter((card) => card.authority === 'CBTE' && card.phase === 'final').length,
      cbteRoutesWithNormativeCards: new Set(eventEvidenceCards.filter((card) => card.authority === 'CBTE').map((card) => card.eventId)).size,
      issfRoutesWithNormativeCards: new Set(eventEvidenceCards.filter((card) => card.authority === 'ISSF').map((card) => card.eventId)).size,
      wspsRoutesWithNormativeCards: new Set([...runtimeCardRecords.filter((card) => card.authority === 'WSPS').map((card) => card.eventId), ...eventEvidenceCards.filter((card) => card.authority === 'WSPS').map((card) => card.eventId)]).size,
      importedPhaseCards: importedCardCatalog.filter((card) => card.phase).length,
      importedEquipmentCards: importedCardCatalog.filter((card) => card.category === 'equipment').length,
      importedCardAssets: importedCardAssets.length,
      existingRenateEligibleCards: cardRecords.length,
      explicitlyApprovedImportedCards: p6RuntimeCards.length,
      importedCardsWithoutRecordedReviewPresentedAsVisuals: importedRuntimeCards.length,
      archivedLegacyCards: cardRecords.length + importedOriginalCardArchives.length,
      figureCrops: packedFigureCrops.length,
    },
    bytes: { pdfs: packedDocs.reduce((sum, doc) => sum + doc.pdf.bytes, 0), ocrs: packedDocs.flatMap((doc) => doc.ocrs).reduce((sum, ocr) => sum + ocr.bytes, 0), cardPhotos: [...new Set(runtimeCardRecords.flatMap((card) => [card.photoPath, ...(card.photoGallery ?? []).map((photo) => photo.path)].filter(Boolean)))].reduce((sum, assetPath) => sum + fs.statSync(path.join(outputRoot, assetPath.slice(2))).size, 0), importedCardAssets: importedCardAssets.reduce((sum, asset) => sum + asset.bytes, 0), figureCrops: packedFigureCrops.reduce((sum, crop) => sum + crop.assetBytes, 0) },
    sourceHashes: { ...sourceHashes, [adanaCardSnapshotPath]: sha256(localPath(adanaCardSnapshotPath)), [adanaCardAuditPath]: sha256(localPath(adanaCardAuditPath)), [approvalPath]: p6ApprovalPack.sha256, [r6PhotoSourcePath]: r6PhotoPack.sha256, [r6PhotoMetadataPath]: sha256(localPath(r6PhotoMetadataPath)), 'img/R4_wsps.png': r4QualificationPhoto.sha256, 'img/R4_2_wsps.png': r4FinalPhoto.sha256, 'img/R7_kneeling_wsps.png': r7KneelingPhoto.sha256, 'img/R7_prone_wsps.png': r7PronePhoto.sha256, 'img/R7_standing_wsps.png': r7StandingPhoto.sha256, 'img/R8_standing_wsps.png': r8StandingQualificationPhoto.sha256, 'img/R8_standing_wsps_2.png': r8StandingFinalPhoto.sha256 },
    files: [
      ...packedDocs.flatMap((doc) => [doc.pdf, ...doc.ocrs]),
      ...cardRecords.flatMap((card) => [{ path: card.localLegacyArchive, sha256: card.legacyAssetSha256 }, ...(card.photoPath ? [{ path: card.photoPath, sha256: card.photoSha256 }] : [])]),
      ...runtimeCardRecords.flatMap((card) => [...new Map([...(card.photoPath ? [{ path: card.photoPath, sha256: card.photoSha256 }] : []), ...(card.photoGallery ?? [])].map((asset) => [asset.path, asset])).values()].map((asset) => ({ path: asset.path, sha256: asset.sha256 ?? sha256(path.join(outputRoot, asset.path.slice(2))), bytes: fs.statSync(path.join(outputRoot, asset.path.slice(2))).size }))),
      ...importedCardAssets,
      ...importedOriginalCardArchives,
      p6ApprovalPack,
      r6PhotoPack,
      ...packedFigureCrops.map((crop) => ({ path: crop.assetPath, sha256: crop.assetSha256, bytes: crop.assetBytes, sourcePdfSha256: crop.pdf_sha256, sourcePage: crop.page, sourceLocator: crop.locator })),
    ],
  };
  manifest.packageSha256 = crypto.createHash('sha256').update(JSON.stringify({ ...manifest, generatedAt: undefined })).digest('hex');
  writeJson('manifest.json', manifest);
  console.log(JSON.stringify({ state: 'PASS', ...manifest.counts, bytes: manifest.bytes, packageSha256: manifest.packageSha256, output: 'public/renate-pack/' }, null, 2));
}
