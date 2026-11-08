# Briefing de retomada — RENATE BETA Offline

**Atualizado:** 2026-11-06  
**Raiz independente:** `RENATE/`. O ADANA principal permanece sem alteração.  
**SPEC:** `RENATE_BETA_OFFLINE_SPEC_V1.md`, versão 2.6.
**Estado:** aceite browser `PASS` para os 960 casos presentes no snapshot ATLAS. Cinco rotas não têm casos e não foram avaliadas.

## Decisões e estado confirmado

- O corpus offline usado pelo app tem 21 PDFs e 40 OCRs; os dados de entrada da Library têm 31 PDFs e 50 OCR/textos. O pacote inclui 960 Q&A, 13 pretestes `PASS`, 14.674 passagens, 30 cards ativos e 33 recortes PNG.
- Chromium 158: 960/960 respostas, fontes, localizadores e passagens com hashes PDF/OCR corretos; 45/45 cards aplicáveis com imagem; 812/812 resultados que retornaram recorte passaram hash/proveniência; 9/9 associações críticas figura-pergunta passaram.
- As rotas sem caso no snapshot são `cbte.cmp.rimfire_sporter`, `cbte.shotgun.automatic_trap`, `cbte.shotgun.issf`, `cbte.shotgun.trap_nacional` e `issf.event.14`.
- Nova UI de consulta direta: **Biblioteca de regras** no menu abre/filtro os 21 PDFs sem fazer pergunta. Respostas também exibem links para abrir o regulamento completo local; passagens citadas ficam na ação **Consultar passagens da regra**. Nenhuma consulta remota.
- Auditoria de figuras: os PDFs locais forneceram as figuras de alvos CBTE/ISSF, empunhaduras, roupa/calçado e WSPS Appendices 4/5; não é necessária busca externa para as 960 perguntas cobertas. Relação de tópicos e páginas em `FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`.
- A busca e o teste browser passaram com zero chamadas externas. O pacote SHA-256 é `60171673782cfec825eeb52c773fb6112792c0b8b11b9a2b47b4b34962cddd67`; precache 267 entradas / 339.196.564 bytes.

## Arquivos alterados nesta reconciliação

- `scripts/rule_chunks.mjs`, `scripts/build_local_pack.mjs`, `src/atlasSearch.worker.js`, `src/App.jsx`.
- `scripts/render_rule_page_crops.py`, `tests/rule-chunks.test.mjs`, `tests/browser-search.js`, `scripts/run_browser_acceptance.mjs`.
- `data/imports/day1_2026-11-06/atlas/atlas_source_bindings_2026-11-06.jsonl`.
- `data/imports/day1_2026-11-06/figure-crops/manifest.json` e 33 PNGs locais.
- SPEC RENATE v2.6, `TRUST.md`, `README.md` e relatórios de Dia 3/retomada.

## Pendente

1. Adicionar casos aprovados das cinco rotas sem caso, se houver conteúdo de origem já dentro de RENATE.
2. Testar instalação/quota e Whisper Tiny com fala humana em Android e iPhone. TTS PT-BR continua bloqueado.
3. Depois do fechamento local e atualização do aceite, seguir para Supabase/RLS de inserção inicial de lead e hospedagem Vercel/HTTPS.

## Comandos/evidências

- `npm run test:pack` — `PASS`.
- `npm run test:locators` — `PASS`, 8/8.
- `npm run test:browser` — `PASS`, código 0.
- Relatório completo: `docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md`.
- Casos por ID: `docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json`.
- Matriz das 62 rotas: `docs/beta-offline/ROUTE_CARD_COVERAGE_2026-11-06.csv`.
- Proveniência dos recortes: `data/imports/day1_2026-11-06/figure-crops/manifest.json`.
