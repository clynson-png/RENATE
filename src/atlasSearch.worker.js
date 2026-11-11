import { Index } from 'flexsearch';

const normalize = (value) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const normalizeEventAlias = (value) => normalize(value).replace(/\s+(m|mm)\b/g, '$1');
const STOP_WORDS = new Set('a as o os um uma uns umas de da do das dos em no na nos nas por para com qual quais que como quanto quantos quantas e ou ao aos à às'.split(' '));
const terms = (value) => [...new Set(normalize(value).split(' ').filter((term) => term.length > 1 && !STOP_WORDS.has(term)))];
const SEARCH_EXPANSIONS = new Map([
  ['desempate', ['empate', 'empates', 'tie break', 'tie breaking', 'countback', 'shoot off']],
  ['empate', ['desempate', 'empates', 'tie break', 'tie breaking', 'countback', 'shoot off']],
  ['empates', ['desempate', 'empate', 'tie break', 'countback', 'shoot off']],
  ['ties', ['desempate', 'empate', 'tie break', 'countback', 'shoot off']],
  ['tied', ['desempate', 'empate', 'tie break', 'countback', 'shoot off']],
  ['tie', ['desempate', 'empate', 'ties', 'countback', 'shoot off']],
  ['break', ['desempate', 'empate', 'tie break', 'shoot off']],
  ['shoot', ['shoot off', 'desempate', 'empate']],
  ['countback', ['desempate', 'empate', 'tie break']],
  ['pistola', ['pistol']],
  ['pistol', ['pistola']],
  ['carabina', ['rifle']],
  ['rifle', ['carabina']],
  ['fossa', ['trap']],
  ['trap', ['fossa']],
  ['tiro rapido', ['rapid fire', 'rapid fire pistol']],
  ['rapid fire', ['tiro rapido', 'pistola']],
  ['de ar', ['air']],
  ['air', ['de ar']],
]);
const ISSF_EVENT_ALIASES = {
  'issf.event.01': ['carabina de ar 10m', 'carabina de ar 10 m', 'carabina 10m', 'carabina 10 m'],
  'issf.event.02': ['carabina 50m tres posicoes', 'carabina 50 m tres posicoes', 'carabina tres posicoes 50m'],
  'issf.event.03': ['carabina 50m deitado', 'carabina 50 m deitado', 'carabina prone 50m'],
  'issf.event.04': ['carabina 300m tres posicoes', 'carabina 300 m tres posicoes'],
  'issf.event.05': ['carabina 300m deitado', 'carabina 300 m deitado'],
  'issf.event.06': ['carabina standard 300m', 'carabina standard 300 m'],
  'issf.event.07': ['pistola 10m', 'pistola 10 m', 'pistola de ar 10m', 'pistola de ar 10 m', 'pistola ar comprimido 10m'],
  'issf.event.08': ['pistola 25m', 'pistola 25 m'],
  'issf.event.09': ['rfp', 'rfpm', 'rapid fire pistol', '25m rapid fire pistol', 'pistola tiro rapido 25m', 'pistola tiro rapido 25 m', 'pistola de tiro rapido 25m', 'pistola de tiro rapido 25 m', 'tiro rapido 25m', 'tiro rapido 25 m', 'tiro rapido 25m issf', 'issf tiro rapido 25m'],
  'issf.event.10': ['pistola center fire 25m', 'pistola centerfire 25m', 'pistola fogo central 25m'],
  'issf.event.11': ['pistola standard 25m', 'pistola standard 25 m', 'pistola standard issf', 'standard pistol issf', 'issf standard pistol', 'issf pistola standard', 'standard pistol 25m issf', 'standard pistol 25 m issf'],
  'issf.event.12': ['pistola 50m', 'pistola 50 m', 'pistola livre 50m', '50m pistol issf', 'issf 50m pistol', 'pistola 50m issf', 'issf pistola 50m'],
  'issf.event.13': ['fossa olimpica', 'fossa olimpica issf', 'trap olimpico', 'trap issf', 'issf trap', 'issf olympic trap', 'olympic trap issf'],
  'issf.event.14': ['skeet olimpico', 'skeet issf'],
  'issf.event.15': ['alvo movel 10m', 'alvo movel 10 m'],
  'issf.event.16': ['alvo movel misto 10m', 'alvo movel misto 10 m'],
  'issf.event.17': ['alvo movel 50m', 'alvo movel 50 m'],
  'issf.event.18': ['alvo movel misto 50m', 'alvo movel misto 50 m'],
  'issf.event.19': ['sprint de alvos', 'target sprint'],
};
const ISSF_MALFUNCTION_CARD_ALIASES = {
  'issf.event.11': ['pistola standard', 'standard pistol'],
  'issf.event.09': ['pistola de tiro rapido', 'pistola tiro rapido', 'tiro rapido 25m', 'tiro rapido 25 m', 'rapid fire pistol', '25m rapid fire pistol', 'rfp', 'rfpm'],
  'issf.event.10': ['fogo central', 'centre fire pistol', 'center fire pistol', 'centre-fire pistol', 'center-fire pistol', 'centre fire', 'center fire', 'centerfire'],
  'issf.event.08': ['pistola 25 metros', '25 metros pistola', 'pistola 25m', 'pistola 25 m', '25m pistol'],
};
const CBTE_EVENT_ALIASES = {
  'cbte.cmp.rimfire_sporter': [
    'carabina cmp fogo circular sporter', 'carabina cmp sporter', 'cmp rimfire sporter',
    'rimfire sporter', 'cmp carabina tatica rimfire', 'carabina tatica rimfire cmp',
  ],
  'cbte.fclass.rimfire': [
    'carabina f class rimfire', 'f class rimfire', 'fclass rimfire', 'f class rimfire cbte',
  ],
};
const packUrl = (name) => new URL(`/renate-pack/${name}`, self.location.origin).href;

let rows = [];
let pretestRows = [];
let rules = [];
let cards = [];
let eventEvidenceCards = [];
let equipmentCards = [];
let documents = [];
let figures = [];
let rulesByDocument = new Map();
let ruleLocatorIndex = new Map();
let ruleLocatorIndexByDocument = new Map();
let atlasIndex;
let pretestIndex;
let rulesIndex;
let exact = new Map();
let aliases = new Map();
let ids = new Map();
let pretestExact = new Map();
let sourceToDocument = new Map();
let rowsByRoute = new Map();

function add(map, key, value) {
  if (!key) return;
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

async function fetchLocalJson(url) {
  const target = new URL(url);
  if (target.origin !== self.location.origin) throw new Error('O pacote RENATE tentou consultar uma origem externa.');
  const response = await fetch(target.href);
  if (!response.ok) throw new Error(`Falha ao abrir pacote local (${response.status}): ${target.pathname}`);
  return response.json();
}

async function fetchLocalJsonl(url) {
  const target = new URL(url);
  if (target.origin !== self.location.origin) throw new Error('O pacote RENATE tentou consultar uma origem externa.');
  const response = await fetch(target.href);
  if (!response.ok) throw new Error(`Falha ao abrir snapshot ATLAS (${response.status}).`);
  const body = await response.text();
  return body.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function qnaCandidates(query, selectedId) {
  if (selectedId) return rows.filter((row) => row.atlas_id === selectedId);
  const key = normalize(query);
  if (!key) return [];
  const allowTieBreakRows = tieBreakIntent(query);
  const keepForIntent = (row) => (allowTieBreakRows || !isTieBreakQuestion(row.question))
    && qnaRowMatchesRequestedAuthority(row, query)
    && qnaRowMatchesRequestedIssfRoute(row, query);
  const exactRows = exact.get(key) ?? ids.get(key) ?? aliases.get(key);
  if (exactRows) {
    const intentRows = exact.get(key) ?? exactRows;
    const authorityRows = intentRows.filter((row) => qnaRowMatchesRequestedAuthority(row, query));
    const hasExplicitAuthority = normalize(query).split(' ').some((word) => ['issf', 'wsps', 'cbte'].includes(word));
    if (authorityRows.length) return authorityRows;
    if (hasExplicitAuthority) return (aliases.get(key) ?? []).filter((row) => qnaRowMatchesRequestedAuthority(row, query));
    const compatibleRows = intentRows.filter((row) => qnaRowMatchesRequestedIssfRoute(row, query));
    // An exact question is stronger evidence than inherited route metadata.
    // Keep it when legacy route fan-out is incomplete, while still honoring an
    // explicit authority in the user's wording.
    return compatibleRows;
  }
  const expanded = expandSearchQuery(query);
  const idsFound = new Set(atlasIndex.search(query, { limit: 50 }));
  if (expanded !== query) for (const id of atlasIndex.search(expanded, { limit: 50 })) idsFound.add(id);
  const concepts = queryConcepts(query);
  if (!concepts.length) return [];
  const resolvedRoutes = resolveNamedEventRoutes(query);
  return [...idsFound].map((id) => rows.find((row) => row.atlas_id === id)).filter(Boolean).map((row) => {
    const rowTerms = new Set(terms(`${row.question} ${(row.aliases ?? []).join(' ')}`));
    const matched = concepts.filter((concept) => [...concept].some((term) => rowTerms.has(term)));
    const routeMatch = (row.route_ids ?? []).some((routeId) => resolvedRoutes.includes(routeId));
    return { row, coverage: matched.length / concepts.length, matched: matched.length, routeMatch };
  }).filter((candidate) => keepForIntent(candidate.row)
    && candidate.coverage >= (candidate.routeMatch ? 0.5 : 0.6)
    && candidate.matched >= Math.min(2, concepts.length))
    .sort((a, b) => Number(b.routeMatch) - Number(a.routeMatch) || b.coverage - a.coverage || a.row.atlas_id.localeCompare(b.row.atlas_id))
    .map(({ row }) => row);
}

function qnaRowMatchesRequestedIssfRoute(row, query) {
  const normalized = normalize(query);
  if (/\b(wsps|cbte)\b/.test(normalized)) return true;
  const issfRoutes = resolveNamedEventRoutes(query).filter((routeId) => routeId.startsWith('issf.event.'));
  return issfRoutes.length !== 1 || (row.route_ids ?? []).includes(issfRoutes[0]);
}

function qnaRowMatchesRequestedAuthority(row, query) {
  const words = normalize(query).split(' ');
  if (words.includes('cbte') || words.includes('wsps')) return true;
  // The affected regression is explicit ISSF wording leaking into CBTE trap
  // suggestions. Preserve existing WSPS/CBTE route handling.
  return !words.includes('issf') || normalize(row.authority) === 'issf';
}

function expandSearchQuery(query) {
  const normalized = normalize(query);
  const expanded = [];
  for (const [needle, additions] of SEARCH_EXPANSIONS) {
    if (normalized.includes(needle)) expanded.push(...additions);
  }
  return [...new Set([query, ...expanded])].join(' ');
}

function queryConcepts(query) {
  return terms(query).filter((term) => !GENERIC_EVENT_TERMS.has(term)).map((term) => {
    const related = [...SEARCH_EXPANSIONS].filter(([needle]) => terms(needle).includes(term)).flatMap(([, additions]) => additions);
    return new Set([term, ...related.flatMap((value) => terms(value))]);
  });
}

function answerFromQna(query, selectedId) {
  const candidates = qnaCandidates(query, selectedId);
  if (!candidates.length) return { status: 'NOT_FOUND', candidates: [] };
  const distinctAnswers = new Set(candidates.map((row) => row.answer));
  if (distinctAnswers.size > 1) {
    const sameQuestionDifferentEvidence = new Set(candidates.map((row) => normalize(row.question))).size === 1;
    const optionRows = sameQuestionDifferentEvidence ? candidates : candidates.slice(0, 3);
    const questionOptions = optionRows.map((row) => ({
      text: row.question,
      atlasId: row.atlas_id,
      routeIds: row.route_ids ?? [],
      sourceIds: row.source_ids ?? [],
      sourceLabels: [...new Set((row.source_references ?? []).map((reference) => [reference.title, reference.edition].filter(Boolean).join(' · ')).filter(Boolean))],
    }));
    return {
      status: 'CLARIFICATION_REQUIRED',
      candidates: optionRows.map((row) => ({ atlasId: row.atlas_id, question: row.question, routeIds: row.route_ids ?? [], sourceIds: row.source_ids ?? [], sourceReferences: row.source_references ?? [] })),
      questionOptions: questionOptions.length > 1 ? questionOptions : [],
      clarificationReason: sameQuestionDifferentEvidence ? 'SAME_QUESTION_DIFFERENT_EVIDENCE' : 'DIFFERENT_REGISTERED_QUESTIONS',
    };
  }
  const row = [...candidates].sort((a, b) => a.atlas_id.localeCompare(b.atlas_id))[0];
  const equivalentAtlasIds = candidates
    .filter((candidate) => normalize(candidate.question) === normalize(row.question)
      && normalize(candidate.answer) === normalize(row.answer))
    .map((candidate) => candidate.atlas_id).sort();
  return {
    status: 'ANSWERED',
    record: {
      atlasId: row.atlas_id,
      equivalentAtlasIds: equivalentAtlasIds.length > 1 ? equivalentAtlasIds : [],
      question: row.question,
      answer: row.answer,
      routeIds: row.route_ids ?? [],
      sourceIds: row.source_ids ?? [],
      ruleLocators: row.rule_locators ?? [],
      sourceReferences: row.source_references ?? [],
      authority: row.authority,
    },
  };
}

const GENERIC_EVENT_TERMS = new Set('prova provas evento eventos tiro tiros regra regras regulamento competição competicao campeonato cbte issf'.split(' '));
function resolveNamedEventRoutes(query) {
  const normalizedQuery = ` ${normalizeEventAlias(query)} `;
  const queryTerms = terms(query).filter((term) => !GENERIC_EVENT_TERMS.has(term));
  if (!queryTerms.length) return [];
  const events = new Map();
  for (const card of [...eventEvidenceCards.filter((item) => item.category !== 'event_program'), ...cards, ...equipmentCards]
    .filter((item) => item.cardId !== 'WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1')) {
    const eventIds = [...new Set([card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? [])].filter(Boolean))];
    for (const eventId of eventIds) {
      const current = events.get(eventId) ?? { eventId, names: new Set(), aliases: new Set() };
      if (card.event) current.names.add(card.event);
      for (const alias of card.eventAliases ?? []) current.aliases.add(alias);
      events.set(eventId, current);
    }
  }
  const authorityHints = new Set(['issf', 'wsps', 'cbte'].filter((authority) => new RegExp(`\\b${authority}\\b`).test(normalize(query))));
  if (authorityHints.has('cbte') && /\bduelo\b/.test(normalizedQuery)) {
    if (/\b25\s*m\b/.test(normalizedQuery)) return ['cbte.duelo.25m'];
    if (/\b10\s*m\b/.test(normalizedQuery)) return ['cbte.duelo.10m'];
  }
  if (authorityHints.has('issf') && /\btrap\b/.test(normalizedQuery) && /\bskeet\b/.test(normalizedQuery)) {
    return ['issf.event.13', 'issf.event.14'];
  }
  if (!authorityHints.has('wsps') && !authorityHints.has('cbte')) {
    const preferredIssfMatches = Object.entries(ISSF_EVENT_ALIASES).flatMap(([eventId, aliases]) => aliases
      .filter((alias) => normalize(alias).length < 5 || eventId === 'issf.event.09' || eventId === 'issf.event.11')
      .filter((alias) => normalizedQuery.includes(` ${normalize(alias)} `))
      .map((alias) => ({ eventId, aliasLength: normalize(alias).length })));
    preferredIssfMatches.sort((a, b) => b.aliasLength - a.aliasLength || a.eventId.localeCompare(b.eventId));
    if (preferredIssfMatches.length) {
      const longest = preferredIssfMatches[0].aliasLength;
      const best = [...new Set(preferredIssfMatches.filter((match) => match.aliasLength === longest).map((match) => match.eventId))];
      if (best.length === 1) return best;
    }
  }
  const codeMatches = [...events.values()].filter((event) => {
    const authority = event.eventId.startsWith('issf.') ? 'issf' : event.eventId.startsWith('wsps.') ? 'wsps' : 'cbte';
    if (authorityHints.size && !authorityHints.has(authority)) return false;
    const code = event.eventId.split('.').at(-1);
    return event.eventId.startsWith('wsps.event.') && new RegExp(`\\b${code}\\b`).test(normalize(query));
  });
  if (codeMatches.length === 1) return [codeMatches[0].eventId];
  const phraseMatches = [...events.values()].flatMap((event) => {
    const aliases = [
      ...event.names,
      ...event.aliases,
      ...(ISSF_EVENT_ALIASES[event.eventId] ?? []),
      ...(CBTE_EVENT_ALIASES[event.eventId] ?? []),
    ].map(normalizeEventAlias).filter((name) => name.length >= 5);
    const matchedAliases = aliases.filter((alias) => normalizedQuery.includes(` ${alias} `));
    const authority = event.eventId.startsWith('issf.') ? 'issf' : event.eventId.startsWith('wsps.') ? 'wsps' : 'cbte';
    if (authorityHints.size && !authorityHints.has(authority)) return [];
    if (!matchedAliases.length) return [];
    return [{ eventId: event.eventId, aliasLength: Math.max(...matchedAliases.map((alias) => alias.length)), matched: terms(matchedAliases[0]).length, score: 1 }];
  }).sort((a, b) => b.aliasLength - a.aliasLength || b.matched - a.matched || a.eventId.localeCompare(b.eventId));
  if (phraseMatches.length && (!phraseMatches[1] || phraseMatches[0].aliasLength > phraseMatches[1].aliasLength)) return [phraseMatches[0].eventId];
  if (phraseMatches.length > 1) {
    const bestAliasLength = phraseMatches[0].aliasLength;
    const bestMatches = phraseMatches.filter((match) => match.aliasLength === bestAliasLength);
    const sharedPistolSpecification = eventEvidenceCards.find((card) => card.cardId?.startsWith('issf.pistol.specifications.')
      && bestMatches.every((match) => (card.eventIds ?? []).includes(match.eventId)));
    if (sharedPistolSpecification) return bestMatches.map((match) => match.eventId);
  }
  if (authorityHints.size) {
    for (const [eventId, aliases] of Object.entries(ISSF_EVENT_ALIASES)) {
      if (authorityHints.has('issf') && aliases.some((alias) => normalizedQuery.includes(` ${normalize(alias)} `))) return [eventId];
    }
  }
  const ranked = [...events.values()].map((event) => {
    const routeTerms = new Set(terms(`${event.eventId} ${[...event.names, ...event.aliases].join(' ')} ${(ISSF_EVENT_ALIASES[event.eventId] ?? []).join(' ')} ${(CBTE_EVENT_ALIASES[event.eventId] ?? []).join(' ')}`));
    const matched = queryTerms.filter((term) => routeTerms.has(term));
    return { eventId: event.eventId, matched: matched.length, score: matched.length / queryTerms.length };
  }).filter((event) => event.score >= 0.5)
    .sort((a, b) => b.score - a.score || b.matched - a.matched || a.eventId.localeCompare(b.eventId));
  if (!ranked.length) return [];
  if (ranked[1] && ranked[0].score - ranked[1].score < 0.15) return [];
  return [ranked[0].eventId];
}

function topicOptionsFor(query, routeIds) {
  const allowTieBreakRows = tieBreakIntent(query);
  const cardIds = new Set(eventEvidenceCards.filter((card) => routeIds.includes(card.eventId)).flatMap((card) => card.sourceQnaIds ?? []));
  let candidates = rows.filter((row) => cardIds.has(row.atlas_id) && qnaRowMatchesRequestedAuthority(row, query) && row.answer && row.renate_approved_as_evidence === true
    && (allowTieBreakRows || !isTieBreakQuestion(row.question)));
  if (candidates.length < 2) {
    candidates = [...new Map([...candidates, ...routeIds.flatMap((routeId) => rowsByRoute.get(routeId) ?? [])]
      .filter((row) => row.answer && row.renate_approved_as_evidence === true && (row.source_references ?? []).length
        && qnaRowMatchesRequestedAuthority(row, query)
        && (allowTieBreakRows || !isTieBreakQuestion(row.question)))
      .map((row) => [row.atlas_id, row])).values()];
  }
  const queryTerms = terms(expandSearchQuery(query));
  const topicKey = (question) => {
    const normalized = normalize(question);
    if (/disparo|tiro|serie|rodada|prato|alvo/.test(normalized)) return 'format';
    if (/tempo|segundo|preparacao|ensaio|duracao/.test(normalized)) return 'timing';
    if (/arma|espingarda|calibre|municao|equipamento|vestimenta|pontaria/.test(normalized)) return 'equipment';
    if (/final|classificacao|desempate|medalha/.test(normalized)) return 'phase';
    if (/pontuacao|ponto|score/.test(normalized)) return 'scoring';
    return normalized;
  };
  const ranked = candidates.map((row) => ({
    row,
    score: queryTerms.length ? queryTerms.filter((term) => terms(row.question).includes(term)).length / queryTerms.length : 0,
    topic: topicKey(row.question),
  })).sort((a, b) => b.score - a.score || a.row.atlas_id.localeCompare(b.row.atlas_id));
  const selected = [];
  const selectedTopics = new Set();
  for (const item of ranked) {
    if (selectedTopics.has(item.topic)) continue;
    selected.push(item.row);
    selectedTopics.add(item.topic);
    if (selected.length === 3) break;
  }
  for (const item of ranked) {
    if (selected.length === 3) break;
    if (!selected.some((row) => row.atlas_id === item.row.atlas_id)) selected.push(item.row);
  }
  return selected.map((row) => ({
    text: row.question,
    atlasId: row.atlas_id,
    routeIds: row.route_ids ?? [],
    sourceIds: row.source_ids ?? [],
    sourceLabels: [...new Set((row.source_references ?? []).map((reference) => [reference.title, reference.edition].filter(Boolean).join(' · ')).filter(Boolean))],
  }));
}

function globalQuestionOptionsFor(query, preferredRouteIds = []) {
  const expandedTerms = terms(expandSearchQuery(query));
  const preferred = new Set(preferredRouteIds);
  const normalizedQuery = normalize(query);
  const candidates = rows.filter((row) => row.answer && row.renate_approved_as_evidence === true
    && (row.source_references ?? []).length && qnaRowMatchesRequestedAuthority(row, query));
  const ranked = candidates.map((row) => {
    const questionTerms = new Set(terms(row.question));
    const overlap = expandedTerms.length ? expandedTerms.filter((term) => questionTerms.has(term)).length / expandedTerms.length : 0;
    const routeMatch = (row.route_ids ?? []).some((routeId) => preferred.has(routeId));
    const authorityMatch = row.authority && new RegExp(`\\b${normalize(row.authority)}\\b`).test(normalizedQuery) ? 0.35 : 0;
    const exactPhrase = normalize(row.question).includes(normalizedQuery) || normalizedQuery.includes(normalize(row.question)) ? 0.5 : 0;
    return { row, score: overlap + (routeMatch ? 0.75 : 0) + authorityMatch + exactPhrase };
  }).sort((a, b) => b.score - a.score || a.row.atlas_id.localeCompare(b.row.atlas_id));
  const selected = ranked.filter((item) => item.score > 0).slice(0, 3);
  if (!selected.length && ranked.length) selected.push(ranked[0]);
  return selected.map(({ row }) => ({
    text: row.question,
    atlasId: row.atlas_id,
    routeIds: row.route_ids ?? [],
    sourceIds: row.source_ids ?? [],
    sourceLabels: [...new Set((row.source_references ?? []).map((reference) => [reference.title, reference.edition].filter(Boolean).join(' · ')).filter(Boolean))],
  }));
}

function routeEvidenceContext(query, routeIds, options = []) {
  const optionIds = new Set(options.map((option) => option.atlasId));
  const relatedRows = optionIds.size
    ? rows.filter((row) => optionIds.has(row.atlas_id))
    : routeIds.flatMap((routeId) => rowsByRoute.get(routeId) ?? []);
  const sourceReferences = [...new Map(relatedRows.flatMap((row) => row.source_references ?? [])
    .map((reference) => [`${reference.document_source_id}:${(reference.locators ?? []).join('|')}`, reference])).values()];
  return {
    sourceIds: [...new Set(relatedRows.flatMap((row) => row.source_ids ?? []))],
    sourceReferences,
    ruleLocators: [...new Set(relatedRows.flatMap((row) => row.rule_locators ?? []))],
    routeIds,
  };
}

function passageScore(chunk, queryTerms, queryNormalized, preferredLocators) {
  if (!queryTerms.length) return 0;
  const content = normalize(chunk.text);
  const present = queryTerms.filter((term) => content.includes(term));
  const coverage = present.length / queryTerms.length;
  const phrase = queryNormalized.length > 8 && content.includes(queryNormalized) ? 0.7 : 0;
  const locatorBoost = preferredLocators.some((locator) => locator && chunk.locator && chunk.locator.includes(locator)) ? 0.55 : 0;
  return coverage + phrase + locatorBoost;
}

function tieBreakIntent(query) {
  return /\b(desempate|desempates|empate|empates)\b/.test(normalize(query));
}

function isTieBreakQuestion(question) {
  return /\b(desempate|desempates|empate|empates|countback|tie break|tie breaking|shoot off)\b/.test(normalize(question));
}

function isTieBreakPassage(rule) {
  return /\b(desempate|empate|tie[ -]break|countback|shoot[ -]off|tied score)\b/i.test(`${rule.locator ?? ''} ${rule.text ?? ''}`);
}

function isGeneralTieBreakPassage(rule) {
  const locator = normalize(rule.locator);
  const text = normalize(rule.text);
  return /(^| )6 15( |$)|(^| )9 14( |$)/.test(locator)
    || /tie breaking general|general tie break|desempate geral|regras gerais de desempate/.test(`${locator} ${text}`);
}

function findRulePassages(query, { sourceIds = [], routeIds = [], ruleLocators = [], sourceReferences = [], limit = 1 } = {}) {
  const expandedQuery = expandSearchQuery(query);
  const tieIntent = tieBreakIntent(expandedQuery);
  const queryTerms = terms(expandedQuery);
  const queryNormalized = normalize(query);
  const requestedLocators = [...new Set([
    ...ruleLocators,
    ...sourceReferences.flatMap((reference) => reference.locators ?? [reference.locator].filter(Boolean)),
  ])];
  const documentIds = new Set();
  if (sourceReferences.length) {
    for (const reference of sourceReferences) if (reference.document_source_id) documentIds.add(reference.document_source_id);
  } else {
    for (const sourceId of sourceIds) {
      const documentSourceId = sourceToDocument.get(sourceId);
      if (documentSourceId) documentIds.add(documentSourceId);
    }
  }
  const routes = new Set(routeIds);
  if (tieIntent && routes.size && !documentIds.size) {
    for (const rule of rules) {
      const routeBound = (rule.referencedBy ?? []).some((route) => routes.has(route));
      const tieBound = /desempate|empate|tie.break|countback|shoot.off|tied score/i.test(`${rule.locator} ${rule.text}`);
      if (routeBound && tieBound) documentIds.add(rule.documentSourceId);
    }
  }

  let eligible = rules;
  if (documentIds.size) eligible = eligible.filter((rule) => documentIds.has(rule.documentSourceId));
  else if (routes.size) {
    const routed = rules.filter((rule) => (rule.referencedBy ?? []).some((route) => routes.has(route)));
    if (routed.length) eligible = routed;
  }
  let candidateIds = new Set(rulesIndex.search(query, { limit: 180 }));
  if (expandedQuery !== query) for (const id of rulesIndex.search(expandedQuery, { limit: 180 })) candidateIds.add(id);
  let candidates = [...candidateIds].map((id) => rules.find((rule) => rule.id === id)).filter((rule) => rule && eligible.includes(rule));
  if (!tieIntent) {
    eligible = eligible.filter((rule) => !isTieBreakPassage(rule));
    candidates = candidates.filter((rule) => !isTieBreakPassage(rule));
  }
  if (!candidates.length) candidates = eligible;
  if (tieIntent) {
    const relevantTiePassages = candidates.filter((rule) => /desempate|empate|tie.break|countback|shoot.off|tied score/i.test(`${rule.locator} ${rule.text}`));
    candidates = relevantTiePassages.length
      ? relevantTiePassages
      : eligible.filter((rule) => isTieBreakPassage(rule));
  }
  const eligibleSet = new Set(eligible);
  const ranked = candidates.map((rule) => ({ rule, score: passageScore(rule, queryTerms, queryNormalized, requestedLocators) }))
    .sort((a, b) => b.score - a.score || a.rule.documentSourceId.localeCompare(b.rule.documentSourceId) || String(a.rule.locator).localeCompare(String(b.rule.locator)) || a.rule.id.localeCompare(b.rule.id));
  const chosen = [];
  const seen = new Set();
  const normalizeLocator = (value) => normalize(value);
  const cited = [];
  const locatorDepth = (value) => normalizeLocator(value).split(' ').filter((part) => !['section', 'seccion', 'appendix', 'anexo', 'article', 'artigo'].includes(part)).length;
  const locatorReferences = requestedLocators.length
    ? requestedLocators.flatMap((locator) => (documentIds.size ? [...documentIds] : [null])
      .map((documentSourceId) => ({ document_source_id: documentSourceId, locators: [locator] })))
    : sourceReferences;
  for (const reference of locatorReferences) {
    const referenceDocument = reference.document_source_id ?? sourceToDocument.get(reference.source_id);
    const locatorMatches = (reference.locators ?? [reference.locator].filter(Boolean)).map((locator) => {
      const wanted = normalizeLocator(locator);
      if (!wanted) return { locator, matches: [] };
      const indexed = referenceDocument
        ? (ruleLocatorIndexByDocument.get(referenceDocument)?.get(wanted) ?? [])
        : (ruleLocatorIndex.get(wanted) ?? []);
      const matches = (referenceDocument ? indexed : indexed.filter((rule) => eligibleSet.has(rule)))
        .filter((rule) => tieIntent || !isTieBreakPassage(rule));
      return { locator, matches };
    });
    for (const entry of locatorMatches) {
      if (!entry.matches.length) continue;
      const moreSpecificMatch = locatorMatches.some((other) => other !== entry
        && other.matches.length > 0
        && other.matches.length < entry.matches.length
        && other.matches.every((rule) => entry.matches.includes(rule))
        && locatorDepth(other.locator) > locatorDepth(entry.locator));
      if (moreSpecificMatch) continue;
      const exact = entry.matches.filter((rule) => normalizeLocator(rule.locator) === normalizeLocator(entry.locator));
      const candidatesForLocator = exact.length ? exact : entry.matches;
      const best = candidatesForLocator.map((rule) => ({ rule, score: passageScore(rule, queryTerms, queryNormalized, requestedLocators) }))
        .sort((a, b) => b.score - a.score || String(a.rule.locator).localeCompare(String(b.rule.locator)) || a.rule.id.localeCompare(b.rule.id));
      cited.push(...(exact.length ? best.map((item) => item.rule) : best.slice(0, 1).map((item) => item.rule)));
    }
  }
  const citedIds = new Set(cited.map((rule) => rule.id));
  const ordered = [
    ...cited.map((rule) => ({ rule, score: 1 })),
    ...ranked.filter((item) => !citedIds.has(item.rule.id)),
  ];
  const effectiveLimit = Math.max(limit, cited.length);
  const evidenceBounded = documentIds.size > 0;
  for (const item of ordered) {
    const key = `${item.rule.documentSourceId}:${item.rule.locator}:${normalize(item.rule.text).slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const matchingRequestedLocators = requestedLocators.filter((requested) => {
      const wanted = normalizeLocator(requested);
      return wanted && [item.rule.locator, ...(item.rule.locatorAliases ?? [])].some((alias) => normalizeLocator(alias) === wanted);
    });
    chosen.push({
      title: item.rule.title,
      edition: item.rule.edition,
      locator: item.rule.locator || 'Localizador textual não extraído do OCR',
      locatorAliases: [...new Set([
        ...(item.rule.locatorAliases ?? []).filter((alias) => requestedLocators.some((requested) => normalizeLocator(requested) === normalizeLocator(alias))),
        ...matchingRequestedLocators,
      ])],
      text: item.rule.text,
      pdfPath: item.rule.pdfPath,
      pdfSha256: item.rule.pdfSha256,
      ocrPath: item.rule.ocrPath,
      ocrSha256: item.rule.ocrSha256,
      sourceId: item.rule.sourceId,
      documentSourceId: item.rule.documentSourceId,
      relevance: evidenceBounded && item.score >= 0.45 ? 'DIRECT_OR_STRONG' : 'RELATED_NEAREST_AVAILABLE',
      score: Number(item.score.toFixed(4)),
      scope: tieIntent ? isGeneralTieBreakPassage(item.rule) ? 'GENERAL_TIE_BREAK' : 'EVENT_OR_PHASE_TIE_BREAK' : undefined,
    });
    if (chosen.length >= effectiveLimit) break;
  }
  return chosen;
}

function matchPretest(query) {
  const key = normalize(query);
  const exactMatches = pretestExact.get(key) ?? [];
  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1) return null;
  const allowTieBreakRows = tieBreakIntent(query);
  const candidates = pretestIndex.search(query, { limit: 12 }).map((id) => pretestRows.find((entry) => entry.case_id === id))
    .filter((entry) => entry && (allowTieBreakRows || !isTieBreakQuestion(entry.question)));
  const queryTerms = terms(query);
  const ranked = candidates.map((entry) => {
    const answerTerms = new Set(terms(entry.question));
    const coverage = queryTerms.length ? queryTerms.filter((term) => answerTerms.has(term)).length / queryTerms.length : 0;
    return { entry, coverage };
  }).sort((a, b) => b.coverage - a.coverage || a.entry.case_id.localeCompare(b.entry.case_id));
  if (ranked[0]?.coverage >= 0.8 && (!ranked[1] || ranked[0].coverage - ranked[1].coverage >= 0.1)) return ranked[0].entry;
  return null;
}

const EQUIPMENT_MEASUREMENT_TERMS = /\b(dimens(?:ao|oes)|caixa|medidas?|largura|comprimento|espessura|altura|dimensions?|box|measurements?|width|length|thickness|height)\b/;
const EQUIPMENT_REQUEST_TERMS = /\b(equipamentos?|armamento|armas?|firearm|firearms|weapon|weapons|equipment|gear|suportes?|apoios?|support|supports|rests?|benchrest|bench\s+rest|grip|punho|bandoleiras?|sling|casaco|casacos|jaqueta|jaquetas|jacket|jackets|roupas?|vestuario|acessorios?|bandagem|taping|fitas?|sapatos?|cal[cç]ados?|shoes?|footwear|luvas?|gloves?|cal[cç]as?|trousers|pants)\b/;
const WSPS_GENERAL_EQUIPMENT_TERMS = /\b(cadeiras?\s+de\s+rodas?|wheelchairs?|cadeiras?\s+de\s+tiro|shooting\s+chairs?|bancos?\s+baixos?|low\s+stools?|bancos?\s+altos?|high\s+stools?|shooting\s+stools?|mesas?\s+de\s+tiro|shooting\s+tables?|discos?\s+de\s+tiro|disco\s+de\s+joelhos?|kneeling\s+(?:disc|block)|10\s?cm\s+block|bloco\s+de\s+10\s*cm|posicao\s+do\s+bib(?:\s+number)?|bib(?:\s+number)?\s+(?:position|posicao)|bib\s+number|start\s+number|encostos?|backrests?|garfos?|forks?|yokes?|molas?|springs?|rigidez\s+(?:da\s+)?mola|spring\s+(?:stiffness|flexibility)|flexibilidade\s+(?:da\s+)?mola|spring\s+flexibility|score\s+[abc]|subclass\s+[ab]|(?:meaning|significado)\b.{0,24}\bletras?\s+a\s*(?:and|e)?\s*b\s*(?:and|e)?\s*c)\b/;
const EQUIPMENT_CARD_EVENT_ALIASES = {
  'cbte.wrabf.rifle_international': ['wrabf', 'benchrest', 'bench rest', 'rimfire international sporter', 'international sporter rifle'],
  'cbte.duelo.10m': ['duelo 20 segundos 10 m', 'duelo 20 segundos 10m', 'duelo 20s 10m', 'duel 10m', '20 second duel', '20 seconds duel', '20 second duel 10 m', '20 second duel 10m', '10 m 20 second duel', '10m 20 second duel'],
  'cbte.duelo.25m': ['duelo 20 segundos 25 m', 'duelo 20 segundos 25m', 'duelo 20s 25m', 'duel 25m', '20 second duel 25 m', '20 second duel 25m', '25 m 20 second duel', '25m 20 second duel'],
  'cbte.shotgun.trap_nacional': ['trap nacional', 'national trap', 'cbte national trap', 'cbte trap', 'trap cbte'],
  'cbte.shotgun.automatic_trap': ['fossa automatica cbte', 'cbte automatic trap', 'cbte fossa', 'fossa cbte'],
  'cbte.shotgun.trap_light': ['skeet light cbte', 'cbte skeet light', 'cbte skeet', 'skeet cbte'],
};
function queryHasPhrase(query, phrase) {
  const normalizedQuery = ` ${normalize(query)} `;
  return normalizedQuery.includes(` ${normalize(phrase)} `);
}
function cardPresentationRouteHints(query) {
  const routes = Object.entries(EQUIPMENT_CARD_EVENT_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => queryHasPhrase(query, alias)))
    .map(([routeId]) => routeId);
  const normalizedQuery = normalize(query);
  if (/\bissf\b/.test(normalizedQuery)) {
    for (const [eventId, aliases] of Object.entries(ISSF_EVENT_ALIASES)) {
      if (aliases.some((alias) => normalize(alias).length >= 7 && queryHasPhrase(query, alias))) routes.push(eventId);
    }
    if (/\bmoving target\b/.test(normalizedQuery)) routes.push('issf.event.15', 'issf.event.16', 'issf.event.17', 'issf.event.18');
  }
  if (/\bwsps\b/.test(normalizedQuery)) {
    for (const match of normalizedQuery.matchAll(/\b(pt\s*[1-3]|[pr]\s*\d{1,2}|vis|vip)\b/g)) {
      routes.push(`wsps.event.${match[1].replaceAll(' ', '')}`);
    }
    if (/\bpara[ -]?trap\b/.test(normalizedQuery)) routes.push('wsps.event.pt1', 'wsps.event.pt2', 'wsps.event.pt3');
  }
  return [...new Set(routes)];
}
function equipmentCardTypes(card) {
  const normalizedCard = normalize([
    card.cardId, card.authority, card.event, card.eventId,
    ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? []),
    ...(card.eventAliases ?? []),
  ].join(' '));
  const types = new Set();
  if (/\b(carabina|carbine|rifle|fuzil|wrabf|r3|r7|r8|moving target)\b/.test(normalizedCard)) types.add('rifle');
  if (/\b(pistola|pistol|revolver|duelo)\b/.test(normalizedCard)) types.add('pistol');
  if (/\b(espingarda|shotgun|trap|skeet|fossa)\b/.test(normalizedCard)) types.add('shotgun');
  return types;
}
function requestedEquipmentTopics(normalizedQuery) {
  const topics = new Set();
  if (/\b(sapatos?|cal[cç]ados?|t[eê]nis|botas?|shoes?|footwear)\b/.test(normalizedQuery)) topics.add('footwear');
  if (/\b(cal[cç]as?|trousers|pants)\b/.test(normalizedQuery)) topics.add('trousers');
  if (/\b(casacos?|jaquetas?|jacket|jackets)\b/.test(normalizedQuery)) topics.add('jacket');
  if (/\b(luvas?|gloves?)\b/.test(normalizedQuery)) topics.add('glove');
  if (/\b(bandoleiras?|sling)\b/.test(normalizedQuery)) topics.add('sling');
  return topics;
}
function equipmentCardTopics(card) {
  const normalizedCard = normalize([
    card.cardId, card.event, card.title, card.caption,
    ...(card.displaySections ?? []).flatMap((section) => [section.heading, ...(section.items ?? [])]),
  ].join(' '));
  const topics = new Set();
  if (/\b(sapatos?|cal[cç]ados?|botas?|shoes?|footwear)\b/.test(normalizedCard)) topics.add('footwear');
  if (/\b(cal[cç]as?|trousers|pants)\b/.test(normalizedCard)) topics.add('trousers');
  if (/\b(casacos?|jaquetas?|jacket|jackets)\b/.test(normalizedCard)) topics.add('jacket');
  if (/\b(luvas?|gloves?)\b/.test(normalizedCard)) topics.add('glove');
  if (/\b(bandoleiras?|sling)\b/.test(normalizedCard)) topics.add('sling');
  return topics;
}
function requestedEquipmentTypes(normalizedQuery) {
  const types = new Set();
  if (/\b(carabina|carabinas|carbine|rifle|rifles|fuzil|fuzis|casacos?|jaquetas?|jacket|jackets|sapatos?|cal[cç]ados?|t[eê]nis|shoe|shoes|footwear|cal[cç]as?|trousers|pants|bandoleiras?|sling|luvas?|gloves?)\b/.test(normalizedQuery)) types.add('rifle');
  if (/\b(pistola|pistolas|pistol|pistols|grip|punho|revolver|revolvers|duelo)\b/.test(normalizedQuery)) types.add('pistol');
  if (/\b(espingarda|shotgun|pump|trap|skeet|fossa)\b/.test(normalizedQuery)) types.add('shotgun');
  return types;
}
function equipmentCardsForQuery(query, presentationRoutes) {
  const normalizedQuery = normalize(query);
  const asksEquipment = EQUIPMENT_MEASUREMENT_TERMS.test(normalizedQuery) || EQUIPMENT_REQUEST_TERMS.test(normalizedQuery)
    || WSPS_GENERAL_EQUIPMENT_TERMS.test(normalizedQuery);
  if (!asksEquipment) return [];
  const equipmentCardsAll = [...new Map([
    ...equipmentCards,
    ...eventEvidenceCards.filter((card) => card.category === 'equipment'),
  ].map((card) => [card.cardId, card])).values()];
  const routeSet = new Set(presentationRoutes);
  const requestedTypes = requestedEquipmentTypes(normalizedQuery);
  const requestedTopics = requestedEquipmentTopics(normalizedQuery);
  const authorityHints = new Set(['issf', 'wsps', 'cbte'].filter((authority) => new RegExp(`\\b${authority}\\b`).test(normalizedQuery)));
  const hasExplicitProofContext = routeSet.size > 0;
  const wspsGeneralEquipmentCardId = 'WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1';
  const wspsKeywordIntent = WSPS_GENERAL_EQUIPMENT_TERMS.test(normalizedQuery)
    || (authorityHints.has('wsps') && EQUIPMENT_REQUEST_TERMS.test(normalizedQuery));
  const wspsRouteContext = authorityHints.has('wsps') || [...routeSet].some((routeId) => routeId.startsWith('wsps.event.'));
  const explicitOtherAuthority = authorityHints.has('issf') || authorityHints.has('cbte')
    || [...routeSet].some((routeId) => !routeId.startsWith('wsps.event.'));
  const wspsGeneralEquipmentIntent = wspsKeywordIntent && (wspsRouteContext || !explicitOtherAuthority);
  if (!requestedTypes.size && !hasExplicitProofContext && !wspsGeneralEquipmentIntent) return [];
  const selectedCards = equipmentCardsAll.filter((card) => {
    if (card.cardId === wspsGeneralEquipmentCardId) return wspsGeneralEquipmentIntent;
    const applicableRoutes = [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? [])].filter(Boolean);
    if (hasExplicitProofContext && !applicableRoutes.some((routeId) => routeSet.has(routeId))) return false;
    if (!hasExplicitProofContext && authorityHints.size) {
      const cardAuthorities = String(card.authority ?? '').toLowerCase();
      const scopedAuthority = applicableRoutes.some((routeId) => [...authorityHints].some((authority) => routeId.startsWith(`${authority}.`)));
      if (!scopedAuthority && ![...authorityHints].some((authority) => cardAuthorities.includes(authority))) return false;
    }
    if (card.cardId === 'CBTE_WRABF_EQUIPMENT_RESTS_V1'
        && !routeSet.has('cbte.wrabf.rifle_international')
        && !/\b(wrabf|benchrest|bench\s+rest|rimfire international sporter|international sporter rifle)\b/.test(normalizedQuery)) return false;
    if (!requestedTypes.size) return true;
    const cardTypes = equipmentCardTypes(card);
    const cardTopics = equipmentCardTopics(card);
    return [...requestedTypes].some((type) => cardTypes.has(type))
      && [...requestedTopics].every((topic) => cardTopics.has(topic));
  });
  // Generic WSPS equipment questions (chairs, tables, backrests, springs,
  // bib position, etc.) belong to the dedicated overview card. Do not fan
  // them out to every equipment card merely because no event route was named.
  if (wspsGeneralEquipmentIntent && !hasExplicitProofContext) {
    return selectedCards.filter((card) => card.cardId === wspsGeneralEquipmentCardId);
  }
  const trapNationalCard = equipmentCardsAll.find((card) => card.cardId === 'CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1');
  const relatedCbteFossaEquipment = trapNationalCard
    && routeSet.has('cbte.shotgun.automatic_trap')
    && /\b(fossa|trap)\b/.test(normalizedQuery)
    && !selectedCards.some((card) => card.cardId === trapNationalCard.cardId)
    ? [{
      ...trapNationalCard,
      sourceReviewDisclosure: 'Exibido por solicitação de equipamento relacionada a Fossa/Trap. As regras deste cartão aplicam-se exclusivamente a Trap Nacional CBTE; não as transfira para outra prova.',
    }]
    : [];
  return [...new Map([...selectedCards, ...relatedCbteFossaEquipment].map((card) => [card.cardId, card])).values()];
}

function queryRequestsFinalPhase(normalizedQuery) {
  if (!/\bfinal\b/.test(normalizedQuery)) return false;
  // A question about advancing from qualification or earning a finals slot
  // concerns qualification, even though it contains the word "final".
  if (/\b(?:resultado|pontuacao|classificacao)\b.{0,45}\b(?:levad[oa]|somad[oa]|transferid[oa]|carregad[oa])\b.{0,20}\bfinal\b|\b(?:vaga|vagas|classificacao)\b.{0,30}\bfinal\b|\bshoot off\b.{0,45}\bfinal\b/.test(normalizedQuery)) return false;
  // Do not treat temporal wording or a question about whether an event has a
  // final as a request for the final-phase card.
  if (/\b(?:ao|no|ate o) final\b|\b(?:existe|ha|tem|possui|tera) final\b|\bfinal da (?:prova|competicao|evento|serie)\b/.test(normalizedQuery)) return false;
  return true;
}

function queryReferencesQualificationFinalProgression(normalizedQuery) {
  return /\b(?:qualificacao|resultado|pontuacao|classificacao|shoot off|empate|empates)\b.{0,65}\b(?:levad[oa]|somad[oa]|transferid[oa]|carregad[oa]|vaga|vagas|classificacao|final)\b/.test(normalizedQuery)
    && /\bfinal\b/.test(normalizedQuery);
}

function cardsFor(record, query) {
  const normalized = normalize(query);
  const asksWspsProgramme = /\bprograma de eventos\b|\bprograma de provas\b/.test(normalized) && /\bwsps\b/.test(normalized);
  const wspsProgrammeCards = asksWspsProgramme ? eventEvidenceCards.filter((card) => card.cardId === 'WSPS_PROGRAM_OF_EVENTS_V1') : [];
  const recordRouteIds = record?.routeIds ?? [];
  const malfunctionCardRequested = /\bfalhas?\b/.test(normalized);
  const malfunctionRouteHints = malfunctionCardRequested
    ? Object.entries(ISSF_MALFUNCTION_CARD_ALIASES)
      .filter(([routeId, aliases]) => aliases.some((alias) => queryHasPhrase(query, alias))
        && !(routeId === 'issf.event.08' && /\b(standard|rapid|tiro rapido|fogo central|centre fire|center fire|centerfire|rfp|rfpm)\b/.test(normalized)))
      .map(([routeId]) => routeId)
    : [];
  const lexicalQueryRoutes = resolveNamedEventRoutes(query);
  let resolvedRoutes = [...lexicalQueryRoutes];
  // When an exact Atlas record has already been selected, its single event route
  // is the card context. Lexical event aliases can resolve to a neighboring or
  // broader card route even though the selected Q&A has an unambiguous route.
  // Keep the Q&A answer intact and use its registered route only for cards.
  if (record?.atlasId && recordRouteIds.length === 1 && (!resolvedRoutes.length || resolvedRoutes.includes(recordRouteIds[0]))) {
    resolvedRoutes = [...recordRouteIds];
  } else if (recordRouteIds.length === 1 && (!resolvedRoutes.length || resolvedRoutes.includes(recordRouteIds[0]))) {
    resolvedRoutes = [...recordRouteIds];
  }
  if (record?.authority === 'ISSF' && !/\b(wsps|cbte)\b/.test(normalized)) {
    const issfScopedRoutes = resolveNamedEventRoutes(`${query} ISSF`).filter((routeId) => routeId.startsWith('issf.event.'));
    if (issfScopedRoutes.length) resolvedRoutes = issfScopedRoutes;
  }
  const wspsGeneralEquipmentKeyword = WSPS_GENERAL_EQUIPMENT_TERMS.test(normalized);
  const explicitWspsCodeRoutes = /\bwsps\b/.test(normalized)
    ? cardPresentationRouteHints(query).filter((routeId) => routeId.startsWith('wsps.event.'))
    : [];
  const explicitOtherAuthorityContext = /\b(?:issf|cbte)\b/.test(normalized)
    || lexicalQueryRoutes.some((routeId) => !routeId.startsWith('wsps.event.'));
  const wspsGeneralEquipmentOnly = wspsGeneralEquipmentKeyword
    && !explicitOtherAuthorityContext
    && explicitWspsCodeRoutes.length === 0;
  const recordRoutes = wspsGeneralEquipmentOnly ? [] : resolvedRoutes.length ? resolvedRoutes : record?.routeIds ?? [];
  const wspsGeneralEquipmentContext = /\bwsps\b/.test(normalized)
    || lexicalQueryRoutes.some((routeId) => routeId.startsWith('wsps.event.'))
    || recordRoutes.some((routeId) => routeId.startsWith('wsps.event.'));
  const wspsGeneralEquipmentIntent = wspsGeneralEquipmentKeyword
    && !explicitOtherAuthorityContext
    && (wspsGeneralEquipmentContext || !resolvedRoutes.length);
  const equipmentIntent = EQUIPMENT_MEASUREMENT_TERMS.test(normalized)
    || EQUIPMENT_REQUEST_TERMS.test(normalized)
    || wspsGeneralEquipmentIntent;
  const explicitAuthorityConflict = /\b(issf|wsps)\b/.test(normalized);
  const presentationAliasRoutes = explicitAuthorityConflict ? [] : cardPresentationRouteHints(query);
  const routeContextForCards = !wspsGeneralEquipmentOnly && resolvedRoutes.length
    ? resolvedRoutes
    : equipmentIntent
      ? (explicitAuthorityConflict ? cardPresentationRouteHints(query) : presentationAliasRoutes)
      : recordRouteIds.filter((routeId) => routeId !== 'renate.alphaomega');
  const cardPresentationRoutes = wspsGeneralEquipmentOnly ? [] : [...new Set([
    ...(explicitWspsCodeRoutes.length ? explicitWspsCodeRoutes : routeContextForCards),
    ...(!routeContextForCards.length && !explicitWspsCodeRoutes.length ? presentationAliasRoutes : []),
  ])];
  const singleIssfRecordRoute = recordRouteIds.length === 1 && recordRouteIds[0].startsWith('issf.event.')
    ? recordRouteIds : [];
  const asksEquipment = /\b(arma|armas|espingarda|rifle|carabina|pistola|revolver|calibre|municao|cartucho|equipamento|mira|luneta|bipe|apoio|gatilho|colete|oculos|dimensoes|peso)\b/.test(normalized);
  const asksEquipmentDetail = /\b(arma|armas|espingarda|calibre|municao|cartucho|equipamento|mira|luneta|bipe|apoio|gatilho|colete|oculos|dimensoes|medidas|medida|peso|caixa|gabarito)\b/.test(normalized);
  const routes = new Set(cards.map((card) => card.eventId));
  const namedRoutes = new Set(wspsGeneralEquipmentOnly ? [] : [...routes].filter((route) => {
    const match = route.match(/^wsps\.event\.([pr])(\d+)$/);
    if (!match) return false;
    const [, letter, number] = match;
    const routeCode = new RegExp(`\\b${letter}\\s*${number}\\b`);
    if (routeCode.test(normalized)) return true;
    if (route === 'wsps.event.p4') return /\b50m pistol\b|\bpistola 50m\b/.test(normalized);
    if (route === 'wsps.event.p5') return /\b10m air pistol standard\b|\bpistola de ar standard\b/.test(normalized);
    if (route === 'wsps.event.p6') return /\bmixed team\b|\bequipe mista\b/.test(normalized);
    return false;
  }));
  // The event resolver is authoritative when it identifies one route. The
  // older token-only WSPS shortcuts can otherwise select a broad or different
  // card (for example, Mixed Team Rifle R11 matching the P6 pistol card).
  const resolvedRoutesForCards = wspsGeneralEquipmentOnly ? [] : resolvedRoutes;
  const selectedCardRoutes = new Set(explicitWspsCodeRoutes.length
    ? explicitWspsCodeRoutes
    : resolvedRoutesForCards.length ? resolvedRoutesForCards : namedRoutes);
  if (!wspsGeneralEquipmentOnly && !selectedCardRoutes.size && singleIssfRecordRoute.length) selectedCardRoutes.add(singleIssfRecordRoute[0]);
  let eligible = cards.filter((card) => selectedCardRoutes.has(card.eventId));
  const finalPhaseRequested = queryRequestsFinalPhase(normalized);
  const qualificationFinalProgression = queryReferencesQualificationFinalProgression(normalized);
  if (finalPhaseRequested) eligible = eligible.filter((card) => card.phase === 'final');
  else if (qualificationFinalProgression) eligible = eligible.filter((card) => card.phase === 'qualification');
  else if (/\bqualificacao\b/.test(normalized)) eligible = eligible.filter((card) => card.phase === 'qualification');
  else if (equipmentIntent && cardPresentationRoutes.length === 1) eligible = eligible.filter((card) => card.phase === 'qualification');
  const namedEventRoutes = resolvedRoutes;
  const cbteRoutes = cardPresentationRoutes.length ? cardPresentationRoutes : recordRoutes.length === 1 ? recordRoutes : [];
  const phaseCards = eventEvidenceCards.filter((card) => {
    if (card.category === 'malfunction' && !malfunctionCardRequested) return false;
    const applicableRoutes = [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? [])];
    return cbteRoutes.some((routeId) => applicableRoutes.includes(routeId));
  });
  const phaseFiltered = finalPhaseRequested
    ? phaseCards.filter((card) => card.phase === 'final')
    : qualificationFinalProgression
      ? phaseCards.filter((card) => card.phase === 'qualification')
    : /\bqualificacao\b/.test(normalized)
      ? phaseCards.filter((card) => card.phase === 'qualification')
      : equipmentIntent && cardPresentationRoutes.length === 1
        ? phaseCards.filter((card) => card.phase === 'qualification')
      : phaseCards;
  const malfunctionRoutes = [...new Set([
    ...malfunctionRouteHints,
    ...(malfunctionRouteHints.length ? [] : resolvedRoutes.filter((routeId) => [
      'issf.event.08', 'issf.event.09', 'issf.event.10', 'issf.event.11',
    ].includes(routeId))),
  ])];
  const malfunctionCards = malfunctionCardRequested && malfunctionRoutes.length
    ? eventEvidenceCards.filter((card) => card.category === 'malfunction' && malfunctionRoutes.includes(card.eventId))
    : [];
  const modalityTerms = terms(query).filter((term) => !GENERIC_EVENT_TERMS.has(term) && !['final', 'qualificacao', 'fase', 'olimpico', 'olimpica'].includes(term));
  const normalizedQuery = ` ${normalize(query)} `;
  const exactModalityMatches = phaseFiltered.flatMap((card) => {
    const names = [card.event, ...(card.eventAliases ?? [])].map(normalize).filter((name) => name.length >= 5);
    const matchingNames = names.filter((name) => normalizedQuery.includes(` ${name} `));
    return matchingNames.length ? [{ card, length: Math.max(...matchingNames.map((name) => name.length)) }] : [];
  });
  const longestExactName = Math.max(0, ...exactModalityMatches.map((match) => match.length));
  let namedModalityCards = longestExactName
    ? [...new Map(exactModalityMatches.filter((match) => match.length === longestExactName).map((match) => [match.card.cardId, match.card])).values()]
    : modalityTerms.some((term) => phaseFiltered.some((card) => terms(card.event).includes(term)))
      ? phaseFiltered.filter((card) => modalityTerms.some((term) => terms(`${card.event} ${(card.eventAliases ?? []).join(' ')}`).includes(term)))
      : phaseFiltered;
  if (selectedCardRoutes.size > 1
      && selectedCardRoutes.has('issf.event.13')
      && selectedCardRoutes.has('issf.event.14')) {
    namedModalityCards = phaseFiltered.filter((card) => ['issf.event.13', 'issf.event.14'].includes(card.eventId));
  }
  const singleIssfRoute = selectedCardRoutes.size === 1 ? [...selectedCardRoutes][0] : null;
  if (singleIssfRoute?.startsWith('issf.event.')) {
    const specificRouteCards = phaseFiltered.filter((card) => card.eventId === singleIssfRoute);
    const relevantEquipmentCards = asksEquipmentDetail
      ? namedModalityCards.filter((card) => (card.eventIds ?? []).includes(singleIssfRoute))
      : [];
    namedModalityCards = [...new Map([...specificRouteCards, ...relevantEquipmentCards]
      .map((card) => [card.cardId, card])).values()];
    namedModalityCards.sort((a, b) => Number(b.eventId === singleIssfRoute) - Number(a.eventId === singleIssfRoute));
  } else if (selectedCardRoutes.size === 1
      && ['cbte.cmp.rimfire_sporter', 'cbte.fclass.rimfire'].includes([...selectedCardRoutes][0])) {
    const singleCbteRoute = [...selectedCardRoutes][0];
    const routeCards = phaseFiltered.filter((card) => card.eventId === singleCbteRoute);
    const genericRouteCards = routeCards.filter((card) => card.cardId === `${singleCbteRoute}:qualification`);
    const explicitlyNamedDetailCards = namedModalityCards.filter((card) => card.eventId === singleCbteRoute
      && card.cardId !== `${singleCbteRoute}:qualification`);
    const specificRouteCards = explicitlyNamedDetailCards.length
      ? [...genericRouteCards, ...explicitlyNamedDetailCards]
      : routeCards;
    const relevantEquipmentCards = asksEquipmentDetail
      ? namedModalityCards.filter((card) => (card.eventIds ?? []).includes(singleCbteRoute))
      : [];
    namedModalityCards = [...new Map([...specificRouteCards, ...relevantEquipmentCards]
      .map((card) => [card.cardId, card])).values()];
    namedModalityCards.sort((a, b) => Number(b.eventId === singleCbteRoute) - Number(a.eventId === singleCbteRoute));
  } else if (!explicitWspsCodeRoutes.length
      && namedModalityCards.some((card) => card.cardId?.startsWith('issf.pistol.specifications.'))) eligible = [];
  const prioritizedEquipmentCards = equipmentCardsForQuery(query, wspsGeneralEquipmentOnly ? [] : cardPresentationRoutes);
  const presentationProofCards = equipmentIntent && cardPresentationRoutes.length === 1
    ? cardPresentationRoutes.flatMap((routeId) => phaseFiltered.filter((card) => card.eventId === routeId
      && card.phase === (queryRequestsFinalPhase(normalized) ? 'final' : 'qualification')))
    : [];
  const alphaomegaEquipmentCards = recordRoutes.includes('renate.alphaomega') && asksEquipment
    ? prioritizedEquipmentCards
    : [];
  const orderedCards = [...new Map([
    ...prioritizedEquipmentCards,
    ...alphaomegaEquipmentCards,
    ...wspsProgrammeCards,
    ...malfunctionCards,
    ...presentationProofCards,
    ...eligible,
    ...namedModalityCards,
  ].map((card) => [card.cardId, card])).values()];
  return orderedCards.map((card) => {
    if (card.category !== 'equipment') return card;
    const applicableRoutes = [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? [])].filter(Boolean);
    const sourceIds = (card.sourceReferences ?? []).map((reference) => reference.document_source_id ?? reference.source_id).filter(Boolean);
    let cardFigures = figureCropsFor(applicableRoutes, sourceIds, query);
    if (card.cardId === 'WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1') {
      const relevantFigureIds = new Set([
        'wsps-start-bib-backrest-score-p16', 'wsps-shooting-chair-high-stool-p29-30',
        'wsps-wheelchair-chair-table-rules-p31', 'wsps-chair-backrest-dimensions-p32-33', 'wsps-chair-seat-and-flexible-backrest-p32',
        'wsps-shooting-table-and-kneeling-block-p34-35', 'wsps-pistol-table-dimensions-p36',
        'wsps-appendix5-sh2-support-spring-overview-p24', 'wsps-appendix5-spring-flexibility-p26',
        'wsps-appendix5-spring-test-bar-p27', 'wsps-appendix5-sh2-upper-support-dimensions-p25',
        'wsps-appendix5-sh2-rifle-yoke-configuration-p28',
      ]);
      cardFigures = cardFigures.filter((figure) => relevantFigureIds.has(figure.figure_id));
    }
    return cardFigures.length ? { ...card, figureCrops: cardFigures } : card;
  });
}

function figureCropsFor(routeIds = [], sourceIds = [], query = '') {
  const routes = new Set(routeIds);
  const sourceDocuments = new Set(sourceIds.map((id) => sourceToDocument.get(id) ?? id));
  const queryText = normalize(query);
  const apparelTopics = requestedEquipmentTopics(queryText);
  const apparelFigureMatches = (figureId) => {
    if (!apparelTopics.size) return true;
    const matches = new Set();
    if (/issf-shooting-shoes|issf-shoe-sole-flexibility-device/.test(figureId)) matches.add('footwear');
    if (/issf-shooting-jacket/.test(figureId)) matches.add('jacket');
    if (/issf-shooting-trousers/.test(figureId)) matches.add('trousers');
    if (/issf-clothing-stiffness-measurement-device/.test(figureId)
        && /\b(rigidez|stiffness|teste|test)\b/.test(queryText)) {
      if (apparelTopics.has('jacket')) matches.add('jacket');
      if (apparelTopics.has('trousers')) matches.add('trousers');
    }
    if (/issf-shoe-sole-flexibility-device/.test(figureId)
        && /\b(sapato|sapatos|cal[cç]ado|cal[cç]ados|t[eê]nis|shoe|shoes)\b/.test(queryText)
        && /\b(dimens[aã]o|espessura|rigidez|for[cç]a|teste|test|aprova[rd]?[oa]?)\b/.test(queryText)) {
      matches.add('footwear');
    }
    return [...apparelTopics].some((topic) => matches.has(topic));
  };
  return figures.filter((figure) => {
    const routeMatch = (figure.event_ids ?? []).some((route) => routes.has(route));
    const sourceMatch = sourceDocuments.has(figure.document_source_id);
    if (!routeMatch && !sourceMatch) return false;
    if (/issf-shooting-shoes|issf-shoe-sole-flexibility-device|issf-shooting-jacket|issf-shooting-trousers|issf-clothing-stiffness-measurement-device/.test(figure.figure_id)
        && !apparelTopics.size) return false;
    const excludedKeywords = figure.exclude_when_keywords ?? [];
    if (excludedKeywords.some((keyword) => queryText.includes(normalize(keyword)))) return false;
    const keywords = figure.show_when_keywords ?? [];
    const shoeFlexibilityTest = /issf-shoe-sole-flexibility-device/.test(figure.figure_id)
      && /\b(sapato|sapatos|cal[cç]ado|cal[cç]ados|t[eê]nis|shoe|shoes)\b/.test(queryText)
      && /\b(dimens[aã]o|espessura|rigidez|for[cç]a|teste|test|aprova[rd]?[oa]?)\b/.test(queryText);
    return apparelFigureMatches(figure.figure_id)
      && (shoeFlexibilityTest || keywords.length === 0 || keywords.some((keyword) => queryText.includes(normalize(keyword))));
  });
}

function makeSearchResult(payload) {
  const query = [payload.originalQuestion ?? payload.question, ...(payload.clarifications ?? [])].filter(Boolean).join(' ');
  const namedEventRoutes = resolveNamedEventRoutes(query);
  let qna = answerFromQna(query, payload.selectedAtlasId);
  if (!payload.selectedAtlasId && payload.clarifications?.length) {
    const original = answerFromQna(payload.originalQuestion ?? '', null);
    const clarificationKey = normalize(payload.clarifications.at(-1));
    const explicitClarification = exact.has(clarificationKey) || aliases.has(clarificationKey) || ids.has(clarificationKey);
    if (original.status === 'CLARIFICATION_REQUIRED') qna = explicitClarification ? answerFromQna(payload.clarifications.at(-1), null) : original;
  }
  if (qna.status === 'CLARIFICATION_REQUIRED'
      && qna.clarificationReason === 'DIFFERENT_REGISTERED_QUESTIONS'
      && namedEventRoutes.length === 1) {
    const questionOptions = topicOptionsFor(query, namedEventRoutes);
    if (questionOptions.length) qna = { status: 'TOPIC_SUGGESTIONS_REQUIRED', questionOptions, routeIds: namedEventRoutes };
  }
  if (qna.status === 'ANSWERED') {
    const answerRoutes = namedEventRoutes.length ? namedEventRoutes : qna.record.routeIds;
    const rulePassages = findRulePassages(query, { sourceIds: qna.record.sourceIds, sourceReferences: qna.record.sourceReferences, ruleLocators: qna.record.ruleLocators, routeIds: answerRoutes, limit: 4 });
    return { result: qna, rulePassages, cards: cardsFor(qna.record, query), figureCrops: figureCropsFor(answerRoutes, qna.record.sourceIds, query), origin: 'ATLAS' };
  }
  if (qna.status === 'CLARIFICATION_REQUIRED') {
    const sourceIds = qna.candidates.flatMap((candidate) => candidate.sourceIds);
    const routeIds = qna.candidates.flatMap((candidate) => candidate.routeIds);
    const ruleLocators = qna.candidates.flatMap((candidate) => candidate.ruleLocators ?? []);
    const sourceReferences = qna.candidates.flatMap((candidate) => candidate.sourceReferences ?? []);
    const rulePassages = findRulePassages(query, { sourceIds, sourceReferences, routeIds, ruleLocators, limit: Math.max(4, ruleLocators.length) });
    const resolvedRoutes = [...new Set(routeIds)];
    return { result: qna, rulePassages, cards: cardsFor({ routeIds: resolvedRoutes }, query), figureCrops: figureCropsFor(resolvedRoutes, sourceIds, query), origin: 'ATLAS_AMBIGUITY' };
  }

  const pretest = matchPretest(query);
  if (pretest) {
    const sourceIds = pretest.source_ids_cited ?? [];
    const routeIds = [pretest.route_id].filter(Boolean);
    const rulePassages = findRulePassages(query, { sourceIds, routeIds, ruleLocators: pretest.rule_locators ?? [], limit: 4 });
    if (pretest.answer_status === 'CLARIFICATION_REQUIRED') {
      return { result: { status: 'PRETEST_CLARIFICATION_REQUIRED', entry: pretest, questionOptions: [] }, rulePassages: findRulePassages(query, { routeIds, ruleLocators: pretest.rule_locators ?? [], limit: 1 }), cards: [], figureCrops: figureCropsFor(routeIds, sourceIds, query), origin: 'PRETEST_PASS' };
    }
      return { result: { status: 'PRETEST_ANSWERED', entry: pretest }, rulePassages, cards: cardsFor({ routeIds }, query), figureCrops: figureCropsFor(routeIds, sourceIds, query), origin: 'PRETEST_PASS' };
  }

  if (qna.status === 'TOPIC_SUGGESTIONS_REQUIRED') {
    const routeIds = qna.routeIds ?? namedEventRoutes;
    const context = routeEvidenceContext(query, routeIds, qna.questionOptions ?? []);
    const rulePassages = findRulePassages(query, { ...context, limit: 4 });
    return {
      result: qna,
      rulePassages,
      cards: cardsFor({ routeIds }, query),
      figureCrops: figureCropsFor(routeIds, context.sourceIds, query),
      origin: 'LOCAL_LIBRARY',
    };
  }

  const routeIds = namedEventRoutes.length ? namedEventRoutes : [...new Set(payload.routeIds ?? [])];
  if (qna.status === 'NOT_FOUND' && namedEventRoutes.length === 1) {
    const questionOptions = topicOptionsFor(query, namedEventRoutes);
    if (questionOptions.length) {
      const context = routeEvidenceContext(query, namedEventRoutes, questionOptions);
      const rulePassages = findRulePassages(query, { ...context, limit: 4 });
      return {
        result: { status: 'TOPIC_SUGGESTIONS_REQUIRED', questionOptions, routeIds: namedEventRoutes },
        rulePassages,
        cards: cardsFor({ routeIds: namedEventRoutes }, query),
        // Figures follow the user's explicit request, not retrieved passage text.
        figureCrops: figureCropsFor(namedEventRoutes, context.sourceIds, query),
        origin: 'LOCAL_LIBRARY',
      };
    }
  }
  if (qna.status === 'NOT_FOUND') {
    const questionOptions = globalQuestionOptionsFor(query, namedEventRoutes);
    const context = routeEvidenceContext(query, namedEventRoutes, questionOptions);
    const rulePassages = findRulePassages(query, { ...context, limit: 4 });
    return {
      result: { status: 'TOPIC_SUGGESTIONS_REQUIRED', questionOptions, routeIds: namedEventRoutes },
      rulePassages,
      cards: cardsFor({ routeIds: namedEventRoutes }, query),
      figureCrops: figureCropsFor(namedEventRoutes, context.sourceIds, query),
      origin: 'LOCAL_LIBRARY',
    };
  }
  const rulePassages = findRulePassages(query, { routeIds, limit: 4 });
  const fallbackCards = cardsFor({ routeIds }, query);
  return { result: { status: 'RULE_FALLBACK', query }, rulePassages, cards: fallbackCards, figureCrops: figureCropsFor(routeIds, [], query), origin: 'LOCAL_LIBRARY' };
}

async function initialize() {
  const started = performance.now();
  const [atlasData, pretestData, libraryData, ruleData, cardData, figureData] = await Promise.all([
    fetchLocalJsonl(packUrl('atlas.jsonl')),
    fetchLocalJson(packUrl('pretest-responses.json')),
    fetchLocalJson(packUrl('library-index.json')),
    fetchLocalJson(packUrl('rules.json')),
    fetchLocalJson(packUrl('cards.json')),
    fetchLocalJson(packUrl('figures.json')),
  ]);
  rows = atlasData;
  pretestRows = pretestData.entries ?? [];
  documents = libraryData.documents ?? [];
  rules = ruleData.chunks ?? [];
  cards = cardData.cards ?? [];
  eventEvidenceCards = cardData.eventEvidenceCards ?? [];
  equipmentCards = cardData.equipmentCards ?? [];
  figures = figureData.figures ?? [];
  rulesByDocument = new Map();
  ruleLocatorIndex = new Map();
  ruleLocatorIndexByDocument = new Map();
  for (const rule of rules) {
    const sourceRules = rulesByDocument.get(rule.documentSourceId) ?? [];
    sourceRules.push(rule);
    rulesByDocument.set(rule.documentSourceId, sourceRules);
    const documentIndex = ruleLocatorIndexByDocument.get(rule.documentSourceId) ?? new Map();
    for (const alias of [rule.locator, ...(rule.locatorAliases ?? [])]) {
      const key = normalize(alias);
      if (!key) continue;
      add(ruleLocatorIndex, key, rule);
      add(documentIndex, key, rule);
    }
    ruleLocatorIndexByDocument.set(rule.documentSourceId, documentIndex);
  }
  if (!rows.length || !rules.length) throw new Error('Pacote local sem Q&A ou passagens; respostas bloqueadas até restaurar o pacote íntegro.');
  exact = new Map(); aliases = new Map(); ids = new Map(); pretestExact = new Map(); sourceToDocument = new Map();
  rowsByRoute = new Map();
  atlasIndex = new Index({ tokenize: 'forward', resolution: 9, minlength: 2, cache: 100 });
  pretestIndex = new Index({ tokenize: 'forward', resolution: 9, minlength: 2 });
  rulesIndex = new Index({ tokenize: 'forward', resolution: 8, minlength: 2 });

  for (const doc of documents) {
    sourceToDocument.set(doc.documentSourceId, doc.documentSourceId);
    for (const ocr of doc.ocrs ?? []) sourceToDocument.set(ocr.sourceId, doc.documentSourceId);
  }
  for (const row of rows) {
    add(exact, normalize(row.question), row);
    for (const alias of row.aliases ?? []) add(aliases, normalize(alias), row);
    for (const id of [row.atlas_id, row.question_id, row.atomic_id]) add(ids, normalize(id), row);
    atlasIndex.add(row.atlas_id, [row.question, ...(row.aliases ?? []), row.question_id, row.atomic_id, ...(row.route_ids ?? [])].join(' '));
    for (const routeId of row.route_ids ?? []) add(rowsByRoute, routeId, row);
  }
  for (const entry of pretestRows) {
    add(pretestExact, normalize(entry.question), entry);
    pretestIndex.add(entry.case_id, [entry.question, entry.answer].join(' '));
  }
  for (const rule of rules) rulesIndex.add(rule.id, [rule.locator, rule.text].join(' '));
  return { count: rows.length, pretestCount: pretestRows.length, documentCount: documents.length, ruleCount: rules.length, cardCount: cards.length + eventEvidenceCards.length, initializeMs: performance.now() - started };
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data ?? {};
  try {
    if (type === 'init') {
      const stats = await initialize();
      self.postMessage({ id, type: 'ready', ...stats });
      return;
    }
    if (type === 'search') {
      self.postMessage({ id, type: 'result', ...makeSearchResult(payload) });
      return;
    }
    if (type === 'evaluate') {
      const started = performance.now();
      const results = payload.cases.map((testCase) => {
        const row = rows.find((item) => item.atlas_id === testCase.atlas_id);
        const actual = answerFromQna(row?.question ?? '', null);
        return { caseId: testCase.case_id, atlasId: testCase.atlas_id, expectedResolution: testCase.expected_resolution, actualStatus: actual.status, actualIds: actual.candidates?.map((candidate) => candidate.atlasId) ?? (actual.record ? [actual.record.atlasId] : []), actualAnswer: actual.record?.answer ?? null };
      });
      self.postMessage({ id, type: 'evaluation', results, durationMs: performance.now() - started });
      return;
    }
    if (type === 'evaluatePresentation') {
      const started = performance.now();
      const results = payload.cases.map((testCase) => {
        const row = rows.find((item) => item.atlas_id === testCase.atlas_id);
        if (!row) return { caseId: testCase.case_id, atlasId: testCase.atlas_id, state: 'MISSING_ATLAS_ROW' };
        const presentation = makeSearchResult({ question: row.question, selectedAtlasId: testCase.expected_resolution === 'MATCH_ATLAS_RECORD' ? row.atlas_id : undefined });
        const result = presentation.result;
        const presentedAnswer = result.record?.answer ?? result.entry?.answer ?? null;
        const presentedSources = result.record?.sourceIds ?? result.candidates?.flatMap((candidate) => candidate.sourceIds) ?? result.entry?.source_ids_cited ?? row.source_ids ?? [];
        const presentedReferences = result.record?.sourceReferences ?? result.candidates?.flatMap((candidate) => candidate.sourceReferences) ?? row.source_references ?? [];
        const allConfiguredCards = [...cards, ...eventEvidenceCards, ...equipmentCards];
        const expectedCardRoutes = (testCase.expected_route_ids ?? []).filter((route) => allConfiguredCards.some((card) => [card.eventId, ...(card.eventIds ?? []), ...(card.applicableRouteIds ?? []), ...(card.routeIds ?? [])].includes(route)));
        return {
          caseId: testCase.case_id,
          atlasId: testCase.atlas_id,
          question: row.question,
          expectedResolution: testCase.expected_resolution,
          actualStatus: result.status,
          presentedAnswer,
          presentedRouteIds: result.record?.routeIds ?? row.route_ids ?? [],
          presentedSourceIds: presentedSources,
          sourceReferences: presentedReferences,
          rulePassages: presentation.rulePassages.map(({ title, edition, locator, locatorAliases, text, pdfPath, pdfSha256, ocrPath, ocrSha256, sourceId, documentSourceId, relevance }) => ({ title, edition, locator, locatorAliases, text, pdfPath, pdfSha256, ocrPath, ocrSha256, sourceId, documentSourceId, relevance })),
          figureCrops: presentation.figureCrops ?? [],
          cards: presentation.cards.map((card) => ({ cardId: card.cardId, eventId: card.eventId, eventIds: card.eventIds, applicableRouteIds: card.applicableRouteIds, routeIds: card.routeIds, phase: card.phase, photoPath: card.photoPath, photoSha256: card.photoSha256, imagePath: card.imagePath, imageSha256: card.imageSha256, sourceRefs: card.sourceRefs, figureCrops: (card.figureCrops ?? []).map((figure) => ({ figure_id: figure.figure_id, assetPath: figure.assetPath, assetSha256: figure.assetSha256, document_source_id: figure.document_source_id, page: figure.page, locator: figure.locator })) })),
          expectedCardRoutes,
          origin: presentation.origin,
        };
      });
      self.postMessage({ id, type: 'presentationEvaluation', results, durationMs: performance.now() - started });
    }
  } catch (error) {
    if (type === 'search' && rules.length) {
      const nearest = [...rules].sort((a, b) => a.documentSourceId.localeCompare(b.documentSourceId) || String(a.locator).localeCompare(String(b.locator)) || a.id.localeCompare(b.id))[0];
      self.postMessage({ id, type: 'result', result: { status: 'RULE_FALLBACK', query: payload?.question ?? payload?.originalQuestion ?? '' }, rulePassages: [{ title: nearest.title, edition: nearest.edition, locator: nearest.locator || 'Localizador textual não extraído do OCR', text: nearest.text, pdfPath: nearest.pdfPath, pdfSha256: nearest.pdfSha256, ocrPath: nearest.ocrPath, ocrSha256: nearest.ocrSha256, sourceId: nearest.sourceId, documentSourceId: nearest.documentSourceId, relevance: 'RELATED_NEAREST_AVAILABLE', score: 0 }], cards: [], origin: 'LOCAL_LIBRARY' });
      return;
    }
    self.postMessage({ id, type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
};
