import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  original: 'data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl',
  supplement50: 'data/imports/atlas_supplement_2026-11-07/atlas_qa_renate_supplement_2026-11-07.jsonl',
  tie94: 'data/imports/tie_breaking_qa_supplement_2026-11-07.jsonl',
  runtime: 'public/renate-pack/atlas.jsonl',
  originalGolden: 'data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json',
};
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const readText = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = (relative) => JSON.parse(readText(relative));
const readJsonl = (relative) => readText(relative).trim().split(/\r?\n/).map((line) => JSON.parse(line));
const original = readJsonl(files.original);
const supplement50 = readJsonl(files.supplement50);
const tie94 = readJsonl(files.tie94);
const runtime = readJsonl(files.runtime);
const originalManifest = readJson(files.originalGolden);
const knownSnapshotHash = originalManifest.source_snapshot_sha256;

if (original.length !== 960 || originalManifest.cases.length !== 960) throw new Error(`Snapshot/oracle original inesperado: ${original.length}/${originalManifest.cases.length}.`);
if (supplement50.length !== 50) throw new Error(`Complemento de cobertura inesperado: ${supplement50.length}.`);
if (tie94.length !== 94) throw new Error(`Complemento posterior inesperado: ${tie94.length}.`);
if (runtime.length !== 1104) throw new Error(`Pacote runtime inesperado: ${runtime.length}.`);
const allRows = [...original, ...supplement50, ...tie94];
if (new Set(allRows.map((row) => row.atlas_id)).size !== 1104) throw new Error('IDs Q&A duplicados entre os três grupos de origem.');
if (runtime.some((row, index) => row.atlas_id !== allRows[index]?.atlas_id)) throw new Error('A ordem ou os IDs protegidos no pacote diferem da concatenação das fontes; nenhum manifesto foi escrito.');

const supplementCases = (rows, group) => rows.map((row) => {
  if (!row.atlas_id || !row.question?.trim() || !row.answer?.trim()) throw new Error(`${group}: registro incompleto.`);
  return {
    case_id: `RENATE-QA-${group}:${row.atlas_id}`,
    atlas_id: row.atlas_id,
    question_sha256: sha256(row.question),
    expected_answer_sha256: sha256(row.answer),
    expected_resolution: 'MATCH_ATLAS_RECORD',
    duplicate_group: null,
    candidate_atlas_ids: [],
    expected_route_ids: row.route_ids ?? [],
    expected_source_ids: [...new Set(row.source_ids ?? [])],
    expected_rule_locators: [...new Set(row.rule_locators ?? [])],
    source_group: group,
    source_status: row.human_approval_status ?? row.source ?? 'UNSPECIFIED',
    expected_document_source_ids: [...new Set((row.source_references ?? []).map((reference) => reference.document_source_id).filter(Boolean))],
  };
});
const cases50 = supplementCases(supplement50, 'SUPPLEMENT_50');
const cases94 = supplementCases(tie94, 'TIE_BREAK_SUPPLEMENT_94');
const combinedCases = [...originalManifest.cases.map((testCase) => ({ ...testCase, source_group: 'ORIGINAL_960' })), ...cases50, ...cases94];
const outDir = path.join(root, 'tests', 'golden');
fs.mkdirSync(outDir, { recursive: true });
const common = {
  schema_version: 'renate.atlas-regression-reference.v1',
  purpose: 'test_only_reference_manifest_ids_and_hashes_no_runtime_content',
  created_on: '2026-11-08',
  evaluation_note: 'Mechanical retrieval/presentation regression only. Does not constitute new human approval of imported answers or source locator semantics.',
  source_hashes: {
    original_snapshot_sha256: sha256(readText(files.original)),
    original_golden_sha256: sha256(readText(files.originalGolden)),
    supplement50_sha256: sha256(readText(files.supplement50)),
    tie_break_supplement94_sha256: sha256(readText(files.tie94)),
    runtime_pack_sha256: sha256(readText(files.runtime)),
  },
  protected_data_check: 'PASS_IDS_AND_ORDER_MATCH_SOURCE_CONCATENATION',
};
for (const [name, groupCases] of [['supplement_50', cases50], ['tie_break_supplement_94', cases94], ['combined_1104', combinedCases]]) {
  const manifest = { ...common, suite: name, case_count: groupCases.length, source_snapshot_sha256: knownSnapshotHash, cases: groupCases };
  fs.writeFileSync(path.join(outDir, `${name}_2026-11-08.json`), `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(JSON.stringify({ state: 'PASS_MANIFESTS_GENERATED', counts: { original: original.length, supplement50: cases50.length, tieBreakSupplement94: cases94.length, combined: combinedCases.length }, originalSnapshotSha256: sha256(readText(files.original)), supplement50Sha256: sha256(readText(files.supplement50)), tieBreakSupplement94Sha256: sha256(readText(files.tie94)), runtimePackSha256: sha256(readText(files.runtime)), protectedIdOrder: 'PASS' }, null, 2));
