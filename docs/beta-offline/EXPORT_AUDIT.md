# RENATE — auditoria de exportação do Dia 1

**Data:** 2026-11-06  
**Estado do pacote de dados:** `PASS`; Gate R1 fechado para o snapshot, allowlist e corpus de entrada. O app e o bundle PWA ainda não existem e seguem como trabalho posterior.  
**Destino:** somente `RENATE/`.

## Autorizações e preservação

- A autorização geral pontual do Dia 1 foi exercida e encerrada. Nenhum arquivo do ADANA principal foi alterado.
- Nesta retomada, o usuário autorizou especificamente a busca e cópia de três PDFs órfãos de OCR. Os três foram encontrados por busca nominal limitada e copiados apenas para `RENATE/library/documents/`.
- A autorização não cobre outros arquivos. Não ocorreu coleta adicional além desses três PDFs.

## Corpus PDF/OCR

- `library/manifest.csv`: 31 PDFs e 50 OCR/textos, 81 registros. Todos os PDFs têm OCR local ligado por `document_source_id` e SHA-256.
- `data/imports/day1_2026-11-06/sources/source_metadata_allowlist.json` contém 81 registros e corresponde aos 81 artefatos do manifesto. Todos têm caminho local, hash e status de redistribuição; os OCRs têm aprovação humana registrada.
- Arquivos novos: WSPS Rulebook Tracked Changes (hash `9b5dd0b0dc2f740df654763b8bf38f088a7b136241dabc0ccca902f2a6951abd`); Carabina WRABF, atualização 30/01/2020 (hash `250e57ef214c3f840c2992118f718f403b271f2503b5f5260ac7501f21dcdb46`); Duelo 20 Segundos, atualização 02/01/2025 (hash `0ba1db11f0f5a45cfa75d5209d1195857bf54ccb957adbdc4f72587b1b714f3a`).
- As edições dos 31 PDFs foram registradas a partir dos próprios PDFs/OCRs locais. A edição impressa e o título do WSPS Tracked Changes aparecem separadamente para preservar a discrepância presente no documento.
- Os 11 pareamentos web anteriormente registrados permanecem documentados em `data/imports/day1_2026-11-06/sources/`; não foram refeitos nesta retomada.

## Q&A, governança e Golden Set

- O snapshot local contém 960 Q&A ATLAS, aprovados pelo usuário como fonte confiável para RENATE. Os estados e textos originais permanecem preservados.
- `data/imports/day1_2026-11-06/atlas/atlas_source_bindings_2026-11-06.jsonl` tem 2.233 vínculos de IDs de fonte a PDFs/OCRs em `RENATE/library/`; nenhum vínculo ficou sem resolução local. O runtime usa este sidecar, não caminhos de origem guardados no ATLAS.
- O Golden Set `data/imports/day1_2026-11-06/pretests/atlas_golden_set_manifest_2026-11-06.json` contém 960 casos por ID e hash; não duplica perguntas/respostas e não é lido pelo runtime. Três grupos de perguntas normalizadas com respostas distintas esperam pedido de esclarecimento.
- Os 13 registros de respostas candidatas de pretestes estão excluídos do runtime por estarem em estado `CANDIDATE_ONLY_NOT_RUNTIME_APPROVED`. Rollups importados de P4 e P5: 12/12 PASS cada.
- A associação ALPHAOMEGA mantém 43 registros sem rota original qualificada; não altera as 62 rotas de origem.

## Verificação executada

Comandos reproduzíveis, executados localmente a partir do workspace com toda leitura/escrita restrita a RENATE:

```powershell
python RENATE\scripts\day1_reconcile.py
python RENATE\scripts\audit_day1_package.py
```

Resultado: `PASS`; 31 PDFs + 50 OCRs; 81/81 artefatos allowlisted; nenhum caminho/hash/licença/edição ou aprovação OCR ausente; 960 registros ATLAS, 960 casos Golden Set e 2.233 vínculos locais sem pendência; 62 rotas; P4 e P5 com 12/12 PASS; 17 JSON e 3 JSONL válidos; seis assets visuais únicos íntegros. Relatório JSON em `data/imports/day1_2026-11-06/pretests/day1_static_package_audit_2026-11-06.json`.

**Gate R1:** fechado para o pacote de dados. Este aceite valida estrutura, caminhos, allowlist e hashes; não testa aplicação, respostas em runtime ou bundle PWA. Nenhum teste de aplicação, replay, API ou serviço foi executado. Os logs Gate 0 são históricos e não foram reexecutados.
