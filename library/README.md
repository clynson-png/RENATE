# RENATE Library — corpus local

Esta pasta contém a biblioteca documental independente do RENATE. No pacote Git, seu caminho é `library/`.

## Conteúdo auditado no Dia 1 (2026-11-06)

- `manifest.csv` tem 31 PDFs e 50 arquivos OCR/texto; cada um dos 31 documentos está pareado a pelo menos um OCR. O manifesto possui 81 registros e vincula OCR ao PDF pelo `document_source_id` e pelo SHA-256 do PDF.
- A auditoria reproduzível está em `../scripts/audit_day1_package.py`; relatório mais recente em `../data/imports/day1_2026-11-06/pretests/day1_static_package_audit_2026-11-06.json`.
- Três PDFs foram copiados nesta execução após autorização específica do usuário: WSPS Tracked Changes, Carabina WRABF (30/01/2020) e Duelo 20 Segundos (02/01/2025). Os caminhos e hashes estão no manifesto.
- Os 11 pareamentos anteriormente concluídos a partir de fontes públicas oficiais permanecem registrados separadamente nos relatórios `web_pdf_ocr_collection_audit_2026-11-06.csv` e `web_pdf_ocr_hash_verification_2026-11-06.csv`.
- Todos os OCRs importados são considerados confiáveis e aprovados por humano por decisão explícita do usuário. O vínculo ao PDF, hashes, edição e localizadores deve ser preservado.
- O usuário confirmou que não há restrição legal à redistribuição dos materiais autorizados. Avisos e conteúdo dos arquivos-fonte foram preservados.
- A execução estática encontrou campos de edição ainda ausentes em alguns registros preexistentes; estão listados no relatório do Dia 1 e impedem considerar encerrada toda a proveniência editorial.

## Escopo e manutenção

Inclua somente documentos que sejam necessários e efetivamente referenciados. Não importe a Library inteira de ADANA20. Não remova avisos ou conteúdo dos originais. Não trate hashes, OCRs ou aprovação humana de ATLAS como substitutos de edição, localizador e vínculo de fonte. Toda nova coleta exige autorização específica e deve ser registrada dentro de RENATE.

```text
library/
  README.md
  manifest.csv
  documents/<source_id>/<document>.pdf
  ocr/<source_id>/<text-or-ocr-file>.txt
```
