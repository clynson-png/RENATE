import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const catalog = readJson('public/renate-pack/cards.json');
const cards = [...catalog.cards, ...catalog.eventEvidenceCards, ...catalog.equipmentCards];
const approvalPath = 'docs/beta-offline/CARD_HUMAN_APPROVAL_ALL_2026-11-08.json';
const decisions = fs.existsSync(path.join(root, approvalPath))
  ? readJson(approvalPath).decisions
  : readJson('tests/renate-card-human-review.json').decisions;
const byId = new Map();
for (const decision of decisions) {
  const matches = byId.get(decision.cardId) ?? [];
  matches.push(decision);
  byId.set(decision.cardId, matches);
}
const rows = cards.map((card) => {
  const contentSha256 = crypto.createHash('sha256').update(JSON.stringify(card), 'utf8').digest('hex');
  const priorDecisions = byId.get(card.cardId) ?? [];
  const prior = priorDecisions.find((decision) => decision.contentSha256 === contentSha256) ?? priorDecisions.at(-1);
  const current = prior?.contentSha256 === contentSha256;
  return {
    cardId: card.cardId,
    contentSha256,
    status: current ? prior.decision : prior ? 'STALE_DECISION' : 'NO_DECISION',
    priorDecision: prior?.decision ?? '',
    priorContentSha256: prior?.contentSha256 ?? '',
    reviewedAt: current ? prior.reviewedAt : '',
  };
});
const counts = Object.fromEntries(['APPROVE', 'CHANGES', 'STALE_DECISION', 'NO_DECISION'].map((status) => [status, rows.filter((row) => row.status === status).length]));
const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const csv = ['cardId,contentSha256,status,priorDecision,priorContentSha256,reviewedAt', ...rows.map((row) => Object.values(row).map(csvCell).join(','))].join('\r\n') + '\r\n';
fs.writeFileSync(path.join(root, 'docs/beta-offline/CARD_REVIEW_STATUS_2026-11-08.csv'), csv);
const report = {
  date: '2026-11-08',
  source: `all three card arrays in public/renate-pack/cards.json compared with ${fs.existsSync(path.join(root, approvalPath)) ? approvalPath : 'tests/renate-card-human-review.json'}`,
  catalogGroups: { standardized: catalog.cards.length, eventEvidence: catalog.eventEvidenceCards.length, equipment: catalog.equipmentCards.length },
  hashMethod: 'SHA-256 of UTF-8 JSON.stringify(card), matching the review gallery content hash',
  totalCards: rows.length,
  counts,
  currentChanges: rows.filter((row) => row.status === 'CHANGES').map(({ cardId, contentSha256 }) => ({ cardId, contentSha256 })),
  pendingCurrent: rows.filter((row) => row.status === 'STALE_DECISION' || row.status === 'NO_DECISION').map(({ cardId, contentSha256, status, priorDecision }) => ({ cardId, contentSha256, status, priorDecision })),
};
fs.writeFileSync(path.join(root, 'docs/beta-offline/CARD_REVIEW_STATUS_2026-11-08.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ totalCards: report.totalCards, counts, currentChanges: report.currentChanges, pendingCurrentCount: report.pendingCurrent.length, outputCsv: 'docs/beta-offline/CARD_REVIEW_STATUS_2026-11-08.csv', outputJson: 'docs/beta-offline/CARD_REVIEW_STATUS_2026-11-08.json' }, null, 2));
