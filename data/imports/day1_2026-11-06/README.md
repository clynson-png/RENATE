# RENATE — snapshot de coleta do Dia 1 (2026-11-06)

Snapshot criado sob autorização pontual do usuário para coleta/clonagem de objetos necessários de ADANA20 para RENATE. Todas as gravações permanecem na pasta `RENATE/`; ADANA20 não foi alterado.

## Conteúdo

- `governance/route_audit_62_2026-11-06.csv` e `.json`: status original do registro e dos contratos, IDs de fontes, documentos/OCRs locais e Q&A ATLAS por rota para todas as 62 identidades.
- `governance/renate_alphaomega_route_2026-11-06.json`: rota suplementar RENATE `ALPHAOMEGA`, sem impacto nas identidades ADANA20.
- `atlas/atlas_qa_route_candidates_2026-11-06.jsonl`: 960 Q&A importados, com dados e classificação original preservados.
- `atlas/alphaomega_question_association_2026-11-06.jsonl`: 43 Q&A sem classificação original, revisados/aprovados em ADANA20 e associados por pergunta ao agrupamento ALPHAOMEGA.
- `sources/`: allowlist, manifesto de cópia e verificação hash.
- `cards/`, `pretests/`, `evidence/`, `chatbot-candidates/`, `decisions/` e `visual-reference/`: snapshots e projeções preservados como objetos de entrada do RENATE. O ATLAS é a fonte direta do runtime; o Golden Set em `pretests/` é somente um manifesto de teste por ID/hash, sem duplicar perguntas/respostas.

## Integridade e decisões

O snapshot inicial trouxe 28 PDFs e 39 OCR/textos, com 67/67 hashes válidos. Em continuação autorizada em 2026-11-06, 11 PDFs sem pareamento foram obtidos de fontes oficiais públicas e comparados byte a byte com os PDFs já em RENATE; foram gerados 11 textos extraídos da camada textual. Em retomada posterior, o usuário autorizou especificamente a busca e cópia de três PDFs correspondentes aos OCRs órfãos; foram adicionados apenas esses arquivos a RENATE. O manifesto atual tem 31 PDFs e 50 OCR/textos (81 registros). Os detalhes históricos dos 11 downloads permanecem nos relatórios `sources/web_pdf_ocr_collection_audit_2026-11-06.csv` e `sources/web_pdf_ocr_hash_verification_2026-11-06.csv`.

Detalhes de URL, edição, método e hashes: `sources/web_pdf_ocr_collection_audit_2026-11-06.csv` e `sources/web_pdf_ocr_hash_verification_2026-11-06.csv`. `sources/pdf_ocr_coverage_gaps_2026-11-06.csv` agora não contém lacunas. O usuário confirmou que não há restrição legal à redistribuição dos materiais e que os OCRs são confiáveis e aprovados por humano. Avisos originais foram preservados.

Observação: o Planejamento Técnico CAR/PST 2026 consta associado no snapshot à rota `cbte.shotgun.trap_nacional`, embora o título indique Carabina/Pistola; não usar como evidência dessa rota até revisar a associação.

Os status de governança ADANA20 são registrados como fatos importados; a camada ATLAS e `ALPHAOMEGA` compõem apenas a governança RENATE. Nenhuma classificação ou aprovação RENATE reescreve os registros de origem.

Nenhum teste de aplicação, replay, serviço ou runtime foi executado.
