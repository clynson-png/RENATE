import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routePath = path.join(root, 'data/imports/day1_2026-11-06/governance/route_audit_62_2026-11-06.json');
const rulesPath = path.join(root, 'public/renate-pack/rules.json');
const outputPath = path.join(root, 'data/imports/tie_breaking_qa_supplement_2026-11-07.jsonl');
const routes = JSON.parse(fs.readFileSync(routePath, 'utf8'));
const chunks = JSON.parse(fs.readFileSync(rulesPath, 'utf8')).chunks;
const manifestText = fs.readFileSync(path.join(root, 'library/manifest.csv'), 'utf8');
const csvRows = [];
let csvRow = [], csvField = '', csvQuoted = false;
for (let i = 0; i < manifestText.length; i += 1) {
  const ch = manifestText[i];
  if (csvQuoted) {
    if (ch === '"' && manifestText[i + 1] === '"') { csvField += '"'; i += 1; }
    else if (ch === '"') csvQuoted = false;
    else csvField += ch;
  } else if (ch === '"') csvQuoted = true;
  else if (ch === ',') { csvRow.push(csvField); csvField = ''; }
  else if (ch === '\n') { csvRow.push(csvField); csvRows.push(csvRow); csvRow = []; csvField = ''; }
  else if (ch !== '\r') csvField += ch;
}
if (csvField || csvRow.length) { csvRow.push(csvField); csvRows.push(csvRow); }
const [manifestHeader, ...manifestData] = csvRows;
const manifest = manifestData.map((cells) => Object.fromEntries(manifestHeader.map((name, index) => [name, cells[index] ?? ''])));
const routeById = new Map(routes.map((route) => [route.route_id, route]));
const questions = [];
const add = (routeId, proof, family, locatorHint = '') => questions.push({ routeId, proof, family, locatorHint });

for (const route of routes) {
  const id = route.route_id;
  if (id.startsWith('issf.event.')) {
    const eventNo = Number(id.slice('issf.event.'.length));
    const family = eventNo <= 12 ? 'ISSF_RIFLE_PISTOL' : eventNo <= 14 ? 'ISSF_SHOTGUN' : eventNo <= 18 ? 'ISSF_MOVING_TARGET' : 'ISSF_TARGET_SPRINT';
    add(id, `${route.route_name} (ISSF)`, family);
  } else if (id.startsWith('wsps.event.')) {
    const family = id.startsWith('wsps.event.pt') ? 'ISSF_SHOTGUN' : ['wsps.event.p6', 'wsps.event.r10', 'wsps.event.r11'].includes(id) ? 'ISSF_TEAM' : 'ISSF_RIFLE_PISTOL';
    const eventCode = id.slice('wsps.event.'.length).toUpperCase();
    add(id, `WSPS ${eventCode} — ${route.route_name}`, family);
  } else if (id === 'cbte.issf.carabina') {
    for (const proof of ['Carabina de Ar 10 m ISSF', 'Carabina 50 m 3 posições ISSF', 'Carabina 50 m deitado ISSF', 'Carabina 300 m 3 posições ISSF', 'Carabina 300 m deitado ISSF', 'Carabina Standard 300 m ISSF']) add(id, proof, 'ISSF_RIFLE_PISTOL');
  } else if (id === 'cbte.issf.pistola') {
    for (const proof of ['Pistola de Ar 10 m ISSF', 'Pistola 25 m ISSF', 'Pistola de Tiro Rápido 25 m ISSF', 'Pistola de Fogo Central 25 m ISSF', 'Pistola Standard 25 m ISSF', 'Pistola 50 m ISSF']) add(id, proof, 'ISSF_RIFLE_PISTOL');
  } else if (id === 'cbte.fclass.centerfire') {
    add(id, 'Carabina F-Class Centerfire CBTE', 'CBTE_FCLASS');
  } else if (id === 'cbte.nra') {
    add(id, 'Carabina NRA / Rifle Esporte CBTE', 'CBTE_NRA');
  } else if (id === 'cbte.shotgun.issf') {
    add(id, 'Fossa Olímpica (Trap) ISSF/CBTE', 'ISSF_SHOTGUN', '9.17.4.1');
    add(id, 'Skeet Olímpico ISSF/CBTE', 'ISSF_SHOTGUN', '9.17.4.2');
  } else if (id === 'cbte.shotgun.trap_light') {
    add(id, 'Fossa Olímpica Light CBTE', 'ISSF_SHOTGUN', '9.17.4.1');
    add(id, 'Skeet Light CBTE', 'ISSF_SHOTGUN', '9.17.4.2');
  } else if (id === 'cbte.national_light') {
    for (const proof of ['Revólver 5 m Light', 'Pistola 5 m Light', 'Rifle de Precisão 15 m Bolt Action / Lever Action Light', 'Rifle Rápido 10 m Semi-Auto Light', 'Fuzil Tático 25 m Light', 'Fuzil de Precisão 50 m Light', 'Espingarda 10 m Light', 'Espingarda 10 m Semi-Auto Light']) add(id, proof, proof.startsWith('Espingarda') ? 'CBTE_LIGHT_SHOTGUN' : 'CBTE_LIGHT_RIFLE', proof.match(/^(Revólver|Pistola)/) ? '1.' : proof.startsWith('Rifle de Precisão 15') ? '2.1' : proof.startsWith('Rifle Rápido') ? '2.2' : proof.startsWith('Fuzil Tático') ? '2.3' : proof.startsWith('Fuzil de Precisão') ? '2.4' : proof.includes('Semi-Auto') ? '3.2' : '3.1');
  } else if (id === 'cbte.wsps.program') {
    for (const proof of ['WSPS R1 — Rifle de Ar 10 m em Pé SH1', 'WSPS R2 — Rifle de Ar 10 m em Pé SH1', 'WSPS R3 — Rifle de Ar 10 m Deitado SH1', 'WSPS R4 — Rifle de Ar 10 m em Pé SH2', 'WSPS R5 — Rifle de Ar 10 m Deitado SH2', 'WSPS R6 — Rifle 50 m Deitado SH1', 'WSPS R7 — Rifle 50 m 3 Posições Masculino SH1', 'WSPS R8 — Rifle 50 m 3 Posições Feminino SH1', 'WSPS R9 — Rifle 50 m Deitado SH2', 'WSPS P1 — Pistola de Ar 10 m SH1', 'WSPS P2 — Pistola de Ar 10 m SH1', 'WSPS P3 — Pistola 25 m SH1', 'WSPS P4 — Pistola 50 m SH1', 'WSPS P5 — Pistola de Ar 10 m Standard SH1']) add(id, proof, 'ISSF_RIFLE_PISTOL');
  } else if (id === 'cbte.shotgun.trap_nacional_25_2024') {
    add(id, 'Trap Nacional 25 CBTE 2024', 'CBTE_TRAP_NACIONAL_2024', '4.1');
  } else if (id === 'cbte.shotgun.trap_nacional_50_2024') {
    add(id, 'Trap Nacional 50 CBTE 2024', 'CBTE_TRAP_NACIONAL_2024', '4.1');
  } else {
    add(id, `${route.route_name} (CBTE)`, 'CBTE_ROUTE');
  }
}

const issfId = 'ADANA-SRC-2A79B10E08375DE1';
const wspsAdoptionId = 'ADANA-DERIVED-11BC52259F71C331';
const cbteGeneralId = 'ADANA-SRC-7914789A181774E9';
const normal = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const routeTieChunks = (routeId) => chunks.filter((chunk) => (chunk.referencedBy ?? []).includes(routeId) && /empate|desempate|tie.break|shoot.off|countback/i.test(chunk.text ?? ''));
const sourceReference = (chunk, authority, locators = [chunk.locator].filter(Boolean)) => ({
  citation_tag: `${authority}-TIE`,
  source_id: chunk.documentSourceId,
  document_source_id: chunk.documentSourceId,
  title: chunk.title,
  authority,
  edition: chunk.edition,
  source_sha256: chunk.pdfSha256,
  locators,
  verification_status: 'RENATE_LOCAL_LIBRARY_RULE_CHUNK_HASH_BOUND; USER_DIRECTED_TIE_BREAKING_QA_2026-11-07',
});
const findChunk = (sourceId, locator) => chunks.find((chunk) => chunk.documentSourceId === sourceId && (chunk.locator === locator || (chunk.locator ?? '').startsWith(`${locator}.`) || (chunk.locator ?? '').startsWith(`${locator} `) || (chunk.locatorAliases ?? []).includes(locator)));
const manifestReference = (documentId, authority, locator) => {
  const row = manifest.find((item) => item.artifact_kind === 'documents' && item.document_source_id === documentId && item.local_pdf_path);
  if (!row) return null;
  return {
    citation_tag: `${authority}-TIE`, source_id: row.source_id || documentId, document_source_id: documentId,
    title: row.title, authority, edition: row.edition, source_sha256: row.pdf_sha256_observed,
    locators: [locator].filter(Boolean), verification_status: 'RENATE_LOCAL_MANIFEST_HASH_BOUND; USER_DIRECTED_TIE_BREAKING_QA_2026-11-07',
  };
};
const uniqueReferences = (references) => [...new Map(references.filter(Boolean).map((ref) => [`${ref.source_id}|${ref.document_source_id}|${ref.locators.join('|')}`, ref])).values()];

const answerFor = (item, refs, directChunks) => {
  if (item.family === 'ISSF_RIFLE_PISTOL') return `Na qualificação das provas ISSF de 10 m, 25 m, 50 m e 300 m, a ordem é: maior número de inner tens; maior resultado da última série de 10 tiros em ordem regressiva; comparação tiro a tiro pelos inner tens, começando pelo último; e, se usados alvos eletrônicos, comparação decimal tiro a tiro também de trás para frente. Persistindo empate, mantém-se a mesma colocação e lista-se em ordem alfabética pelo sobrenome. Na final aplica-se o shoot-off e o critério da fase específica da prova. ${item.proof.includes('WSPS') ? 'Para WSPS, a cláusula local de adoção remete às regras técnicas gerais ISSF sobre tie-breaking, salvo regra WSPS específica.' : item.routeId.startsWith('cbte.issf.') ? 'Para a classificação do Campeonato Brasileiro CBTE, além do resultado específico da prova, a regra CBTE considera os X, depois compara as séries da última para a primeira e, persistindo, usa a matrícula CBTE mais antiga.' : ''}`;
  if (item.family === 'ISSF_TEAM') return 'Em prova por equipes, inclusive equipe mista, primeiro se totalizam os resultados de todos os integrantes; depois aplicam-se ao total os critérios de desempate individual da disciplina. Para eventos WSPS, a adoção das regras técnicas gerais ISSF sobre tie-breaking decorre da cláusula WSPS local, salvo regra específica.';
  if (item.family === 'ISSF_SHOTGUN') {
    if (item.proof.includes('WSPS')) return 'A regra WSPS adota os critérios ISSF de tie-breaking, salvo disposição WSPS específica (Appendix 11 §1.1.3). Para competições sem final, escores perfeitos não são desempatados; empate pelas três primeiras colocações vai a shoot-off; a partir do quarto lugar aplica-se countback (§9.14.3.1–9.14.3.4). No Trap, o shoot-off avança pelos postos, com um tiro por alvo e sequência definida na regra (§9.14.2.3). A aplicação é por fase; não se presume que o evento WSPS tenha final olímpica.';
    const skeet = /Skeet/i.test(item.proof);
    const authorityText = item.proof.includes('WSPS') ? 'Nas regras WSPS, aplica-se a regra técnica ISSF de desempate por incorporação, salvo regra específica WSPS.' : 'Na regra ISSF';
    const method = skeet ? 'o shoot-off de qualificação ocorre na estação 4, com doubles regulares e reversos em sequência até romper o empate' : 'o shoot-off de qualificação percorre os postos em sequência, alternando pratos conforme a regra, com um tiro por alvo';
    const final = skeet ? 'Na final de Skeet, aplica-se o procedimento específico do §9.17.4.2 e o shoot-off do §9.17.4.3.' : 'Na final de Trap, empate até a disputa pelo bronze favorece o maior número de partida; empate pelo ouro/prata leva a shoot-off imediato (§9.17.4.1 e §9.17.4.3).';
    return `${authorityText}, empate entre as posições que dão vaga à final é decidido por shoot-off; posições seguintes usam countback, salvo empate absoluto para vaga de quota. No caso desta prova, ${method}. ${final}${item.proof.includes('Light') ? ' Para o formato Light, a regra ISSF citada só se aplica quando o regulamento CBTE da competição a adota e não dispõe em contrário.' : ''}`;
  }
  if (item.family === 'ISSF_MOVING_TARGET') {
    const mixed50 = /50m Moving Target Mixed/i.test(item.proof);
    const fifty = /50m Moving Target/i.test(item.proof);
    const qualifier = fifty ? (mixed50 ? 'para o 50 m misto, maior total do segundo estágio e depois comparação dos tiros de menor valor' : 'para o 50 m 30+30, maior total na parte rápida e depois comparação dos tiros de menor valor') : 'para as provas de 10 m, tie-break geral ISSF';
    return `No Moving Target ISSF, empate pelas três primeiras colocações é resolvido por shoot-off. Escores perfeitos permanecem empatados. Do quarto lugar para baixo, ${qualifier}; se ainda persistir, mantém-se a mesma colocação.`;
  }
  if (item.family === 'ISSF_TARGET_SPRINT') return 'Em Target Sprint ISSF, com cronometragem manual em décimos, atletas com o mesmo tempo recebem a mesma colocação. Com cronometragem eletrônica ou transponder, o tempo é medido ao centésimo; se o empate continuar, os atletas mantêm a mesma colocação e são listados alfabeticamente pelo sobrenome.';
  if (item.family === 'CBTE_LIGHT_RIFLE') return 'O regulamento da prova Light registra os X para desempate; o centro olímpico também tem a pontuação especial prevista para cada divisão. O critério de X e as demais condições devem ser lidos na seção específica da prova indicada na fonte. Na classificação do Campeonato Brasileiro CBTE, para provas nacionais e de rifle internacional, contam-se os X; persistindo o empate, prevalece a matrícula CBTE mais antiga.';
  if (item.family === 'CBTE_LIGHT_SHOTGUN') return 'O regulamento local de Provas Nacionais Light descreve a divisão de espingarda, mas o trecho localizado não estabelece critério próprio para desempatar essa prova. Por isso, não atribuo a ela a contagem de X das provas de arma raiada nem o shoot-off olímpico sem uma regra CBTE específica aplicável à competição. A passagem local mais próxima é a descrição da prova e seu sistema de pontuação no item citado.';
  if (item.family === 'CBTE_FCLASS') return 'Na Carabina F-Class CBTE, desempata primeiro o maior número de X na prova; persistindo o empate, vence a matrícula CBTE mais antiga. O X é critério de desempate e não acrescenta valor à pontuação numérica. O organizador pode estabelecer regra contrária para o Campeonato Brasileiro. Fonte: regulamento F-Class, §§5.2 e 9.6.';
  if (item.family === 'CBTE_NRA') return 'Na NRA, o primeiro critério é o maior número de X. Persistindo, comparam-se nesta ordem: série de pé; série sentado/ajoelhado em tiro rápido; deitado em tiro rápido; deitado em tiro lento. Se ainda empatar, vence a matrícula CBTE mais antiga. Em escore perfeito no mesmo alvo, há novos disparos em morte súbita no mesmo tipo de série. Fonte: Regulamento NRA §§3.1 e 3.2.';
  if (item.family === 'CBTE_TRAP_NACIONAL_2024') return `No Trap Nacional ${item.proof.includes('25') ? '25' : '50'} CBTE 2024, o regulamento específico estabelece esta ordem na categoria/classe ao final: ${item.proof.includes('25') ? 'maior resultado na série; persistindo, countback do último prato para o primeiro' : 'maior resultado na última série, depois na penúltima e assim por diante; persistindo, countback do último prato para o primeiro'}, menor número de reinscrições e, por fim, maior idade. Aplicam-se os itens 4.1 a 4.5 da edição específica da prova.`;
  if (directChunks.length) return `O regulamento local da prova trata o desempate nos itens ${refs.flatMap((ref) => ref.locators).join(', ')}. ${directChunks.map((chunk) => chunk.text.replace(/\s+/g, ' ').trim()).join(' ')}`;
  return 'Para a classificação do Campeonato Brasileiro CBTE, a regra geral distingue a disciplina: em provas ISSF e WSPS, contam-se os X; persistindo, comparam-se as séries da última para a primeira; se ainda houver empate, prevalece a matrícula CBTE mais antiga. Em provas nacionais e de rifle internacional, contam-se os X e, persistindo, vence a matrícula CBTE mais antiga. O X é critério de desempate e não se soma ao resultado. O regulamento específico da prova ou do campeonato prevalece quando trouxer regra própria.';
};

const rows = [];
for (let index = 0; index < questions.length; index += 1) {
  const item = questions[index];
  const route = routeById.get(item.routeId);
  let direct = [];
  let refs = [];
  if (item.family.startsWith('ISSF_')) {
    const locators = item.family === 'ISSF_RIFLE_PISTOL' ? ['6.15.1'] : item.family === 'ISSF_TEAM' ? ['6.15.5'] : item.family === 'ISSF_SHOTGUN' ? (item.proof.includes('WSPS') ? ['9.14.3.1', '9.14.3.2', '9.14.3.3', '9.14.3.4', '9.14.2.3'] : ['9.14.1.1', '9.14.2.3', '9.14.2.4', item.locatorHint || '9.17.4', '9.17.4.3']) : item.family === 'ISSF_MOVING_TARGET' ? ['10.12.1.1', '10.12.1.2', '10.12.1.3'] : ['11.15.1'];
    refs.push(...locators.map((locator) => findChunk(issfId, locator)).filter(Boolean).map((chunk) => sourceReference(chunk, item.proof.includes('WSPS') ? 'WSPS' : 'ISSF', [chunk.locator])));
    if (item.proof.includes('WSPS')) {
      const adoption = chunks.find((chunk) => chunk.documentSourceId === wspsAdoptionId && /1\.1\.3/.test(chunk.locator ?? '') && /Tie-Breaking/i.test(chunk.text ?? ''));
      if (adoption) refs.push(sourceReference(adoption, 'WSPS'));
    }
    if (['cbte.issf.carabina', 'cbte.issf.pistola'].includes(item.routeId)) refs.push(manifestReference(cbteGeneralId, 'CBTE', 'a) Desempate individual'));
  } else {
    direct = routeTieChunks(item.routeId).filter((chunk) => !/ISSF|WSPS/i.test(chunk.title ?? '') && (item.locatorHint ? normal(chunk.locator).includes(normal(item.locatorHint)) : true));
    if (item.family === 'CBTE_LIGHT_RIFLE' || item.family === 'CBTE_LIGHT_SHOTGUN') direct = routeTieChunks(item.routeId).filter((chunk) => normal(chunk.locator).startsWith(normal(item.locatorHint)) && normal(chunk.title).includes('light'));
    if (direct.length) {
      const relevant = direct.slice(0, 3);
      refs.push(...relevant.map((chunk) => sourceReference(chunk, 'CBTE')));
    }
    if (item.family === 'CBTE_ROUTE' && !direct.length) {
      const generalChunk = chunks.find((chunk) => /Regulamento Geral CAR\/PST\/RF/i.test(chunk.title ?? '') && /Desempate individual/i.test(chunk.text ?? ''));
      if (generalChunk) refs.push(sourceReference(generalChunk, 'CBTE', [generalChunk.locator].filter(Boolean)));
      else refs.push(manifestReference(cbteGeneralId, 'CBTE', '6) Desempate individual'));
    }
    if (item.family === 'CBTE_LIGHT_RIFLE') refs.push(manifestReference(cbteGeneralId, 'CBTE', 'b) Disciplinas Nacionais e de Rifle Internacional'));
    if (item.family === 'CBTE_LIGHT_SHOTGUN') refs.push(manifestReference('ADANA-SRC-0DF327513A5FB06C', 'CBTE', item.locatorHint));
    if (item.family === 'CBTE_TRAP_NACIONAL_2024') refs.push(manifestReference(item.routeId.endsWith('_25_2024') ? 'ADANA-SRC-214E78376F9517D1' : 'ADANA-SRC-3243DF292DBCD06A', 'CBTE', '4.1'));
    if (item.family === 'ISSF_SHOTGUN' || item.family === 'ISSF_RIFLE_PISTOL') {
      const loc = item.family === 'ISSF_SHOTGUN' ? ['9.14.1.1', '9.14.2.3', '9.14.2.4', item.locatorHint || '9.17.4'] : ['6.15.1'];
      refs.push(...loc.map((locator) => findChunk(issfId, locator)).filter(Boolean).map((chunk) => sourceReference(chunk, 'ISSF')));
    }
  }
  if (!refs.length && item.family === 'CBTE_ROUTE') refs.push(manifestReference(cbteGeneralId, 'CBTE', '6) Desempate individual'));
  if (!refs.length && item.family === 'CBTE_LIGHT_RIFLE') refs.push(manifestReference('ADANA-SRC-0DF327513A5FB06C', 'CBTE', item.locatorHint));
  refs = uniqueReferences(refs);
  const answer = answerFor(item, refs, direct);
  const digest = crypto.createHash('sha1').update(`${item.routeId}|${item.proof}|tie-break-2026-11-07`).digest('hex').slice(0, 10).toUpperCase();
  const id = `RENATE:TIE:${item.routeId.toUpperCase().replaceAll('.', '-')}:${digest}:A01`;
  const locators = uniqueReferences(refs).flatMap((ref) => ref.locators);
  rows.push({
    atlas_id: id,
    question_id: id.replace(/:A01$/, ''),
    atomic_id: `${id.replace(/:A01$/, '')}:A01`,
    source: 'RENATE_USER_DIRECTED_TIE_BREAKING_QA',
    human_approval_status: 'USER_DIRECTED_IMPORT_2026-11-07',
    question: `Como ocorre o empate ou desempate na prova ${item.proof}?`,
    answer,
    answer_source_field: 'RENATE_LOCAL_RULES_AND_USER_DIRECTED_EVENT_MAPPING',
    answer_key_hint: answer,
    adana_response: answer,
    atlas_response_status: 'ANSWERED',
    atlas_review_status: 'USER_DIRECTED_IMPORT_LOCAL_SOURCE_BOUND',
    answer_key_status: 'RENATE_LOCAL_SOURCE_BOUND',
    authority: route.authority,
    route_ids: [item.routeId],
    route_classification_status: 'EXPLICIT_ROUTE_ID_FROM_RENATE_ROUTE_INVENTORY',
    discipline_routes: [item.routeId],
    aliases: ['empate', 'empates', 'desempate', 'tie-break', 'tie breaking', 'countback', 'shoot-off'],
    rule_locators: locators,
    source_ids: uniqueReferences(refs).map((ref) => ref.source_id),
    source_references: refs,
    source_citation_tags: uniqueReferences(refs).map((ref) => ref.citation_tag),
    source_citation_text: uniqueReferences(refs).map((ref) => `[${ref.citation_tag}], ${ref.locators.join(', ')}.`).join(' '),
    source_tags_not_bound_to_local_documents: [],
    source_document: 'RENATE/library; regras locais vinculadas no campo source_references',
    atlas_original_answer_is_evidence: false,
    renate_approved_as_evidence: true,
    approval_basis: 'USER_DIRECTED_ROUTE_AND_PROOF_COVERAGE_2026-11-07; local library sources bound',
    question_source_file: 'data/imports/tie_breaking_qa_supplement_2026-11-07.jsonl',
  });
}

const missing = [...new Set(routes.map((route) => route.route_id))].filter((id) => !rows.some((row) => row.route_ids.includes(id)));
if (missing.length) throw new Error(`Rotas sem pergunta de desempate: ${missing.join(', ')}`);
if (rows.some((row) => !row.source_ids.length || !row.rule_locators.length)) throw new Error(`Há perguntas sem fonte/localizador normativo local: ${rows.filter((row) => !row.source_ids.length || !row.rule_locators.length).map((row) => row.atlas_id).join(', ')}`);
fs.writeFileSync(outputPath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
console.log(`Gravadas ${rows.length} perguntas para ${new Set(rows.flatMap((row) => row.route_ids)).size} route_id em ${path.relative(root, outputPath)}.`);
