# Complemento de cobertura ATLAS RENATE — 2026-11-07

## Resultado

Foram adicionados 50 registros Q&A próprios do RENATE ao snapshot de execução: 10 para cada uma das cinco rotas que tinham contagem zero. O snapshot importado de 960 registros permanece intacto; o empacotador combina os 960 originais com o complemento, totalizando 1.010 Q&A em `public/renate-pack/atlas.jsonl`.

| Rota | Q&A incluídos |
|---|---:|
| `cbte.cmp.rimfire_sporter` | 10 |
| `cbte.shotgun.automatic_trap` | 10 |
| `cbte.shotgun.issf` | 10 |
| `cbte.shotgun.trap_nacional` | 10 |
| `issf.event.14` | 10 |

## Origem e integridade

- Fonte: `library/ADANA_50_perguntas_regras_tiro_esportivo_2026.md` — SHA-256 `c8e04001456f7a6c8a74a081813e904bc078f25e0e7bdfa7572fc17d27c0923c`.
- Complemento RENATE: `data/imports/atlas_supplement_2026-11-07/atlas_qa_renate_supplement_2026-11-07.jsonl` — 50 registros; SHA-256 `783f9f80b9eb6391e9f0d473ca9493145446c6d0c976d88c7d4451b52424d409`.
- Snapshot ATLAS importado, preservado sem alteração: `data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl` — SHA-256 `c383b6209768606ea0d5b6abf6b20d278abbe43a6fde12bc10184c862bdc7512`.
- Referências foram associadas somente a PDFs/OCRs presentes na Library local do RENATE; os caminhos e hashes locais são validados pelo empacotador. Rótulos de citação sem documento local não foram convertidos em fonte runtime.
- Os localizadores foram transcritos da linha `Base` do Markdown; o empacotamento não fez validação semântica individual de cada localizador contra o texto do OCR.
- Respostas e ressalvas foram transcritas do arquivo fornecido, sem reescrever seu conteúdo; a classificação de rota vem do cabeçalho explícito de cada seção.

## Estado de avaliação

A presença das 50 entradas completa a cobertura de conteúdo das cinco rotas no pacote local. O Golden Set existente continua com 960 casos; não foram criados novos casos de avaliação para estas entradas. Portanto, esta alteração **não declara PASS de busca, apresentação, evidência semântica ou runtime** para as cinco rotas.

A matriz por rota está em `ATLAS_ROUTE_SUPPLEMENT_COVERAGE_2026-11-07.csv`. O empacotamento local concluiu com estado `PASS`, 1.010 Q&A, 23 PDFs e 42 OCRs; SHA-256 do pacote `08c7c59ce6d7f880db2e16a0bd36017705a51a4fa79c65f196b4133f43a97e88`.
