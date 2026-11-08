import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const importRoot = path.join(root, 'data/imports/adana_cards_2026-11-06');
const snapshotPath = path.join(importRoot, 'adana_competition_cards_v1.snapshot.json');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const assetRefs = new Map();
const missingDefinitions = [];
const addAsset = (file, expectedHash, usedBy, kind) => {
  if (!file) return;
  if (!expectedHash) throw new Error(`Hash ausente para asset ${file} (${usedBy})`);
  const entry = assetRefs.get(file) ?? { file, expectedSha256: expectedHash.toLowerCase(), usedBy: [], kinds: [] };
  if (entry.expectedSha256 !== expectedHash.toLowerCase()) throw new Error(`Hashes esperados conflitantes para ${file}`);
  entry.usedBy.push(usedBy);
  entry.kinds.push(kind);
  assetRefs.set(file, entry);
};

for (const event of snapshot.events ?? []) {
  addAsset(event.image, event.asset_sha256, event.event_id, 'event-image');
  for (const [phase, card] of Object.entries(event.phase_cards ?? {})) {
    if (!card.image) {
      missingDefinitions.push({ cardId: `${event.event_id}:${phase}`, eventId: event.event_id, phase, status: 'MISSING_ASSET_DEFINITION' });
      continue;
    }
    addAsset(card.image, card.asset_sha256, `${event.event_id}:${phase}`, 'phase-card');
    if (card.background_image) addAsset(card.background_image, card.background_image_sha256, `${event.event_id}:${phase}`, 'card-background');
  }
}
for (const card of snapshot.equipment_cards ?? []) addAsset(card.image, card.asset_sha256, card.id, 'equipment-card');

const assets = [...assetRefs.values()].map((item) => {
  const filePath = path.join(importRoot, 'assets', item.file);
  if (!fs.existsSync(filePath)) return { ...item, state: 'MISSING_COPY' };
  const actualSha256 = hash(filePath);
  return { ...item, actualSha256, bytes: fs.statSync(filePath).size, state: actualSha256 === item.expectedSha256 ? 'HASH_VERIFIED' : 'HASH_MISMATCH' };
});
const phaseCards = (snapshot.events ?? []).flatMap((event) => Object.entries(event.phase_cards ?? {}).map(([phase, card]) => ({
  cardId: `${event.event_id}:${phase}`,
  eventId: event.event_id,
  authority: event.authority,
  event: event.event,
  phase,
  asset: card.image ?? null,
  sourceReviewState: card.draft_review_state ?? 'NOT_RECORDED_IN_SOURCE_CATALOG',
  sourceReferences: card.source_refs?.length ?? 0,
  structuredSlots: Object.keys(card.slot_values ?? {}).length,
  assetState: card.image ? assets.find((entry) => entry.file === card.image)?.state ?? 'MISSING_COPY' : 'MISSING_ASSET_DEFINITION',
})).map((card) => ({
  ...card,
  runtimeStatus: card.assetState !== 'HASH_VERIFIED'
    ? 'NOT_READY_ASSET_INTEGRITY'
    : card.sourceReviewState === 'APPROVED_BY_HUMAN'
      ? 'READY_HUMAN_APPROVED'
      : 'IMPORTED_REVIEW_STATUS_NOT_RECORDED',
})));
const p6ApprovalPath = path.join(importRoot, 'governance/p6_cards_human_review_20261105.json');
const p6Approval = JSON.parse(fs.readFileSync(p6ApprovalPath, 'utf8'));
const errors = assets.filter((asset) => asset.state !== 'HASH_VERIFIED');
if (errors.length) throw new Error(`Falha na integridade de ${errors.length} assets do snapshot.`);

const report = {
  schema: 'RENATE_ADANA_CARD_IMPORT_AUDIT_V1',
  generatedAt: new Date().toISOString(),
  sourceSnapshot: 'data/imports/adana_cards_2026-11-06/adana_competition_cards_v1.snapshot.json',
  sourceSchema: snapshot.schema,
  standaloneInRenate: true,
  noRuntimeAdanaPathDependency: true,
  counts: {
    configuredEvents: snapshot.events?.length ?? 0,
    phaseCards: phaseCards.length,
    equipmentCards: snapshot.equipment_cards?.length ?? 0,
    uniqueAssets: assets.length,
    verifiedAssets: assets.filter((asset) => asset.state === 'HASH_VERIFIED').length,
    verifiedBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    explicitlyHumanReviewedPhaseCards: phaseCards.filter((card) => card.sourceReviewState === 'APPROVED_BY_HUMAN').length,
    phaseCardsWithReviewStatusNotRecorded: phaseCards.filter((card) => card.sourceReviewState === 'NOT_RECORDED_IN_SOURCE_CATALOG').length,
    incompleteDefinitions: missingDefinitions.length,
  },
  selectedSkinReference: {
    eventId: p6Approval.route_id,
    approvalState: p6Approval.state,
    qualificationSlots: p6Approval.cards.qualification.slot_count,
    finalSlots: p6Approval.cards.final.slot_count,
    approvalEvidence: 'governance/p6_cards_human_review_20261105.json',
  },
  assets,
  phaseCards,
  missingDefinitions,
};
fs.writeFileSync(path.join(importRoot, 'IMPORT_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ state: 'PASS', ...report.counts, p6: report.selectedSkinReference }, null, 2));
