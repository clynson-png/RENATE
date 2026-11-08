# Fechamento focado dos 17 casos sem card — 2026-11-08

## Resultado

**PASS focado: 17/17 cards esperados apresentados** pelas perguntas originais no worker local, sem fixar o ID selecionado e sem chamadas externas. Evidência por caso em [`CARD_GAP_RUNTIME_RETEST_2026-11-08.json`](CARD_GAP_RUNTIME_RETEST_2026-11-08.json). O teste cobre os 17 casos que estavam registrados como `APPLICABLE_CARD_NOT_PRESENTED` no relatório global anterior; ele não reexecuta as outras dimensões nem substitui a regressão de 1.104 perguntas, que permanece com status global FAIL até replay completo.

| Casos | Card apresentado |
|---|---|
| CBTE-ARB-006:A03 | `cbte.cma.10m:qualification` |
| ISSF-105:A01; ISSF-123:A01/A02; ISSF-126:A01; ISSF-128:A01; ISSF-131:A01; ISSF-132:A01; ISSF-133:A01; ISSF-136:A01; ISSF-150:A01 | `ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1` |
| ISSF-268:A01 | `ISSF_MOVING_TARGET_SLING_RULE_V1` |
| WSPS-SRC-181:A01 | `WSPS_PARATRAP_ADAPTIVE_SUPPORT_V1` |
| WSPS-SRC-201/A01; WSPS-SRC-202/A01; WSPS-SRC-204/A01 | `WSPS_PROGRAM_OF_EVENTS_V1` |
| RENATE:CMP-RIMFIRE:001:A01 | `cbte.cmp.rimfire_sporter:qualification` |

## Correção de apresentação

Os cards de CMA 10 m e Rimfire Sporter já existiam. Quando um Q&A exato era respondido, o compositor substituía o route_id registrado desse Q&A por uma rota inferida lexicalmente; além disso, a palavra “final” filtrava cards de qualificação mesmo em “ao final da prova” e “existe final?”. A apresentação agora usa o único route_id do registro Atlas já resolvido para selecionar cards e só aplica o filtro de fase final quando a pergunta pede a fase, sem alterar a resposta Q&A ou os route_ids armazenados.

Foram acrescentados quatro cards textuais no padrão visual RENATE, sem imagem por não haver imagem local pertinente que acrescentasse informação normativa:

- `ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1` — equipamento, vestuário e apoios; ISSF Rule Book 2026, Edition 2025, Third Print 10/2026, itens 6.7, 7.4, 7.5 e 7.6.
- `ISSF_MOVING_TARGET_SLING_RULE_V1` — bandoleira em Moving Target; mesmos Rule Book e edição, itens 10.5 e 10.7.
- `WSPS_PARATRAP_ADAPTIVE_SUPPORT_V1` — suportes adaptativos e segurança por classe; WSPS Rulebook 2026 vFinal, itens 6.2.2.2, 6.2.3.2, 6.3.1–6.3.3 e 6.4.1–6.4.3.
- `WSPS_PROGRAM_OF_EVENTS_V1` — programas 1–3 e guia de qualificação de Jogos IPC; WSPS Rulebook Appendices 2026 vFinal, Appendix 2 §§1.1–1.2, p. 7.

## Pendências e limites

- Os 138 cards previamente aprovados permanecem aprovados pelos hashes registrados. Os quatro cards novos estão `NO_DECISION` e aguardam revisão humana; nenhuma aprovação foi inferida.
- As perguntas WSPS-SRC-181, -201 e -204 têm formulações/respostas protegidas que divergem de passagens da fonte local usadas nos novos cards. As divergências estão preservadas para revisão; Q&A não foi editado.
- `npm run build`: PASS; 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens e 142 cards (30 padronizados, 100 de evidência de prova, 12 de equipamento). SHA-256 do pacote: `c560f7f5ac4cbd48996039690a1b7db2e5ff4554444037f28a3cb636caa60d62`. SHA-256 de `cards.json`: `cf6bf7bc0b3aac14efa5dc0c58ce3c6ca824608fb7c781ca812bb5b7073bdd18`.
- A URL móvel serviu esse pacote, manifesto e Service Worker por HTTPS; viewport 390 px sem overflow e nenhuma chamada externa. O gate móvel geral permanece FAIL porque só 138/142 hashes de cards têm decisão APPROVE. A instalação e reabertura offline em aparelho não foram testadas nesta rodada.
- O relatório global de regressão das 1.104 perguntas não foi reexecutado após essa correção focada. Outras falhas de seleção e vínculo de passagens permanecem fora deste fechamento.

Rotas registradas, corpus Q&A, respostas, aliases e sequência não foram alterados. A alteração de código se limita à seleção de cards e ao filtro de fase exibidos.
