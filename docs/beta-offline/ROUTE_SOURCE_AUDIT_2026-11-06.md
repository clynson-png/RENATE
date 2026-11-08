# RENATE — auditoria de rotas e fontes, Dia 1 (2026-11-06)

## Escopo e critério

Inventário estático das 62 identidades de rota do registro de ADANA20, contratos correspondentes, fontes citadas e Q&A do ATLAS importados para RENATE sob a autorização específica de coleta do Dia 1. Nenhum arquivo de ADANA20 foi alterado. Os estados originais do registro e dos contratos são preservados; a aprovação humana do ATLAS acrescenta uma camada de governança exclusiva do RENATE e não altera aprovação, proteção ou LOCK em ADANA20.

Todos os Q&A do ATLAS (960 registros) são considerados aprovados por decisão humana do usuário em 2026-11-06 e aceitos como evidência de RENATE, mantendo campos, identificadores e referências originais. Q&A compartilhados permanecem associados a cada rota indicada pela própria fonte de mapeamento. Os 43 sem qualificação de rota em ADANA20 também estão revisados/aprovados; foram agrupados na rota complementar RENATE `ALPHAOMEGA` pela associação com a pergunta.

## Resultado da coleta

- Rotas auditadas: 62; contratos correspondentes: conforme registro de contratos importado.
- Q&A ATLAS associados: 57 rotas com ao menos um registro; cinco sem associação direta no snapshot — `cbte.cmp.rimfire_sporter`, `cbte.shotgun.automatic_trap`, `cbte.shotgun.issf`, `cbte.shotgun.trap_nacional` e `issf.event.14`.
- Na auditoria inicial: 28 PDFs e 50 arquivos OCR/texto. Na retomada do Dia 1, após autorização específica, foram adicionados três PDFs para OCRs órfãos. O estado atual do manifesto é 31 PDFs e 50 OCR/textos.
- Pareamento PDF/OCR atual: 31 dos 31 PDFs têm texto correspondente. Os 11 textos extraídos de PDFs oficiais e seus hashes seguem documentados nos relatórios indicados abaixo; os três PDFs adicionados na retomada têm hashes no `library/manifest.csv` e em `EXPORT_AUDIT.md`.
- Hashes: verificação individual registrada em `../../data/imports/day1_2026-11-06/sources/route_sources_hash_verification_2026-11-06.csv`.
- Q&A do ATLAS: 960 registros, todos aprovados por humano. Os 43 sem classificação ADANA20 foram agrupados na rota suplementar RENATE `ALPHAOMEGA` por associação com a pergunta; veja `alphaomega_question_association_2026-11-06.jsonl` e `governance/renate_alphaomega_route_2026-11-06.json`.
- A associação ALPHAOMEGA organiza conteúdo já revisado; não é uma revisão de conteúdo pendente nem modifica as 62 rotas ADANA20.
- O manifesto da Library discrimina cada artefato e registra caminho, hash, tipo, status declarado pelo usuário sobre redistribuição e aprovação de OCR.

## Governança composta RENATE

`route_audit_62_2026-11-06.csv` registra por rota: status de ADANA vindo separadamente do registro e do contrato, IDs de fonte, arquivos locais, quantidade de Q&A associados, classificação exclusiva/compartilhada e camada de aprovação ATLAS. O campo `renate_composite_governance_status` combina esses elementos sem converter a aprovação do ATLAS em LOCK de ADANA. A disponibilidade de Q&A aprovado não substitui a verificação de documento/localizador para respostas normativas que precisem de citação textual.

## Limites do resultado

A classificação original do ATLAS é preservada. Os 43 registros sem qualificação de rota em ADANA20 são conteúdo aprovado e revisado; RENATE os associa pela pergunta à rota suplementar `ALPHAOMEGA`. A coleta comprova cópia e integridade por hash, não altera status das rotas ADANA20. Os 11 PDFs antes sem OCR agora têm texto pareado a partir de PDFs oficiais com hash idêntico; nenhuma edição foi associada por aproximação. Observação: `Planejamento Técnico CAR/PST 2026` consta associado no snapshot a `cbte.shotgun.trap_nacional`, associação a revisar antes do uso probatório.
