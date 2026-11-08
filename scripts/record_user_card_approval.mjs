import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const catalog = readJson('public/renate-pack/cards.json');
const prior = readJson('tests/renate-card-human-review.json');
const groups = [
  ['standardized', catalog.cards],
  ['eventEvidence', catalog.eventEvidenceCards],
  ['equipment', catalog.equipmentCards],
];
const cards = groups.flatMap(([catalogGroup, records]) => records.map((card, catalogIndex) => ({ card, catalogGroup, catalogIndex })));
const priorById = new Map(prior.decisions.map((decision) => [decision.cardId, decision]));
const recordedAt = new Date().toISOString();
const decisions = cards.map(({ card, catalogGroup, catalogIndex }) => ({
  cardId: card.cardId,
  catalogGroup,
  catalogIndex,
  decision: 'APPROVE',
  contentSha256: crypto.createHash('sha256').update(JSON.stringify(card), 'utf8').digest('hex'),
  decisionSource: 'USER_EXPLICIT_BLANKET_APPROVAL_2026-11-08',
  approvedAt: recordedAt,
  supersedesDecision: priorById.get(card.cardId)?.decision ?? 'NO_PRIOR_DECISION',
  supersedesContentSha256: priorById.get(card.cardId)?.contentSha256 ?? null,
}));
const approval = {
  schema: 'RENATE_CARD_HUMAN_APPROVAL_V1',
  recordedAt,
  userDecision: 'todos os cards aprovados',
  scope: 'All card records present in the current local package, each bound to its current content SHA-256.',
  hashMethod: 'SHA-256 of UTF-8 JSON.stringify(card), matching the human review gallery content hash.',
  cardCount: decisions.length,
  uniqueCardIdCount: new Set(decisions.map((decision) => decision.cardId)).size,
  duplicateCardIdCount: decisions.length - new Set(decisions.map((decision) => decision.cardId)).size,
  decision: 'APPROVE',
  decisions,
};
const output = 'docs/beta-offline/CARD_HUMAN_APPROVAL_ALL_2026-11-08.json';
fs.writeFileSync(path.join(root, output), `${JSON.stringify(approval, null, 2)}\n`);
console.log(JSON.stringify({ state: 'RECORDED', cardCount: decisions.length, approved: decisions.filter((decision) => decision.decision === 'APPROVE').length, uniqueIds: new Set(decisions.map((decision) => decision.cardId)).size, output }, null, 2));
