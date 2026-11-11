# Briefing de retomada — card geral de equipamentos WSPS

**Data:** 11/11/2026  
**Workspace:** `E:\ADANA 2.0\RENATE`  
**Estado:** card e chamada genérica concluídos; build e verificação runtime focada passaram em 11/11/2026.

## Pedido em andamento

Criar e chamar, na rota genérica, um card específico WSPS para cadeira de rodas, cadeira de tiro, banco baixo/alto, mesa de tiro, apoio de cotovelo de joelhos (“disco”/bloco de 10 cm), posição do bib number, encosto, garfo/fork/yoke e molas. Explicar os significados de A/B/C e a/b sem confundir as classificações. O card precisa informar dimensões e regras em texto mesmo quando não houver foto, e usar recortes locais das páginas WSPS disponíveis.

Complemento da usuária: incluir a regra dos **150 cm**, com seu item normativo. A fonte confirma WSPS 3.7.2: para tiro sentado em cadeira de tiro, exceto banco alto, a linha central do cano não pode exceder 150 cm **medidos do piso**. Não descrever isso como distância entre o cano e o banco.

## Estado alcançado

- Card criado em `scripts/build_local_pack.mjs`, ID `WSPS_GENERAL_EQUIPMENT_CHAIRS_TABLE_BACKREST_SH2_V1`.
- O conteúdo traz regras e explicações para cadeiras/bancos, cadeira de rodas, encosto e scores A/B/C, bib, mesas, apoio ajoelhado de 10 cm e suporte SH2/yoke e subclasses a/b.
- Referências locais registradas com edição, SHA-256 e localizadores:
  - WSPS Rulebook 2026 vFinal: itens 2.11.6, 3.7.1–3.7.13.5, 3.8.1–3.8.2 e 3.9.1–3.9.13.3.
  - WSPS Rulebook Appendices 2026 vFinal: Appendix 5 §§1–5, pp. 24–28.
- O recorte da p. 30 mostra expressamente o item 3.7.2 e o limite 150 cm medido do piso. Outros recortes foram gerados para bib (p. 16), cadeira/banco alto (p. 30), apoios e cadeira de rodas (p. 31), almofada/ângulo/encosto flexível (p. 32), encosto e score A/B/C (p. 33), mesa/bloco ajoelhado (p. 35) e mesa de pistola (p. 36). Recortes de garfo/mola das pp. 24–28 do Appendix 5 já existiam.
- Os novos recortes foram abertos e inspecionados visualmente. Uma versão inicial do recorte da p. 31 estava cortada; foi refeita em página completa e reinspecionada. O recorte da p. 32 também foi acrescentado para mostrar o limite de 8 cm do encosto flexível.
- Os Q&A e IDs de rota não foram editados. A mudança do worker foi limitada ao reconhecimento de termos de equipamento e à seleção do novo card genérico; o filtro busca evitar que consultas explicitamente ISSF/CBTE recebam o card WSPS.
- A solicitação direta de criação e chamada do card foi registrada como aprovação vinculada ao hash exato em `docs/beta-offline/CARD_HUMAN_APPROVAL_WSPS_GENERAL_EQUIPMENT_2026-11-11.json`.
- `npm.cmd run build` concluiu com sucesso após essa aprovação: pacote com 1.106 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 132 cards, 14 cards de equipamento e 40 recortes. SHA-256 do pacote: `90380f270a924dbab27568511c3ed17cde4c90ee9b14269cce5bbca893e11b2f`. Build Vite e geração do service worker também terminaram.
- Hash do conteúdo aprovado do novo card: `6d129c60cdc0ea168fa6ed64afc4be64247e02b45fe5c3f7da674624e62d555c`.
- Na retomada, a regex ampla de equipamento foi revertida para sua forma anterior; os novos termos ficaram em um classificador WSPS isolado, evitando alterar intenção compartilhada de ISSF/CBTE.
- A primeira versão do teste focado revelou fan-out indevido: consultas genéricas recebiam cards de equipamento de outras provas e especificações de pistola ISSF. A correção ficou no ramo genérico do worker: sem código explícito de prova WSPS, palavras genéricas como “rifle” não desviam a pergunta de equipamento para cards de prova; as consultas de equipamento deste conjunto retornam apenas o card geral WSPS. Um código explícito (ex.: R7) mantém a composição do card de equipamento seguido pelo card da prova, sem alterar Q&A.
- Build final após a correção: **PASS**, 1.106 Q&A, 132 cards, 40 recortes e pacote com SHA-256 `90380f270a924dbab27568511c3ed17cde4c90ee9b14269cce5bbca893e11b2f`. Worker compilado em `dist/assets/atlasSearch.worker-BUn2TA0U.js`; service worker cache `ebb0cc77701b4fed`.
- Verificação runtime final: **15/15 PASS**, zero requests externos. Incluiu uma pergunta individual para cada tópico: cadeiras de rodas, cadeira de tiro, banco baixo, banco alto, mesa de tiro, apoio de joelho de 10 cm, posição do bib number, encosto, fork/garfo, rigidez da mola, letras A/B/C e subclasses a/b da mola. Confirmou recortes tópicos, somente o card geral nas consultas genéricas, card geral antes do card de qualificação R7 e ausência do card WSPS nas consultas explicitamente ISSF e CBTE. Relatório: `docs/beta-offline/WSPS_GENERAL_EQUIPMENT_RUNTIME_2026-11-11.json`.

## Arquivos alterados ou gerados nesta tarefa

- `scripts/build_local_pack.mjs` — card, registro de aprovação e inclusão do manifesto/recortes nos hashes de entrada do pacote.
- `src/atlasSearch.worker.js` — palavras-chave genéricas WSPS, isolamento por autoridade e seleção de recortes relacionados ao tópico.
- `scripts/render_rule_page_crops.py` — definições dos recortes normativos novos.
- `data/imports/day1_2026-11-06/figure-crops/manifest.json` e os PNGs homônimos novos no diretório `figure-crops/`.
- `docs/beta-offline/CARD_HUMAN_APPROVAL_WSPS_GENERAL_EQUIPMENT_2026-11-11.json`.
- `scripts/test_wsps_general_equipment_card_runtime.mjs` e `docs/beta-offline/WSPS_GENERAL_EQUIPMENT_RUNTIME_2026-11-11.json` — verificação focada e evidência runtime.
- `public/renate-pack/`, `dist/` e o manifesto do pacote — regenerados pelo build.
- Este briefing.

## Estado de fechamento

- Verificações solicitadas no briefing foram concluídas. Não foi executada regressão global nem houve edição de Q&A; a validação foi somente o runtime do card WSPS e seus bloqueios explícitos de autoridade.
- As mudanças preexistentes identificadas antes da retomada foram preservadas: `package.json`, `public/renate-pack/manifest.json`, partes anteriores de `scripts/build_local_pack.mjs` e `src/atlasSearch.worker.js`, `docs/beta-offline/PROOF_CARD_CALLABILITY_RUNTIME_2026-11-10.json` e `scripts/verify_proof_cards_runtime.mjs`.
- Nenhum commit, push ou deploy GitHub/Vercel foi feito.

## Limites para a retomada

- Não alterar texto/IDs de Q&A nem a identidade das rotas sem nova instrução.
- Não extrapolar medida para item sem limite dimensional explícito. Para banco baixo, o card informa que WSPS não cria uma categoria dimensional independente; cita a regra geral da cadeira e WSPS 3.7.2.
- A tabela de pistola (30 × 30 cm, altura máxima 100 cm) é condicional à autorização da Jury/Controle de Equipamento; não generalizar como permissão irrestrita.
- A/b são subclasses SH2 para seleção de mola: a = fraca/branca, flexibilidade mínima 35 mm; b = forte/preta, mínima 25 mm. A/B/C são scores de altura livre visível do encosto.
- O runtime focado está fechado em PASS conforme o relatório citado. Não inferir esse resultado como aprovação de outras rotas ou cards.
