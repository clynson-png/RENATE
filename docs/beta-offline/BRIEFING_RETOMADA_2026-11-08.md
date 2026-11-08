# Briefing de retomada — RENATE BETA Offline

**Retomada:** 2026-11-08  
**Preparado:** 2026-11-07  
**Escopo:** somente RENATE. Não executar ações no ADANA 2.0 principal.  
**Leitura inicial:** [README](../../README.md) e [SPEC RENATE v3.0](../../RENATE_BETA_OFFLINE_SPEC_V1.md).

## Estado confirmado

### Atualização do fechamento dos 17 cards ausentes — 2026-11-08

- Reteste runtime focado: **PASS, 17/17** cards esperados nas perguntas originais, sem fixar o ID selecionado e sem chamadas externas. Evidência: [`CARD_GAP_RUNTIME_RETEST_2026-11-08.json`](CARD_GAP_RUNTIME_RETEST_2026-11-08.json) e [relatório de conclusão](CARD_GAP_COMPLETION_2026-11-08.md).
- Causa sistêmica dos dois cards CBTE que restavam ausentes: a apresentação recebia a rota inferida em vez do route_id único do Q&A resolvido e o token “final” filtrava cards de qualificação mesmo em “ao final da prova” e “existe final?”. Correção limitada à seleção/fase dos cards apresentados; rotas, Q&A, aliases e respostas não foram alterados.
- Acrescentados quatro cards textuais, sem imagem local pertinente: `ISSF_RIFLE_EQUIPMENT_AND_CLOTHING_V1`, `ISSF_MOVING_TARGET_SLING_RULE_V1`, `WSPS_PARATRAP_ADAPTIVE_SUPPORT_V1` e `WSPS_PROGRAM_OF_EVENTS_V1`. O catálogo agora tem 142 cards: 30 padronizados, 100 de evidência de prova e 12 equipamentos.
- O registro da usuária cobre 138 cards aprovados anteriormente. Os quatro novos estão sem decisão humana; não foram marcados como aprovados. O mobile preview serve o build atual, mas o gate continua FAIL por aprovação 138/142. Instalação/reabertura offline em aparelho não foi testada.
- Build atualizado: pacote SHA-256 `c560f7f5ac4cbd48996039690a1b7db2e5ff4554444037f28a3cb636caa60d62`; `cards.json` SHA-256 `cf6bf7bc0b3aac14efa5dc0c58ce3c6ca824608fb7c781ca812bb5b7073bdd18`.
- **Atualização da reconciliação — 2026-11-08:** a regressão completa real de 1.104 Q&A passou 1.104/1.104, com grupos 960/960, 50/50 e 94/94; seleção, relevância de Q&A, cards aplicáveis e vínculo das passagens — PASS; zero chamadas externas. As 23 seleções, 24 vínculos de fontes e nove respostas foram reconciliados. IDs de rota, perguntas e sequência foram preservados. Resumo e artigos/regras citados: `QA_RECONCILIATION_COMPLETION_2026-11-08.md`; execução: `QA_RECONCILIATION_RUNTIME_2026-11-08.json`. Relatório anterior mantido como histórico.

- A fotografia colocada em `img/wrabf_issf.png` mostra competidores sentados em bancadas de Benchrest, com carabinas apoiadas. Foi incorporada sem edição ao card `cbte.wrabf.rifle_international:qualification`; funciona como ilustração do evento, não como evidência normativa. O alvo oficial WRABF 50 m está em imagem separada.
- SHA-256 da foto: `cef1ad2d2125d2708abf08ddbbadb982a0dabeaf9264d094da86808812141a50`. A usuária aprovou todos os cards do pacote atual; o registro vincula a aprovação ao hash vigente de cada conteúdo.
- Build local concluído com PASS: 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 138 registros de card (30 padronizados, 99 de evidência de prova, 9 de equipamento) e 34 recortes. SHA-256 do pacote: `6be1e25c451cd02251d304c9da77c70424040827213e28a18cc02e1e8c8464f2`.
- `cards.json` atual: SHA-256 `06ffa0e813ffb5529c83af30910543ce1d6201478c8e758c7ae4a4d2544d5ee8`.
- A prévia smartphone HTTPS está atualizada em `https://192.168.1.12:4173/`; app, manifesto, cards e Service Worker servem o build atual. Evidência: `MOBILE_PREVIEW_2026-11-08.json`.
- O repositório Git local foi inicializado em `RENATE/`, branch `main`, sem remoto e sem commit inicial; a identidade de commit do Git não está configurada nesta máquina.
- Decisão da usuária em 2026-11-08: todos os 138 cards atuais aprovados. Registro por ID/grupo/índice/SHA-256 em `CARD_HUMAN_APPROVAL_ALL_2026-11-08.json`; auditoria reconciliada: 138/138 APPROVE, 0 pendências. O export anterior foi preservado como histórico.
- Android ASR foi considerado PASS pela usuária. iPhone fica para o final. TTS PT-BR permanece bloqueado. Supabase/Vercel e outras dependências externas ficam adiados até o aceite explícito da versão offline.

### Atualização do gate móvel — 2026-11-08

- A usuária confirmou que o caminho da prévia no celular está funcionando. `https://192.168.1.12:4173/` serviu o bundle atual com HTTP 200; não foi necessário reiniciar o preview.
- Gate de acesso à versão móvel: **PASS**. O Chromium responsivo em 390 × 844 px também mostrou os cards de falha corretos, 4/4 perguntas. Instalação PWA, quota, reabertura offline, saída TTS audível e apresentação em aparelhos físicos continuam pendentes e não são cobertas por essa simulação.
- Seguir com a auditoria de apresentação dos cards de falhas no caminho atual, preservando os quatro `route_id` específicos.

## Primeiras ações

1. Abrir a versão atual no smartphone pela mesma rede Wi-Fi: `https://192.168.1.12:4173/`. Revisar a experiência offline no aparelho; o teste automatizado validou apenas a entrega HTTPS do build.
2. Instalação PWA, quota, reabertura offline, microfone Android e fala TTS continuam gates separados.
3. Regressão runtime dos 1.104 Q&A está aprovada. Revisão humana offline dos cards novos e aceite visual do pacote continuam pendentes; manter rotas e sequência de perguntas intactas.
4. Manter Git local sem remoto; GitHub, Vercel, Supabase e login externo continuam fora desta etapa. Criar o primeiro commit quando uma identidade de autoria estiver configurada e o usuário pedir o registro do snapshot.

## Referências rápidas

- [Plano de trabalho de 5 dias](PLANO_TRABALHO_5_DIAS.md)
- [Ajustes da revisão humana](CARD_HUMAN_REVIEW_ADJUSTMENTS_2026-11-07.md)
- App local: `https://192.168.1.12:4173/`
- Catálogo: `https://192.168.1.12:4173/renate-pack/cards.json`

## Limites de evidência

A foto só contextualiza visualmente a competição. Regras, números e demais afirmações continuam exigindo vínculo com documento normativo local, edição e localizador. A usuária forneceu o arquivo dentro de RENATE; não há licença independente registrada neste briefing. Não publicar nem deslocar a imagem para fora do pacote RENATE sem autorização apropriada. O build PASS comprova montagem do pacote, não revisão visual humana, aceitação móvel ou regressão semântica das 1.104 perguntas.
