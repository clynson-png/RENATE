# RENATE — viabilidade do mecanismo de busca no frontend

**Data:** 2026-11-06  
**Estado:** `FLEXSEARCH_HUMAN_APPROVED`; busca e apresentação vinculada de regras/cards/figuras passaram 960/960 casos cobertos no Chromium 158. Cinco rotas não têm caso ATLAS no snapshot; validação em dispositivos permanece pendente.  
**Escopo:** comparação reproduzível de 10 perguntas ATLAS sorteadas com seed fixa; sem servidor e sem consulta ao ADANA.

## Desenho do benchmark

- Fonte local: `data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl`, 960 Q&A; SHA-256 `c383b6209768606ea0d5b6abf6b20d278abbe43a6fde12bc10184c862bdc7512`.
- `scripts/day2_search_benchmark.mjs` usa seed `20261106`, sorteia 10 perguntas associadas a 10 rotas distintas e executa 30 consultas por caso.
- Busca/memória foram medidas em Node.js 24.18.0 nesta máquina. O tamanho é o entry JS do pacote, bruto e gzip; RSS é o aumento observado após construir o índice.
- A amostra testa recuperação do ID ATLAS, não a correção normativa do texto da resposta.

## Resultados

| Candidato | Licença do pacote | Pergunta exata: cobertura / top 1 | Normalizada: top 1 | Código `question_id`: cobertura / top 1 | Alias: cobertura / top 1 | p95 | Entry gzip | RSS adicional | Construção |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| MiniSearch 7.2.0 | MIT | 100% / 100% | 100% | 100% / 70% | 100% / 0% (1 caso) | 4,977 ms | 18,287 bytes | 14,856,192 bytes | Não registrado |
| FlexSearch 0.8.212 | Apache-2.0 | 100% / 100% | 100% | 100% / 70% | 100% / 100% (1 caso) | 0,237 ms | 17,790 bytes | 3,702,784 bytes | Não registrado |
| Meilisearch | Engine server-side; SDK JS é cliente | Não medido | Não medido | Não medido | Não medido | Não medido | Engine browser não disponível | Não medido | Não medido |

Tempos/RSS são deste processo Node, não de browser, Web Worker, telefone ou modo avião. O único alias amostrado não permite conclusão estatística. Os dois motores recuperaram os três grupos duplicados conflitantes; esses casos devem pedir esclarecimento, sem deixar o ranking escolher a resposta.

Os dois motores encontraram os 10 registros em consultas por código, mas só posicionaram o esperado em primeiro lugar em 7/10. O runtime deve resolver códigos/IDs exatos por igualdade determinística antes da busca textual.

## Decisão

FlexSearch 0.8.212 foi escolhido e aprovado por humano para o runtime: teve o mesmo resultado em perguntas exatas e normalizadas, melhor posição no único alias amostrado, entry gzip ligeiramente menor e RSS menor nesta medição. MiniSearch, embora seja a opção preferida da SPEC de referência, construiu o índice mais rápido. Esta comparação não demonstra equivalência com Meilisearch.

**Decisão humana:** FlexSearch foi aprovado pelo usuário em 2026-11-06. O Chromium 158 passou `960/960` IDs em Web Worker e `960/960` apresentações para resposta, fonte, localizador e passagem local com hashes PDF/OCR. Também passaram os 45 casos com card/foto aplicáveis, a integridade dos 812 resultados que retornaram recorte (812/812) e nove associações explícitas figura-pergunta (9/9), com catálogo de 33 PNGs locais. O fluxo salvou mensagens no IndexedDB, restaurou a conversa após recarga, abriu PDFs completos pela Biblioteca sem pergunta e respondeu offline sem requisições externas. Cinco rotas não têm caso no snapshot; fala humana e dispositivos móveis não foram testados. Evidências em `SEARCH_BROWSER_960_2026-11-06.json`, `CONTENT_PRESENTATION_960_2026-11-06.json` e `BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json`.

Meilisearch fica como incompatível com o runtime frontend-only: o SDK JS opera como cliente de um engine; nenhum engine browser foi incluído em RENATE e servidores remotos/locais são proibidos. A página oficial descreve o SDK browser e direciona para Cloud ou engine auto-hospedado: https://www.meilisearch.com/integrations/javascript.

## Reexecução

```powershell
cd RENATE
npm ci
node --expose-gc scripts/day2_search_benchmark.mjs
```

Saída estruturada: `SEARCH_BENCHMARK_10_2026-11-06.json`. As licenças/versões dos pacotes estão em `node_modules/{minisearch,flexsearch}/package.json`, e as dependências ficam travadas em `package-lock.json`.
