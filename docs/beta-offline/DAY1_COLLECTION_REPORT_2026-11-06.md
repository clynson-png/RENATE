# Relatório de coleta e auditoria — RENATE, Dia 1

**Data:** 2026-11-06  
**Escopo:** consulta/clonagem pontual autorizada para identificar as fontes necessárias às rotas ADANA20 e copiá-las para RENATE.  
**Destino de todas as gravações:** `RENATE/`.  
**Resultado:** inventário estático das 62 rotas concluído; três PDFs órfãos de OCR foram encontrados e copiados após autorização específica do usuário. A Library agora tem 31 PDFs e 50 OCR/textos, com todos os 31 PDFs pareados. Implementação do PWA ainda não iniciada.

## Conteúdo copiado e verificado

- 31 PDFs em `library/documents/`.
- 50 arquivos OCR/texto em `library/ocr/`, todos cobertos pela aprovação humana de uso registrada pelo usuário.
- A auditoria RENATE-only valida 81 registros de manifesto (31 PDFs e 50 OCRs), hashes locais e o vínculo de cada OCR a um PDF local. O relatório JSON é `data/imports/day1_2026-11-06/pretests/day1_static_package_audit_2026-11-06.json`.
- Os três arquivos adicionais foram localizados por nome na busca especificamente autorizada e copiados para suas pastas RENATE. SHA-256: WSPS Tracked Changes `9b5dd0b0dc2f740df654763b8bf38f088a7b136241dabc0ccca902f2a6951abd`; Carabina WRABF 30/01/2020 `250e57ef214c3f840c2992118f718f403b271f2503b5f5260ac7501f21dcdb46`; Duelo 20 Segundos 02/01/2025 `0ba1db11f0f5a45cfa75d5209d1195857bf54ccb957adbdc4f72587b1b714f3a`.
- Os 11 pareamentos web anteriormente registrados permanecem documentados em `sources/web_pdf_ocr_collection_audit_2026-11-06.csv` e `sources/web_pdf_ocr_hash_verification_2026-11-06.csv`; não foram refeitos nesta retomada.
- O Regulamento Geral de Tiro ao Prato 2025/2028 revisado em 19/12/2024 é a edição oficial mais recente da CBTE localizada para o ciclo; o PDF e o texto estão pareados sob `ADANA-SRC-AA64B7BC76972EE0`.
- 960 Q&A do ATLAS, com identificadores, respostas, status originais e referências preservados. Todos são considerados revisados e aprovados por humano em ADANA20, conforme decisão do usuário.
- Os 43 registros sem classificação de rota no snapshot original foram agrupados em `renate.alphaomega` (ALPHAOMEGA) por associação com a pergunta. Não há revisão de conteúdo pendente; trata-se de organização de rota no RENATE.
- Criado o Golden Set referencial `data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json`: 960 casos por ATLAS ID/hash, sem duplicar pergunta/resposta e sem participação no runtime. Três grupos de perguntas iguais com respostas conflitantes têm gabarito determinístico `ASK_FOR_CLARIFICATION`.
- Criado `atlas/atlas_source_bindings_2026-11-06.jsonl` com 2.233 vínculos de source IDs a PDFs/OCRs locais; auditoria encontrou zero vínculo sem arquivo RENATE correspondente.

## Governança e escopo

O registro de auditoria cobre 62 identidades e 62 contratos correspondentes. Por rota, registra status de aprovação/proteção original de ADANA20, source IDs, cópias locais, cobertura OCR e quantidade/classificação dos Q&A ATLAS associados. A aprovação ATLAS compõe a governança RENATE sem alterar estados ou LOCKs de ADANA20. ALPHAOMEGA é uma identidade suplementar RENATE, fora das 62 identidades ADANA20.

Em 2026-11-06, o usuário confirmou que não há restrição legal à redistribuição dos documentos coletados. Avisos e conteúdo dos originais foram preservados. A autorização de consulta/cópia era específica para o Dia 1; não houve alteração de ADANA20.

## Artefatos principais

- [`ROUTE_SOURCE_AUDIT_2026-11-06.md`](ROUTE_SOURCE_AUDIT_2026-11-06.md) — resumo de escopo, cópias, governança composta e limites.
- [`route_audit_62_2026-11-06.csv`](../../data/imports/day1_2026-11-06/governance/route_audit_62_2026-11-06.csv) — uma linha por rota ADANA20.
- [`route_governance_composite_63_2026-11-06.csv`](../../data/imports/day1_2026-11-06/governance/route_governance_composite_63_2026-11-06.csv) — 62 rotas ADANA20 mais ALPHAOMEGA como rota suplementar RENATE.
- [`renate_alphaomega_route_2026-11-06.json`](../../data/imports/day1_2026-11-06/governance/renate_alphaomega_route_2026-11-06.json) — rota suplementar.
- [`alphaomega_question_association_2026-11-06.jsonl`](../../data/imports/day1_2026-11-06/atlas/alphaomega_question_association_2026-11-06.jsonl) — 43 Q&A agrupados na rota ALPHAOMEGA.
- [`manifest.csv`](../../library/manifest.csv) — manifesto de PDFs e OCRs.
- [`route_sources_hash_verification_2026-11-06.csv`](../../data/imports/day1_2026-11-06/sources/route_sources_hash_verification_2026-11-06.csv) — verificação individual dos hashes.
- [`pdf_ocr_coverage_gaps_2026-11-06.csv`](../../data/imports/day1_2026-11-06/sources/pdf_ocr_coverage_gaps_2026-11-06.csv) — registro de lacunas, agora vazio após o fechamento dos 11 pareamentos.
- [`web_pdf_ocr_collection_audit_2026-11-06.csv`](../../data/imports/day1_2026-11-06/sources/web_pdf_ocr_collection_audit_2026-11-06.csv) — fonte web, edição, método, caminhos e hashes dos 11 textos gerados.
- [`web_pdf_ocr_hash_verification_2026-11-06.csv`](../../data/imports/day1_2026-11-06/sources/web_pdf_ocr_hash_verification_2026-11-06.csv) — confirmação SHA-256 dos PDFs baixados e OCRs resultantes.
- [`EXPORT_AUDIT.md`](EXPORT_AUDIT.md) — trilha resumida dos itens coletados e limites.

## Testes e situação

Executada a auditoria estática local com `python RENATE\scripts\audit_day1_package.py`: `PASS`, 17 JSON, 3 JSONL, 31 PDFs, 50 OCRs, 960 Q&A, 960 casos Golden Set e 2.233 vínculos locais. A allowlist cobre todos os 81 artefatos; edições, licença/status e aprovação OCR estão preenchidos e verificados. Gate R1 está fechado para o snapshot de dados. Não foram executados testes de aplicação, replay, serviços, API ou runtime. O Gate 0 de ADANA20 permanece histórico; não foi reexecutado. Skin RENATE e aplicação PWA não iniciadas.

**Observação de proveniência:** o Planejamento Técnico CAR/PST 2026 aparece associado no snapshot à rota `cbte.shotgun.trap_nacional`; essa associação deve ser revisada antes de usar o planejamento como evidência para Trap Nacional.

**Próximo passo:** iniciar a implementação independente segundo SPEC v1.8; R1 está fechado para o pacote de dados.
