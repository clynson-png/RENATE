# Auditoria de prioridade dos cards de equipamento — 2026-11-08

## Escopo

Implementada no seletor de apresentação do Web Worker em `src/atlasSearch.worker.js`. A mudança faz cartões de equipamento aparecerem antes do cartão de prova quando a pergunta inclui termos de medida/equipamento. Perguntas sem prova nomeada mostram somente cartões de equipamento, mantendo os escopos individuais.

Não foram alterados os IDs/aliases do roteador, registros de prova, conteúdo normativo ou escopos originais de `cards.json`. Aliases usados apenas na apresentação dos cards incluem `CBTE Trap`, `CBTE Fossa`, `CBTE Skeet`, `national trap`, `automatic trap`, `CBTE WRABF`, `benchrest`, `Duelo/Duel` e nomes em inglês das provas. O cartão CBTE de Trap Nacional pode ser apresentado em pergunta de equipamento sobre Fossa por solicitação explícita; nessa situação recebe aviso de que suas regras só se aplicam a Trap Nacional CBTE. `SHOTGUN_TRAP_SKEET_DIMENSIONS_V1` continua identificado como suplemento visual, sem autoridade normativa própria.

## Gatilhos cobertos

- Medidas: `dimensões`, `caixa`, `medidas`, `largura`, `comprimento`, `espessura`, `altura`; `dimensions`, `box`, `measurements`, `width`, `length`, `thickness`, `height`.
- Carabina: `carabina`, `rifle`, `casaco`, `jacket`, `sapato/shoes`, `calça/trousers/pants`, `bandoleira/sling`, armamento e apoios.
- Pistola: `pistola/pistol`, `grip`, `punho`, revólver/revolver, caixa/box.
- Espingarda: `shotgun`, `pump`, `trap`, `skeet`, `fossa`, armamento, apoio/suporte e termos de medida.
- Provas CBTE requeridas: `CBTE_WRABF_EQUIPMENT_RESTS_V1`, `CBTE_DUELO_20S_10M_EQUIPMENT_CLASSIFICATION_V1`, `CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1` e `SHOTGUN_TRAP_SKEET_DIMENSIONS_V1`, com aliases em inglês para os nomes das provas.

## Verificação focada

O build de produção passou e o worker compilado foi executado pelo navegador Chromium contra o serviço HTTPS local `https://127.0.0.1:4173/` (HTTP 200). O worker carregou 1.104 Q&A, 13 respostas pretest aprovadas, 27 documentos e 15.174 passagens locais. Foram verificadas 29 perguntas, incluindo cada termo de medida isolado em português e inglês.

| Checagem | Resultado |
|---|---|
| Termos de medida isolados retornam cartões de equipamento sem cartões de prova | PASS |
| Carabina/rifle e pistola/pistol filtram o tipo de equipamento | PASS |
| Os quatro cards CBTE solicitados aparecem nas consultas de equipamento | PASS |
| WRABF, Duelo e Trap Nacional apresentam equipamento antes dos cards da prova | PASS |
| Aliases CBTE Trap, Fossa, Skeet e nomes ingleses apresentam os cards de rota esperados | PASS |
| Fossa apresenta o aviso de escopo do card CBTE Trap Nacional | PASS |
| Consulta de shotgun não puxa o card ISSF de fita de Moving Target | PASS |
| WSPS P5 apresenta especificação de pistola antes do card P5 | PASS |
| Controle ISSF mantém `issf.event.07` | PASS |
| Controle WSPS P5 mantém a lista de 23 IDs de rota anterior | PASS |

## Limites desta evidência

Esta é uma validação focada de build e seleção/ordem dos cards no Web Worker. Não foi executada a regressão global de respostas; não representa aceite visual em Android/iPhone nem aprovação humana de conteúdo. A pasta RENATE não tem metadata Git disponível neste workspace, então não há diff ou commit baseline para reportar. O texto e as referências normativas dos cartões existentes foram preservados. O aviso do suplemento visual e seu estado `NOT_RECORDED_IN_SOURCE_CATALOG` continuam válidos.
