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
const pretestPath = 'data/imports/day1_2026-11-06/chatbot-candidates/pretest_responses_candidate.json';
const cardPath = 'data/imports/day1_2026-11-06/cards/cards_allowlist_p4_p5.json';
const adanaCardSnapshotPath = 'data/imports/adana_cards_2026-11-06/adana_competition_cards_v1.snapshot.json';
const adanaCardAuditPath = 'data/imports/adana_cards_2026-11-06/IMPORT_AUDIT.json';
const atlas = readJsonl(atlasPath);
const bindings = readJsonl(bindingPath);
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

if (atlas.length !== 960) errors.push(`Snapshot ATLAS contém ${atlas.length} linhas; esperado 960.`);
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
for (const card of runtimeCardRecords) {
  if (card.cardId.startsWith('wsps.event.r3:')) card.displaySections = r3Facts;
  if (card.cardId === 'wsps.event.r5:qualification') card.displaySections = r5QualificationFacts;
  card.displaySections = card.displaySections?.map((section) => ({ ...section, items: [...section.items] })) ?? [];
}

// Apply only the six image candidates explicitly approved for RENATE cards.
// Other source art stays in the local archive and is not presented as a photo.
const approvedCardImages = {
  'wsps.event.p1': { path: './cards/photos/ADANA_WSPS_P1_AIR_PISTOL_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de atleta P1 SH1 em cadeira de rodas, com pistola de ar em posição de tiro.' },
  'wsps.event.p2': { path: './cards/adana-assets/ADANA_WSPS_P2_AIR_PISTOL_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de atleta P2 SH1 em cadeira de rodas, com pistola de ar em posição de tiro.' },
  'wsps.event.p3': { path: './cards/photos/ADANA_WSPS_P4_PARALYMPIC_RANGE_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração de tiro com pistola em pé, reaproveitada por mostrar posição comum às provas de pistola; não representa detalhes específicos do equipamento P3.', note: 'Imagem de posição compartilhada entre provas de pistola; consulte os fatos específicos P3 e as regras vinculadas.' },
  'wsps.event.p4': { path: './cards/photos/ADANA_WSPS_P4_PARALYMPIC_RANGE_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração fotorrealista de prova de pistola paralímpica em estande.' },
  'wsps.event.p5': { path: './cards/photos/ADANA_WSPS_P1_AIR_PISTOL_ILLUSTRATION.png', kind: 'photorealistic_illustration', alt: 'Ilustração da posição de pistola de ar SH1, compartilhada entre provas de pistola; o card P5 não possui fase final.', note: 'Imagem da posição de pistola compartilhada. A prova P5 não possui fase final.' },
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
  return { ...row, source_references: sourceReferences };
});

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
  writeJson('cards.json', { schema: 'RENATE_STANDARDIZED_CARDS_V2', layout: 'RENATE_P6_SOURCE_FACTS_V1', skinReference: 'wsps.event.p6', cards: runtimeCardRecords });
  writeJson('imported-cards-catalog.json', { schema: 'RENATE_IMPORTED_ADANA_CARDS_CATALOG_V1', sourceSnapshot: adanaCardSnapshotPath, sourceSnapshotSha256: sha256(localPath(adanaCardSnapshotPath)), assetPolicy: adanaCardSnapshot.asset_policy, cards: importedCardCatalog, assets: importedCardAssets });
  writeJson('figures.json', { schema: 'RENATE_RULE_PAGE_CROPS_V1', figures: packedFigureCrops });
  const inputPaths = [atlasPath, bindingPath, pretestPath, cardPath, 'library/manifest.csv', 'data/imports/user_provided_card_images_2026-11-06/IMAGE_PROVENANCE.json'];
  const sourceHashes = Object.fromEntries(inputPaths.map((file) => [file, sha256(path.join(root, file))]));
  const manifest = {
    schema: 'RENATE_VERSIONED_LOCAL_PACKAGE_V1',
    version: packageInfo.version,
    generatedAt: new Date().toISOString(),
    source: 'RENATE local snapshots only',
    noBackend: true,
    counts: { atlasQna: atlas.length, pretestPassResponses: eligiblePretests.length, documents: packedDocs.length, pdfs: packedDocs.length, ocrFiles: packedDocs.reduce((sum, doc) => sum + doc.ocrs.length, 0), ruleChunks: ruleChunks.length, standardizedCards: runtimeCardRecords.length, importedPhaseCards: importedCardCatalog.filter((card) => card.phase).length, importedEquipmentCards: importedCardCatalog.filter((card) => card.category === 'equipment').length, importedCardAssets: importedCardAssets.length, existingRenateEligibleCards: cardRecords.length, explicitlyApprovedImportedCards: p6RuntimeCards.length, importedCardsWithoutRecordedReviewPresentedAsVisuals: importedRuntimeCards.length, archivedLegacyCards: cardRecords.length + importedOriginalCardArchives.length, figureCrops: packedFigureCrops.length },
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
