# RENATE — fechamento escopado do Gate R5

**Data:** 08/11/2026  
**Estado:** `R5_LOCAL_SCOPED_PASS`  
**Limite:** este resultado libera somente o pacote local listado abaixo. Não é aprovação global da apresentação. A usuária aprovou instalação e consulta offline do pacote escopado no Android; isso satisfaz o gate local para continuar a configuração online autorizada anteriormente.

## Pacote aprovado para distribuição local

- `npm run build`: `PASS`.
- Pacote corrigido: 1.106 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 131 cards aprovados por hash e 34 recortes. SHA-256 do pacote: `5627f767a3ba3f24fadc2c01173ae5768e558aebb58afb0cff797ae5cddfbd55`; `cards.json`: `d1e560c39fd169e52c57b235db5ebce5b71b079ef8a1aaed1fb497ec868103ef`.
- Regressão runtime `node scripts/run_qa_reconciliation_regression.mjs`: `PASS` 1.106/1.106, sem fixar o ID selecionado e com zero chamadas externas.

| Grupo | Resultado |
|---|---:|
| Snapshot original | 960/960 |
| Suplemento | 50/50 |
| Desempate | 94/94 |
| Duas Q&A posteriores | 2/2 |
| Total atual | 1.106/1.106 |

Seleção, pertinência do Q&A, links normativos, hashes PDF/OCR, localizadores, vínculos de passagens e ordem compacta passaram em todos os casos. As duas entradas posteriores têm manifesto referencial separado em `tests/golden/later_qa_2_2026-11-08.json`.

O build compara cada card corrente por ID/grupo/hash ao registro principal `CARD_HUMAN_APPROVAL_ALL_2026-11-08.json`. A usuária esclareceu que os pré-aprovados são os cards de sapato/equipamento: os 13 cards de equipamento já constam aprovados por hash e permanecem incluídos. Seis cards de qualificação/programa haviam sido incluídos por interpretação equivocada; o suplemento foi revogado e preservado como histórico em `CARD_HUMAN_APPROVAL_SUPPLEMENT_6_2026-11-08.json`. A auditoria corrente confirma 131/131 ativos aprovados e seis exclusões sem decisão vigente. Os quatro finais CBTE indicados pela usuária estão ausentes do catálogo ativo. Detalhes em `CARD_REVIEW_STATUS_2026-11-08.json` e no manifesto do pacote.

## Limite conhecido de apresentação — adiado para a próxima versão

`npm run test:browser` concluiu a busca dos 960 casos com seleção, resposta, fontes, localizadores e proveniência local em 960/960. Os cinco probes de cards aprovados e os quatro probes de rota Duelo 25 m / ISSF Trap-Skeet passaram. A camada ampla de apresentação permanece `FAIL`: 880/957 casos com rota configurada receberam card e asset conforme o atual verificador, com 50 casos registrados e múltiplas razões em alguns deles. O relatório individual está em `CONTENT_PRESENTATION_960_2026-11-08.json`.

O escopo adiado inclui consultas genéricas `renate.alphaomega` sem card específico; associações de cards Rimfire em perguntas F-Class centerfire; associações de eventos muito amplas em consultas CBTE/ISSF/WSPS; cards de prova não chamados em alguns casos; e ocorrências de cards Moving Target/Skeet não pertinentes. Não foram alteradas perguntas, respostas, IDs/aliases de rota ou a sequência conversacional para sanar esses itens. A lista completa de IDs, cards chamados e motivos está no JSON da regressão browser e foi registrada na SPEC v3.0, aditivo 12.1.

O resultado `R5_LOCAL_SCOPED_PASS` não transforma esses casos em PASS nem afirma 315/315. Eles ficam anotados para a próxima versão, conforme o escopo reduzido solicitado.

## Gates restantes

- Aceite humano Android de instalação e consulta offline: `PASS` informado pela usuária em 08/11/2026. Registro: `OFFLINE_HUMAN_ACCEPTANCE_2026-11-08.md`.
- iPhone, quota, atualização hospedada e revisão em aparelhos além do escopo Android aprovado seguem pendentes; TTS PT-BR segue bloqueado e a leitura textual permanece disponível.
- O projeto Supabase hospedado foi identificado (`lqcckwnewvvifhjxdbxo`), mas a CLI ainda não autenticou, e nenhuma migration foi aplicada. A migration local e o fluxo inicial de lead estão preparados.
- O projeto Vercel `clynson-pngs-projects/renate` está vinculado ao GitHub e recebeu `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente Production; Node 24.x e build Vercel de produção passaram, mas nenhuma versão foi publicada. O teste remoto de RLS, a retenção e a mitigação contra abuso ainda são gates.
- Estado detalhado de serviços, permissões, credenciais e evidências: `ONLINE_SERVICE_REGISTRY_2026-11-08.md` e `SUPABASE_LEADS_ADMIN_GUIDE.md`.

Não houve configuração de serviços externos durante esta execução.
