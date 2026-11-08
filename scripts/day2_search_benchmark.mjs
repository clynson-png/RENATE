import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import MiniSearch from 'minisearch';
import { Index as FlexIndex } from 'flexsearch';

const require = createRequire(import.meta.url);
const root = process.cwd();
const input = path.join(root, 'data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl');
const output = path.join(root, 'docs/beta-offline/SEARCH_BENCHMARK_10_2026-11-06.json');
const raw = fs.readFileSync(input);
const records = raw.toString('utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
const seed = 20261106;

function rngFor(seedValue) {
  let state = seedValue >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function docFor(r) {
  return {
    id: r.atlas_id,
    question: r.question ?? '',
    aliases: (r.aliases ?? []).join(' '),
    question_id: r.question_id ?? '',
    atomic_id: r.atomic_id ?? '',
    route_ids: (r.route_ids ?? []).join(' '),
    discipline_routes: (r.discipline_routes ?? []).join(' '),
    answer: r.answer ?? '',
    answer_key_hint: r.answer_key_hint ?? '',
  };
}

function pickSample() {
  const random = rngFor(seed);
  const eligible = records.filter((r) => (r.route_ids ?? []).length > 0);
  const routes = [...new Set(eligible.flatMap((r) => r.route_ids))];
  const pickedRoutes = shuffled(routes, random).slice(0, 10);
  if (pickedRoutes.length !== 10) throw new Error(`Expected 10 distinct routes, found ${pickedRoutes.length}`);
  const pickedIds = new Set();
  return pickedRoutes.map((route) => {
    const choices = shuffled(eligible.filter((r) => r.route_ids.includes(route) && !pickedIds.has(r.atlas_id)), random);
    if (!choices.length) throw new Error(`No distinct question available for route ${route}`);
    pickedIds.add(choices[0].atlas_id);
    return { ...choices[0], benchmark_route_id: route };
  });
}

const sample = pickSample();
const docs = records.map(docFor);
const sampleQueries = sample.map((r) => ({
  atlas_id: r.atlas_id,
  route_id: r.benchmark_route_id,
  question: r.question,
  question_id: r.question_id,
  atomic_id: r.atomic_id,
  alias: (r.aliases ?? [])[0] ?? null,
}));

const duplicateGroups = new Map();
for (const r of records) {
  const key = normalize(r.question);
  if (!key) continue;
  const group = duplicateGroups.get(key) ?? [];
  group.push(r);
  duplicateGroups.set(key, group);
}
const conflictingGroups = [...duplicateGroups.entries()]
  .map(([key, rows]) => ({ key, rows, answers: new Set(rows.map((r) => r.answer)) }))
  .filter((g) => g.rows.length > 1 && g.answers.size > 1);

function summarize(searchFn, repetitions = 30) {
  const exact = [];
  const codes = [];
  const normalized = [];
  const aliases = [];
  const allLatencies = [];
  for (const q of sampleQueries) {
    const cases = [
      ['exact', q.question, q.atlas_id],
      ['normalized', normalize(q.question), q.atlas_id],
      ['code', q.question_id, q.atlas_id],
      ...(q.alias ? [['alias', q.alias, q.atlas_id]] : []),
    ];
    for (const [kind, query, expected] of cases) {
      const times = [];
      let results = [];
      for (let n = 0; n < repetitions; n += 1) {
        const start = performance.now();
        results = searchFn(query);
        times.push(performance.now() - start);
      }
      const duration = times.reduce((a, b) => a + b, 0) / times.length;
      allLatencies.push(duration);
      const hit = results.findIndex((r) => r.id === expected);
      const record = { expected_found: hit >= 0, reciprocal_rank: hit >= 0 ? 1 / (hit + 1) : 0, top1: hit === 0, result_count: results.length, mean_latency_ms: Number(duration.toFixed(3)) };
      if (kind === 'exact') exact.push(record);
      else if (kind === 'code') codes.push(record);
      else if (kind === 'normalized') normalized.push(record);
      else aliases.push(record);
    }
  }

  const ambiguity = conflictingGroups.map((g) => {
    const q = g.rows[0].question;
    const expected = new Set(g.rows.map((r) => r.atlas_id));
    const found = new Set(searchFn(q).map((r) => r.id));
    return { ids_expected: expected.size, ids_retrieved: [...expected].filter((id) => found.has(id)).length, conflicting_answers: g.answers.size };
  });

  const metrics = (items) => ({
    cases: items.length,
    coverage: items.length ? Number((items.filter((x) => x.expected_found).length / items.length).toFixed(3)) : null,
    top1_accuracy: items.length ? Number((items.filter((x) => x.top1).length / items.length).toFixed(3)) : null,
    mean_reciprocal_rank: items.length ? Number((items.reduce((s, x) => s + x.reciprocal_rank, 0) / items.length).toFixed(3)) : null,
  });
  const sorted = [...allLatencies].sort((a, b) => a - b);
  const percentile = (p) => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)].toFixed(3)) : null;
  return {
    queries: { exact_question: metrics(exact), normalized_question: metrics(normalized), exact_code: metrics(codes), aliases: metrics(aliases), ambiguity: { conflicting_groups_tested: ambiguity.length, full_group_retrieval: ambiguity.filter((g) => g.ids_retrieved === g.ids_expected).length, requires_post_search_clarification: ambiguity.some((g) => g.conflicting_answers > 1) } },
    latency_ms: { median: percentile(0.5), p95: percentile(0.95), runs_per_query: repetitions },
  };
}

function indexFootprint(pkg) {
  const entry = require.resolve(pkg);
  const bytes = fs.readFileSync(entry);
  return { entry: path.relative(root, entry).replaceAll('\\', '/'), raw_bytes: bytes.byteLength, gzip_bytes: gzipSync(bytes).byteLength };
}

const engineResults = [];
for (const [name, build, search] of [
  ['MiniSearch 7.2', () => {
    const index = new MiniSearch({
      fields: ['question', 'aliases', 'question_id', 'atomic_id', 'route_ids', 'discipline_routes', 'answer', 'answer_key_hint'],
      storeFields: ['id'],
      searchOptions: { boost: { question: 8, question_id: 20, atomic_id: 18, aliases: 6, route_ids: 5, discipline_routes: 4, answer: 1.2, answer_key_hint: 1 }, prefix: true, fuzzy: 0.15 },
    });
    index.addAll(docs);
    return index;
  }, (index, query) => index.search(query).map((r) => ({ id: r.id, score: r.score }))],
  ['FlexSearch 0.8', () => {
    const index = new FlexIndex({ tokenize: 'forward', resolution: 9, minlength: 2, cache: 100 });
    for (const d of docs) index.add(d.id, [d.question, d.aliases, d.question_id, d.atomic_id, d.route_ids, d.discipline_routes, d.answer, d.answer_key_hint].join(' '));
    return index;
  }, (index, query) => index.search(query, { limit: 50 }).map((id, i) => ({ id, score: 1 - i / 100 }))],
]) {
  global.gc?.();
  const beforeMemory = process.memoryUsage().rss;
  const start = performance.now();
  const index = build();
  const indexMs = performance.now() - start;
  global.gc?.();
  const afterMemory = process.memoryUsage().rss;
  engineResults.push({
    name,
    searchable_documents: docs.length,
    index_build_ms: Number(indexMs.toFixed(2)),
    rss_delta_bytes: Math.max(0, afterMemory - beforeMemory),
    package_entry_footprint: indexFootprint(name.startsWith('Mini') ? 'minisearch' : 'flexsearch'),
    ...summarize((query) => search(index, query)),
  });
}

const outputObject = {
  report_schema: 'renate.day2.search-benchmark.v1',
  created_on: '2026-11-06',
  scope: '10 seeded random ATLAS questions associated with 10 distinct routes; local Node benchmark, not browser/device runtime proof',
  seed,
  source_path: 'data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl',
  source_sha256: createHash('sha256').update(raw).digest('hex'),
  corpus_count: records.length,
  sample: sampleQueries.map(({ atlas_id, route_id, question_id, atomic_id, alias }) => ({ atlas_id, route_id, question_id, atomic_id, alias })),
  meilisearch: { status: 'NOT_COMPATIBLE_WITH_FRONTEND_ONLY_RUNTIME', engine_search_results: null, reason: 'No browser-embeddable engine artifact was available in RENATE; its JavaScript SDK is a remote HTTP client and no server/service may be part of RENATE runtime.' },
  engines: engineResults,
  limits: ['Index/search/memory measurements are Node.js process measurements, not browser or mobile device measurements.', 'The 10-question sample evaluates exact retrieval of the ATLAS row; it does not score the normative correctness of its answer.', 'Alias coverage is reported only for aliases attached to sampled records.', 'All three known conflicting duplicate groups are checked separately for candidate retrieval; application-level clarification remains required.'],
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(outputObject, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, output), corpus_count: records.length, sample_count: sampleQueries.length, sample_routes: sampleQueries.map((q) => q.route_id), engines: engineResults.map((e) => ({ name: e.name, exact: e.queries.exact_question, code: e.queries.exact_code, aliases: e.queries.aliases, latency_ms: e.latency_ms, rss_delta_bytes: e.rss_delta_bytes, package_entry_footprint: e.package_entry_footprint })) }, null, 2));
