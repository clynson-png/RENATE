# RENATE BETA Offline

RENATE é um PWA independente para entregar respostas aprovadas, regras/fontes e cards, com uso offline no dispositivo. `RENATE/` é a raiz do repositório Git local e do pacote transportável. O repositório foi inicializado na branch `main`, sem remoto configurado.

## Estado atual — 2026-11-08 (SPEC v3.0)

- Busca corrigida: Q&A e passagens de empate/desempate só podem ser selecionadas quando a pergunta contém explicitamente “empate”, “empates”, “desempate” ou “desempates”. A palavra “prova” e o nome da modalidade, isoladamente, não acionam esse conteúdo.
- Prioridade de cards de equipamento: termos de medidas em português/inglês agora apresentam os cards de equipamento antes do card da prova identificada. Consultas sem prova mostram cartões de equipamento separados por escopo; carabina/rifle, pistola/pistol e shotgun/pump/trap/skeet/fossa filtram o tipo. Os quatro cards CBTE solicitados estão cobertos. Os IDs de rota e o conteúdo/escopo normativo não foram alterados. Evidência e matriz em [`EQUIPMENT_CARD_PRIORITY_AUDIT_2026-11-08.md`](docs/beta-offline/EQUIPMENT_CARD_PRIORITY_AUDIT_2026-11-08.md).
- Cards ISSF de falhas: quando “falha(s)” acompanha uma das quatro provas de pistola abrangidas, o card específico apresenta falhas admissíveis/não admissíveis, limites, procedimento e pontuação. Standard soma os cinco menores valores globais; Tiro Rápido escolhe o menor valor em cada alvo. Ambos têm exemplo numérico. Pistola 25 m e Fogo Central mostram o tempo de complementação. Evidência em [`ISSF_MALFUNCTION_CARDS_AUDIT_2026-11-08.md`](docs/beta-offline/ISSF_MALFUNCTION_CARDS_AUDIT_2026-11-08.md).
- Auditoria de cartões ISSF: nomes e aliases agora apresentam o cartão específico da rota. RFP/RFPM/Tiro Rápido 25 m resolve para `issf.event.09`; Standard Pistol ISSF resolve para `issf.event.11`. As rotas WSPS, CBTE e WRABF ficaram fora do ajuste. Evidência em [`ISSF_ROUTE_CARD_AUDIT_2026-11-08.md`](docs/beta-offline/ISSF_ROUTE_CARD_AUDIT_2026-11-08.md).
- Auditoria de cartões CBTE: as rotas CBTE com cards foram verificadas por nome de prova; CMP Rimfire Sporter agora apresenta os cards gerais e das classes/divisões, e F-Class Rimfire resolve também sem o prefixo “Carabina”. ISSF e WSPS, inclusive rotas delegadas dentro do programa CBTE, ficaram fora do ajuste. Evidência em [`CBTE_RIMFIRE_ROUTE_CARD_AUDIT_2026-11-08.md`](docs/beta-offline/CBTE_RIMFIRE_ROUTE_CARD_AUDIT_2026-11-08.md).
- Auditoria ampliada CBTE: 45/45 cards de prova/variante passaram por chamadas nominais e aliases. Foram encontrados quatro cards de equipamento que não entram nas consultas diretas por prova; registrados separadamente, sem alteração nesta verificação. ISSF e WSPS continuaram bloqueados. Evidência em [`CBTE_CARDS_CALLABILITY_AUDIT_2026-11-08.md`](docs/beta-offline/CBTE_CARDS_CALLABILITY_AUDIT_2026-11-08.md).
- **Apresentação compacta das respostas (2026-11-08):** cards primeiro; resposta/perguntas existentes do Q&A em seguida; links dos regulamentos citados; passagens, figuras e proveniência recolhidas inicialmente em **“Deseja ver mais passagens sobre o assunto?”**. O disclosure preserva o conteúdo integral e a leitura por acessibilidade. Não cria perguntas Q&A nem altera busca/rotas. A mudança de apresentação está descrita no aditivo da seção 6.3 da SPEC.

- A foto colocada em `img/wrabf_issf.png` foi incorporada ao card de qualificação WRABF, sem alteração do original. O alvo oficial 50 m fica separado. Foto ilustrativa, não normativa; fatos do card continuam ligados às fontes locais. SHA-256 da foto: `cef1ad2d2125d2708abf08ddbbadb982a0dabeaf9264d094da86808812141a50`.
- **Fechamento dos 17 casos de card ausente:** reteste focado passou 17/17 com as perguntas originais e exigindo o card esperado. Dois cards já existentes (CMA 10 m e CMP Rimfire) passaram após corrigir a seleção pelo route_id do Q&A exato e impedir que “ao final”/“existe final” filtre cards de qualificação. Quatro cards textuais foram acrescentados para Rifle ISSF, Moving Target, suporte Para Trap e programas WSPS; sem imagem local pertinente. Q&A e route_ids armazenados não mudaram. Quatro cards novos aguardam revisão humana. Evidência: [`CARD_GAP_COMPLETION_2026-11-08.md`](docs/beta-offline/CARD_GAP_COMPLETION_2026-11-08.md) e [`CARD_GAP_RUNTIME_RETEST_2026-11-08.json`](docs/beta-offline/CARD_GAP_RUNTIME_RETEST_2026-11-08.json).
- `npm run build`: PASS; 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens e 142 cards (30 padronizados, 100 de evidência de prova, 12 equipamentos), 34 recortes. SHA-256 do pacote: `c560f7f5ac4cbd48996039690a1b7db2e5ff4554444037f28a3cb636caa60d62`. SHA-256 de `public/renate-pack/cards.json`: `cf6bf7bc0b3aac14efa5dc0c58ce3c6ca824608fb7c781ca812bb5b7073bdd18`.
- A decisão anterior da usuária cobre 138 cards e permanece registrada por ID/hash em [`CARD_HUMAN_APPROVAL_ALL_2026-11-08.json`](docs/beta-offline/CARD_HUMAN_APPROVAL_ALL_2026-11-08.json). Os quatro cards novos estão sem decisão; não foram incluídos como aprovados.
- **Reconciliação runtime 1.104 Q&A — PASS:** seleção/resolução, Q&A pertinente, cards aplicáveis, links/fontes, hashes PDF/OCR e vínculo das passagens passaram 1.104/1.104; grupos: 960/960, 50/50 e 94/94; ordem compacta PASS e zero chamadas externas. Foram corrigidas as 23 seleções, 24 vínculos às fontes e respondidas as nove perguntas sem Q&A pertinente. IDs de rota, perguntas e ordem não mudaram. O relatório histórico foi preservado em [`QA_PRESENTATION_REGRESSION_2026-11-08.json`](docs/beta-offline/QA_PRESENTATION_REGRESSION_2026-11-08.json); resultado novo e respostas citadas em [`QA_RECONCILIATION_COMPLETION_2026-11-08.md`](docs/beta-offline/QA_RECONCILIATION_COMPLETION_2026-11-08.md) e [`QA_RECONCILIATION_RUNTIME_2026-11-08.json`](docs/beta-offline/QA_RECONCILIATION_RUNTIME_2026-11-08.json).
- Prévia HTTPS para smartphone: `https://192.168.1.12:4173/`. Verificação atual serviu app, manifesto, catálogo e Service Worker do pacote vigente; 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens e 142 cards. Viewport 390 × 844 sem overflow; zero chamadas externas. Gate geral: **FAIL** por 4 hashes sem revisão humana (138/142 aprovados). Evidência: [`MOBILE_PREVIEW_2026-11-08.json`](docs/beta-offline/MOBILE_PREVIEW_2026-11-08.json). Instalação e reabertura offline em aparelho ainda não foram verificadas.
- Retomada de amanhã: [`BRIEFING_RETOMADA_2026-11-08.md`](docs/beta-offline/BRIEFING_RETOMADA_2026-11-08.md).

## Atualização 2026-11-07 — cards de medidas de pistola

- Criados dois cards normativos, separados por prova: Pistola de Ar 10 m e Pistolas 25 m. Incluem caixa de medição, peso da arma, peso mínimo do gatilho e restrições do punho, com escopo ISSF/WSPS e precedência das exceções WSPS.
- Os cards são associados às rotas ISSF 10 m (evento 07), ISSF 25 m (eventos 08–11), WSPS P1/P2/P5/P6 (10 m) e WSPS P3 (25 m). A pistola 50 m permanece fora desses limites de caixa.
- Recortes locais do quadro ISSF 8.12, p. 375, foram incorporados às imagens dos cards. O diagrama de punho de 8.4.1.5–8.4.1.6, p. 355, aparece junto da resposta.
- `npm run build`: PASS; 91 cards normativos e 34 recortes. SHA-256 do pacote: `72bdec681963e95a1d5d0fd9befcc674a6b16e2fc9f0d729724c7b25f46508eb`.
- Detalhes, localizadores e hashes: [`PISTOL_SPECIFICATION_CARDS_2026-11-07.md`](docs/beta-offline/PISTOL_SPECIFICATION_CARDS_2026-11-07.md).

## Atualização 2026-11-07 — reconciliação de cards por prova

- Cards agregados encontrados em `dist/renate-pack/cards/other` foram divididos em 18 cards individuais: oito provas Light, sete divisões WRABF e três classes CMP. Cada um traz fatos e referências da fonte local com edição, SHA-256 e localizador; os assets visuais originais foram preservados.
- A seleção de cards WSPS foi ajustada para priorizar a prova resolvida. A matriz offline de 82 perguntas passou 82/82, chamando o card esperado.
- `npm run build`: PASS; pacote com 1.010 Q&A, 24 PDFs, 43 OCRs, 15.010 passagens e 89 cards normativos. SHA-256: `028bd3ebc090f6cee4fb99a8891806ef059fd62a34fc9b5d0b8d820b3af5856f`.
- Evidência: [`CARD_PROOF_RECONCILIATION_2026-11-07.md`](docs/beta-offline/CARD_PROOF_RECONCILIATION_2026-11-07.md) e [`MODALITY_PROOF_QUESTION_TEST_AFTER_RECONCILIATION_2026-11-07.csv`](docs/beta-offline/MODALITY_PROOF_QUESTION_TEST_AFTER_RECONCILIATION_2026-11-07.csv). A verificação foi do worker local offline; não representa aceite visual em navegador ou celular.

## Prévia offline no celular pela rede local

- Inicie com `npm run start:local`. A primeira execução instala uma regra de entrada do Windows limitada à sub-rede local para TCP 4173 (app HTTPS) e 4174 (certificado/perfil local); aprove a solicitação do Windows quando aparecer.
- Use no celular o endereço HTTPS exato impresso pelo script, por exemplo `https://192.168.1.12:4173/`. Computador e celular precisam estar no mesmo Wi-Fi; redes de convidados ou isolamento de clientes podem impedir o acesso.
- Para habilitar microfone em HTTPS, instale e confie no certificado/perfil apresentado pelo script. `npm run preview` e `npm run dev` também escutam na rede local pela porta 4173, mas usam HTTP e não habilitam ASR.
- Encerre a prévia com `npm run stop:local`. A prévia não inicia login remoto, Supabase, Vercel ou outra integração externa.

**Gate móvel — atualização 2026-11-08:** o build atual foi servido na URL LAN `https://192.168.1.12:4173/`. O teste real da URL confirmou HTTP 200 no app, manifesto, catálogo de cards e Service Worker; 138/138 hashes de aprovação correspondem ao catálogo servido. Tela de 390 × 844 px sem overflow e zero requisições externas. Evidência: [`MOBILE_PREVIEW_2026-11-08.json`](docs/beta-offline/MOBILE_PREVIEW_2026-11-08.json). Instalação PWA, quota, reabertura offline e saída TTS audível no Android físico permanecem pendentes.

## Atualização 2026-11-07 — cards de equipamento

- Acrescentados seis cards normativos prioritários para AlphaOmega, além dos três cards importados: `CBTE_WRABF_EQUIPMENT_RESTS_V1`, `CBTE_DUELO_20S_10M_EQUIPMENT_CLASSIFICATION_V1`, `ISSF_TRAP_SKEET_EQUIPMENT_V1`, `CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1`, `ISSF_MOVING_TARGET_MARKER_TAPE_V1` e `WSPS_RIFLE_KNEELING_TABLE_SUPPORT_V1`. Todos têm rota(s) explícitas e referências locais com edição, SHA-256 e localizadores.
- A imagem do card WRABF foi extraída do Appendix G, p. 59, do WRABF Rules 2023–2027 V4.4. Ela ilustra modelos de apoio frontal; os critérios do card estão vinculados ao regulamento específico CBTE atualizado em 20/11/2024. Não foi necessária imagem enviada pelo usuário; os demais cards novos são tipográficos para não sugerir equipamento visual sem imagem de fonte pertinente.
- Build do pacote: `npm run build` passou; 9 cards de equipamento no runtime (3 importados + 6 novos), 71 cards de evidência normativa e pacote SHA-256 `ccf0fd6a2a7ec675bf8bf0a74a7721c083f6a2623387f2a8a59e0249221d996c`.
- A auditoria do snapshot encontrou cards associados às 62 rotas canônicas. Portanto, não há lacuna de cobertura de rota a preencher com novos cards genéricos. Permanecem 29 definições de fase importadas sem estado de revisão registrado; elas continuam como candidatas de catálogo e não são promovidas como evidência normativa.
- Próxima sequência de equipamento: fechar a cobertura por classe nas rotas CBTE de Fossa Automática, Trap Light e nas versões Trap Nacional 25/50 m antes de estender qualquer limite entre provas. O card Trap/Skeet importado segue apenas visual; os cards ISSF Trap/Skeet e Trap Nacional CBTE recém-criados trazem regras separadas e fontes correspondentes.

## Fonte de verdade

- SPEC de produto: [`RENATE_BETA_OFFLINE_SPEC_V1.md`](RENATE_BETA_OFFLINE_SPEC_V1.md), versão 3.0.
- Princípios de confiança e fluxo de resposta: [`TRUST.md`](TRUST.md).
- SPEC de referência imutável: [`ADANA20_BETA_OFFLINE_SPEC_CODEX.md`](ADANA20_BETA_OFFLINE_SPEC_CODEX.md).
- Plano: [`docs/beta-offline/PLANO_TRABALHO_5_DIAS.md`](docs/beta-offline/PLANO_TRABALHO_5_DIAS.md).
- Relatório do Dia 3: [`docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md`](docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md).
- Importação de cards clonados e auditoria: [`data/imports/adana_cards_2026-11-06/README.md`](data/imports/adana_cards_2026-11-06/README.md) e [`IMPORT_AUDIT.json`](data/imports/adana_cards_2026-11-06/IMPORT_AUDIT.json).
- Relatório de apresentação dos cards: [`docs/beta-offline/ADANA_CARD_IMPORT_PRESENTATION_2026-11-06.md`](docs/beta-offline/ADANA_CARD_IMPORT_PRESENTATION_2026-11-06.md).
- Auditoria de figuras aplicáveis e imagens ainda necessárias: [`docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`](docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md).
- Matriz de cobertura de todas as rotas e cards: [`docs/beta-offline/ROUTE_CARD_COVERAGE_2026-11-06.csv`](docs/beta-offline/ROUTE_CARD_COVERAGE_2026-11-06.csv); os 960 resultados individuais ficam em [`docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json`](docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json).
- Complemento ATLAS das cinco rotas antes sem Q&A: [`docs/beta-offline/ATLAS_ROUTE_SUPPLEMENT_2026-11-07.md`](docs/beta-offline/ATLAS_ROUTE_SUPPLEMENT_2026-11-07.md) e [`docs/beta-offline/ATLAS_ROUTE_SUPPLEMENT_COVERAGE_2026-11-07.csv`](docs/beta-offline/ATLAS_ROUTE_SUPPLEMENT_COVERAGE_2026-11-07.csv).
- Briefing mais recente: [`docs/beta-offline/BRIEFING_RETOMADA_2026-11-08.md`](docs/beta-offline/BRIEFING_RETOMADA_2026-11-08.md).
- Relatório da coleta: [`docs/beta-offline/DAY1_COLLECTION_REPORT_2026-11-06.md`](docs/beta-offline/DAY1_COLLECTION_REPORT_2026-11-06.md).
- Auditoria de exportação e escopo do Gate R1: [`docs/beta-offline/EXPORT_AUDIT.md`](docs/beta-offline/EXPORT_AUDIT.md).
- Viabilidade da busca: [`docs/beta-offline/SEARCH_FRONTEND_FEASIBILITY.md`](docs/beta-offline/SEARCH_FRONTEND_FEASIBILITY.md).
- Viabilidade de áudio: [`docs/beta-offline/AUDIO_OFFLINE_FEASIBILITY.md`](docs/beta-offline/AUDIO_OFFLINE_FEASIBILITY.md).
- Referência visual CBTE: [`docs/beta-offline/CBTE_ADANA_VISUAL_REFERENCE.md`](docs/beta-offline/CBTE_ADANA_VISUAL_REFERENCE.md).
- Histórico local: [`docs/beta-offline/HISTORY_LOCAL_FEASIBILITY.md`](docs/beta-offline/HISTORY_LOCAL_FEASIBILITY.md).
- Auditoria de dependências: [`docs/beta-offline/DEPENDENCY_AUDIT_2026-11-06.md`](docs/beta-offline/DEPENDENCY_AUDIT_2026-11-06.md).

## Resolução sistêmica de provas, cards e desempate — 2026-11-07

- A resolução da rota reconhece aliases PT-BR/EN para as provas ISSF (incluindo “pistola 10m ISSF” → `issf.event.07`) e precede as rotas amplas herdadas do Q&A ao procurar cards, figuras e passagens.
- Se não houver Q&A direta, RENATE apresenta até três perguntas já respondidas entre os 1.010 registros, priorizadas pela prova/rota resolvida e pelo assunto. A escolha abre o Q&A existente; card e passagens locais continuam junto das opções.
- Consultas com empate/desempate expandem a busca para equivalentes controlados e identificam as passagens como regra geral ou regra da prova/fase, preservando fonte, edição e localizador.
- O Planejamento Técnico CAR/PST 2026 foi registrado e incluído no pacote local com PDF/OCR verificados, restrito à rota `cbte.shotgun.trap_nacional` que consta no manifesto. Não foi associado às demais provas CBTE.
- `npm run build`: PASS; 1.010 Q&A, 24 PDFs, 43 OCRs, 15.010 passagens, 71 cards normativos, 9 cards de equipamento e 33 recortes. SHA-256 do pacote: `2e7f6fb53231cb2d8d3b342751b5a33e348c4aaf100dc9225ed0df69857b358b`. Build não comprova apresentação em browser; runtime e revisão visual continuam pendentes.

## Atualização de cobertura ATLAS — 2026-11-07

- Foram incorporados 50 Q&A fornecidos em `library/ADANA_50_perguntas_regras_tiro_esportivo_2026.md`, 10 para cada uma das cinco rotas anteriormente sem cobertura. O snapshot importado de 960 registros foi preservado; o pacote local combina os 960 originais com o complemento RENATE e contém 1.010 Q&A.
- O empacotamento local incluiu as fontes PDF/OCR vinculadas às novas entradas: 23 PDFs, 42 OCRs e 14.931 passagens. SHA-256 do pacote: `08c7c59ce6d7f880db2e16a0bd36017705a51a4fa79c65f196b4133f43a97e88`.
- As 50 entradas ainda não têm casos Golden Set. O `PASS` do empacotamento valida a montagem e os vínculos locais do pacote, não a busca, a apresentação ou a correção semântica dessas respostas em runtime.
- Nenhum arquivo ou dado de ADANA20 foi alterado.

## Cards normativos para Trap e Skeet olímpicos — 2026-11-07

- Por decisão expressa do usuário, os cards são evidência normativa no RENATE. Cada card deve mostrar os fatos e a fonte local, edição e localizadores correspondentes; o SVG ou a imagem isolada não substitui o vínculo documental.
- A partir do esquema visual de Trap Nacional, foram criados quatro SVGs locais para RENATE: Fossa Olímpica — qualificação/final e Skeet Olímpico — qualificação/final. Especificações vieram das respostas aprovadas `RENATE:CBTE-ISSF-TRAP:001–008` e do ISSF Rule Book 2026, Third Print 10/2026; o pacote mostra edição, artigos e links do PDF local.
- Os cards são chamados na rota `cbte.shotgun.issf` quando a pergunta menciona a modalidade; seleção por modalidade separa Fossa/Trap de Skeet e também considera qualificação/final.
- O arquivo Skeet Light permanece apenas como referência geométrica da cancha; não foram reaproveitados seus 75 pratos nem suas especificações Light. Os quatro cards novos desenham a cancha esquematicamente e citam as regras usadas.
- `npm run pack:local` passou na montagem: 1.010 Q&A, 23 PDFs, 42 OCRs, 14.931 passagens, 59 cards padronizados, 18 cards de qualificação, 11 cards de final e 17 rotas CBTE com cards. SHA-256 do pacote: `877b7be4928a6f996da74cf7cc96e56b182567e5971629de9bb406b6a3bded36`. Conferência focada no Chromium da instância local de produção passou 4/4: Fossa qualificação/final e Skeet qualificação/final chamaram seus SVGs correspondentes, renderizaram o quadro inteiro (1080×820) e apresentaram referências normativas. O SHA-256 servido coincidiu com o build, sem requisições externas. Não foi executada regressão integral do RENATE.
- Imagens para você buscar, se quiser substituir os esquemas vetoriais por imagens oficiais: **(1)** diagrama ou foto aérea da cancha de Fossa Olímpica, com bunker e cinco postos; **(2)** diagrama oficial de Skeet com casas High/Low, oito postos e cruzamento das trajetórias; **(3)** opcional, foto CBTE/ISSF de atletas em qualificação e final de cada modalidade. A imagem Skeet Light atual só pode servir de referência visual, não de fonte normativa. Envie os originais com página/link de origem, crédito/licença e preferência de recorte; não é necessário buscar foto se os esquemas vetoriais forem suficientes.

## Estado confirmado — 2026-11-06

- **Escopo:** todo o código, dado, asset, PDF/OCR, script, relatório e build estão dentro de `RENATE/`. O ADANA principal permaneceu sem alteração; a coleta autorizada foi limitada ao Dia 1.
- **Library:** corpus de entrada com 31 PDFs e 50 OCR/textos; pacote offline atual com 21 PDFs, 40 OCRs e 14.674 passagens. Os 33 recortes PNG vêm somente de PDFs locais. Incluem desenhos ISSF de alvos e medidores de equipamento, alvos/empunhaduras CBTE e os Apêndices WSPS 4, 5 e 6.
- **Consulta natural dos regulamentos:** o item permanente **Biblioteca de regras** abre e filtra os 21 PDFs sem necessidade de enviar pergunta. Cada resposta apresenta links locais para os regulamentos completos que cita. A ação **Consultar passagens da regra** mostra artigo/localizador e texto; figuras/recortes pertinentes aparecem acima das passagens.
- **Q&A ATLAS:** 960 registros aprovados por humano compõem o banco local. O Chromium 158 passou todos os 960 casos cobertos: resposta 960/960, conjunto de fontes 960/960, localizadores 960/960 e passagens locais com hashes PDF/OCR e cabeçalhos válidos 960/960.
- **Cards e figuras:** 45/45 casos com card diretamente aplicável apresentaram card e foto locais corretos. Nos 812 casos em que RENATE retornou uma figura, 812/812 passaram a validação de hash/proveniência. Nove associações específicas figura-pergunta também passaram. Existem 30 cards ativos em 15 rotas; R6 `both` continua sem asset. Cinco das 62 rotas não têm caso ATLAS no snapshot, então essas rotas não foram avaliadas pelo conjunto de 960.
- **Chat e privacidade:** esclarecimentos continuam limitados a dois e cada turno exibe regra local; fallback sem abstenção passou. PIN, histórico local, recarga, navegação da biblioteca, layout responsivo e execução offline passaram no Chromium; zero requisições externas.
- **Build e pacote:** `npm run test:pack`, `npm run test:locators` (8/8) e `npm run test:browser` passaram. O browser rodou após build; o precache contém 267 entradas / 339.196.564 bytes. SHA-256 do pacote local: `60171673782cfec825eeb52c773fb6112792c0b8b11b9a2b47b4b34962cddd67`.
- **Limites restantes:** cinco rotas não têm caso ATLAS; Android/iPhone e fala humana ainda não foram validados; TTS PT-BR segue bloqueado. Supabase/RLS e Vercel/HTTPS permanecem para a etapa posterior ao fechamento dos testes locais em aparelhos.

## Decisões e fronteiras

1. Toda aplicação, dependência, dado, asset, script, relatório e build ficam dentro de RENATE.
2. O ADANA principal permanece independente e sem alteração. A autorização de consulta/clonagem foi somente para a coleta do Dia 1 e está encerrada.
3. Supabase será configurado somente após o pacote offline local passar; servirá apenas para inserção inicial do lead. Depois, login por PIN local; regras, busca, cards e respostas funcionam no dispositivo.
4. Atualização apenas sob ação manual do usuário, com confirmação e validação da release.
5. Busca no browser com motor JS/WASM; sem backend de aplicação ou servidor de busca instalado.
6. Skin CBTE com layout conversacional de referência ADANA e entrada/saída de áudio offline.
7. Banco conversacional é o snapshot local do ATLAS, usado diretamente. O Golden Set referencial guarda somente IDs/hashes de teste e não participa do runtime. Em nenhum caso abster: perguntar até duas vezes em ambiguidades, mostrando passagem local já no primeiro pedido, e então apresentar a regra mais próxima.
8. Governança composta RENATE preserva os estados importados de ADANA20 e acrescenta cobertura de fonte e aprovação ATLAS; nunca implica mudança de `LOCKED` em ADANA20.
9. O sidecar `atlas_source_bindings_2026-11-06.jsonl` aponta source IDs para a Library local; o runtime não abre caminhos externos preservados no snapshot ATLAS original.

## Próximos passos

1. Preparar casos Golden Set e avaliar as 50 novas entradas das cinco rotas; manter a cobertura de conteúdo distinta da aprovação de busca e apresentação em runtime.
2. Validar armazenamento/quota, instalação PWA e ASR com fala humana em Android e iPhone; TTS PT-BR permanece bloqueado.
3. Após os testes offline em aparelhos e a atualização do aceite, configurar Supabase somente para inserção inicial de lead e hospedagem Vercel/HTTPS.

## Diário

> Os registros datados abaixo preservam o histórico das execuções. Quando houver números anteriores divergentes, o estado confirmado no início deste README e a reconciliação mais recente ao final do diário prevalecem.

### 2026-11-06

- Registro inicial do Dia 2: shell React/Vite/PWA, skin responsiva e tokens CBTE foram construídos. As decisões e execuções finais estão registradas abaixo.
- SPEC RENATE v2.3: registro da avaliação integral das 62 rotas e 960 casos; aceite final explicitamente `FAIL` enquanto localizadores não atingirem 100%. Não há abstenção em nenhuma hipótese; a passagem mais próxima deve ser apresentada após no máximo duas clarificações.
- Dia 3: importador reproduzível gerou pacote de 960 Q&A, 13 pretestes `PASS`, 21 PDFs, 40 OCRs, 9.603 passagens e seis cards ativos.
- Dia 3: autorizado e executado o snapshot local do catálogo de cards: 31 definições de fase, 3 de equipamento e 84 assets hash-verificados. P6 tem duas aprovações específicas por hash (17/15 slots); 29 cards de fase sem estado de revisão registrado ficam somente no catálogo. Um `wsps.event.r6:both` está incompleto. O catálogo e todos os assets foram copiados para RENATE; ADANA permaneceu sem alteração.
- Dia 3: auditoria estendida a todas as 62 rotas, 960 casos, 6 cards ativos e 2 recortes PNG. Hashes de resposta e fontes: 960/960; passagem local válida: 960/960; localizadores esperados: 708/960. Card/figura nas questões aplicáveis: 621/621. Os seis cards foram renderizados individualmente no browser, com fatos/blocos ordenados e imagem local. Apenas 28 das 57 rotas com casos passaram integralmente; cinco rotas sem casos e 59 sem card foram registradas.
- Atualização visual R6: cards de qualificação e final agora mostram a foto em largura integral, dados agrupados por assunto, eliminações em sequência visual e a clarificação `Open = homens e mulheres; não significa equipe mista`. A foto é do evento R6 no Rio 2016 e vem creditada a Thomas Lovelock/OIS/IOC; seu uso é apenas ilustrativo, não normativo. A página original usa o rótulo histórico “Mixed”; isso não foi propagado à classificação atual de RENATE. Hash e procedência estão em `data/imports/web_sources/`.
- Prévia desktop: `docs/beta-offline/R6_CARDS_PREVIEW.png`. Prévia móvel: `docs/beta-offline/R6_CARDS_PREVIEW_MOBILE.png`. `npm run build` passou após a mudança; o browser confirmou carregamento da foto e 5 seções para cada card. A regressão integral dos 30 cards ainda não foi executada.
- Dia 3: teste browser completo de UI passou, mas aceite de conteúdo final é `FAIL`. Whisper Tiny passou inferência offline em amostra PT-BR sintética; TTS PT-BR segue bloqueado. Nenhum aparelho Android/iPhone foi validado.
- Dia 3: Service Worker precacheia 199 entradas, 311.686.753 bytes. Confirmar quota em dispositivos antes do aceite final.

- Concluído inventário estático das 62 rotas e cópia dos documentos encontrados: snapshot inicial com 28 PDFs + 39 OCR/textos; 67/67 hashes válidos.
- Coletados novamente, de fontes públicas oficiais, os 11 PDFs sem OCR. Todos os hashes baixados coincidiram com as cópias locais. Gerados 11 textos pareados com `pdftotext -layout`; Library agora cobre 28/28 PDFs, com 78 artefatos registrados no manifesto. O Regulamento Geral de Tiro ao Prato 2025/2028 revisado em 19/12/2024 foi confirmado como a edição oficial mais recente localizada e o OCR foi regenerado dessa cópia.
- Observação de proveniência: o Planejamento Técnico CAR/PST 2026 aparece associado no snapshot à rota `cbte.shotgun.trap_nacional`; a classificação precisa de revisão antes de usar esse planejamento como evidência para Trap Nacional.
- Importados os 960 Q&A ATLAS; registrada aprovação humana, governança composta por rota e preservação dos estados de ADANA20.
- Criada a rota suplementar RENATE `ALPHAOMEGA` para os 43 Q&A sem classificação original, usando associação por pergunta.
- SPEC RENATE atualizada para v1.6. README da Library, manifesto, auditorias de rotas, relatório do Dia 1 e briefing atualizados.
- Decisão posterior: SPEC v1.7 e `TRUST.md` definem uso direto do ATLAS, resposta com passagens/cards/figuras e teste final de 960 Q&A a 100%; removido `golden_set_candidate.json`.
- Retomada do Dia 1: usuário autorizou buscar/copiar somente três PDFs para resolver três OCRs órfãos; os arquivos foram copiados, pareados e hash-verificados dentro de RENATE. A Library passou a 31 PDFs + 50 OCRs.
- Criado `scripts/day1_reconcile.py` e o Golden Set referencial de 960 casos (ID/hash); runtime continua ligado diretamente ao ATLAS. Três grupos duplicados conflitantes esperam pedido de esclarecimento.
- Criado `scripts/audit_day1_package.py`; auditoria estática passou e Gate R1 foi fechado para o pacote de dados. Testes de aplicação e bundle continuam pendentes até haver implementação.
- SPEC RENATE atualizada para v1.8; TRUST, plano, README, Library README e relatórios do Dia 1 alinhados. Nenhum teste do aplicativo ou serviço foi executado.
- Nenhum arquivo em ADANA20 foi editado; nenhum teste de aplicação, replay ou serviço foi executado.
- Próximo: iniciar construção do app PWA independente dentro de RENATE.

- Dia 2 complementado: campo de pergunta habilitado após índice pronto; perguntas, respostas e esclarecimentos salvos localmente no IndexedDB. Chromium 158 confirmou autosave, restauração após reload, busca offline e zero chamadas externas.
- FlexSearch recebeu aprovação humana e passou os 960 casos de seleção no Web Worker (960/960, 3 esclarecimentos esperados). Isso não fecha o teste ponta a ponta de passagens/cards/figuras.
- Whisper Tiny q8 transcreveu offline uma amostra PT-BR sintetizada (reconheceu competição, nove/9 e árbitro). Kokoro JS q8 gerou voz inglesa offline; tentativa PT-BR falhou porque a distribuição não tem `pf_dora`. TTS PT-BR, integração do ASR na interface, fala humana e avaliação em aparelho continuam pendentes.
- Whisper Tiny q8 e runtime WASM foram incluídos localmente com proveniência, hashes, `NOTICE.md` e os dois textos de licença upstream arquivados. `npm run test:model-provenance` passou: 23 arquivos, 66.931.251 bytes, zero divergências. O build precacheia 69.988.565 bytes; ver `WHISPER_TINY_PROVENANCE_2026-11-06.md`.
- Seis vulnerabilidades transitivas reportadas antes do fechamento do pacote foram tratadas pela remoção de `vite-plugin-pwa`/Workbox vulneráveis, geração do Service Worker local, Vite mantido como dependência de desenvolvimento e override corrigido de `sharp`. `npm audit` atual: 0 vulnerabilidades em 154 dependências; ver `DEPENDENCY_AUDIT_2026-11-06.md`.
- Próximo: validar renderização de regras/cards/figuras e rodar 960 casos end-to-end; substituir Kokoro por TTS PT-BR compatível antes de habilitar voz.

### 2026-11-05

- Reconciliada a SPEC própria do RENATE com a referência sem editar a referência; criados README e diário, briefing de retomada e plano de cinco dias.
- Registrada a decisão de manter a Library própria dentro de RENATE.
- A Skin RENATE e a implementação do PWA ainda não tinham começado.


### 2026-11-06 — Fotos oficiais fornecidas pelo usuário e regressão atual

- Usuário confirmou que as fotos colocadas em `img/` estão corretas e que os elementos visíveis em R7/R8 são apoios de descanso, sem sustentação do rifle na posição de tiro. Proveniência/hash foram registrados; imagens preservadas sem edição.
- R7 e R8 agora apresentam as fotos aprovadas; a qualificação R7 mostra galeria das três posições.
- `npm run test:pack` e `npm run build`: PASS. Pacote SHA-256 `5d1c3e11d0ece7d84ef15cfbbc261a2e8048d7c63b81735013604d357746d1f8`; precache 236 entradas / 324.071.634 bytes.
- Browser: UI/offline PASS; 30/30 cards carregaram imagem e mantiveram a ordem dos blocos. 960/960 resposta/fontes/passagens válidas; 708/960 localizadores esperados; cards em 45/45 casos aplicáveis; figuras em 23/45. O aceite de conteúdo permanece `FAIL`; não chamar isso de PASS global.
- Testes nesta execução: política 2/2, histórico 4/4, importação de cards 84/84 assets, privacidade estática PASS. Supabase/RLS, TTS PT-BR, fala humana e Android/iPhone continuam pendentes.
- Relatório atualizado: `docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md`; briefing: `docs/beta-offline/BRIEFING_RETOMADA_2026-11-06.md`.

### 2026-11-06 — Reconciliação de localizadores e Library navegável

- Corrigida a interpretação de alíneas OCR em linhas separadas, variações de localizador e hierarquia de Apêndices 2, 5 e 6. Os bindings de taxa Grand Prix, flexibilidade de mola, caixa/peso P5 foram associados ao PDF correto de Apêndices dentro de RENATE.
- Acrescentados três recortes locais do Apêndice 5: desenho do suporte SH2 (p. 24), procedimento de flexibilidade (p. 26) e inspeção de mola (p. 27). O recorte do Apêndice 6 (p. 34) mostra a tabela P5 completa.
- A consulta por Q&A exibe links para o PDF completo; a Biblioteca de regras oferece busca/filtro e abertura independente de pergunta.
- Aceite Chromium 158: 960/960 respostas, fontes, localizadores e passagens PDF/OCR; 45/45 cards aplicáveis; 712/712 figuras retornadas com hash/proveniência válidos; zero chamadas externas. Cinco rotas não têm caso ATLAS no snapshot.
- **Retificação pela auditoria de figuras de 2026-11-06:** o novo resultado é 960/960 para resposta/fonte/localizador/passagem, 45/45 cards, 812/812 recortes retornados íntegros e 9/9 associações figura-pergunta explícitas; 33 recortes no catálogo. O valor 712/712 acima é histórico e foi substituído por este resultado.

### 2026-11-06 — Auditoria de figuras aplicáveis

- Acrescentados recortes de alvo da CMA 25 m e Duelo 10/25 m, alvos ISSF, medidores de rigidez da roupa e flexibilidade de calçado, exemplos de adaptações de gatilho WSPS e dimensões/configuração do suporte SH2.
- O catálogo contém 33 recortes. `npm run test:browser`: PASS nos 960 casos, com 812/812 figuras retornadas hash/proveniência válidos e 9/9 associações explícitas figura-pergunta.
- Não identifiquei imagem que a usuária precise carregar para os casos cobertos; as figuras requeridas estavam nos PDFs locais. As cinco rotas sem casos seguem sem cobertura visual inferível.
- Os PDFs completos continuam acessíveis por Biblioteca de regras sem pergunta e por links locais em cada resposta citada.
- Relatório: `docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`; pacote SHA-256 `60171673782cfec825eeb52c773fb6112792c0b8b11b9a2b47b4b34962cddd67`; precache 267 entradas / 339.196.564 bytes.

### Preparação da retomada — 2026-11-07

- SPEC RENATE atualizada para v2.7, explicitando o inventário de figuras aplicáveis, a ausência de imagens pendentes para os 960 casos testados, a cobertura ainda indeterminada das cinco rotas sem Q&A e o caminho permanente para ler PDFs completos sem perguntar ao chat.
- Criado `docs/beta-offline/BRIEFING_RETOMADA_2026-11-07.md` com estado confirmado, decisões, estado da Skin, limites e próximos passos. Nenhuma implementação ou consulta foi feita fora de RENATE.

### Retomada da validação ASR humana — 2026-11-07

- Criados `npm run start:local` / `npm run stop:local` para build e preview HTTPS local com certificado temporário de rede para Android/iPhone; Whisper permanece local, sem endpoint remoto.
- O preview HTTPS abriu a UI, liberou `getUserMedia` e `MediaRecorder` em Chromium e fez zero solicitações fora dos endereços locais. Isso comprova prontidão do shell, não fala humana.
- Criado `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md` com passos de confiança do certificado e roteiro de fala. Desktop com fala humana, Android e iPhone permanecem pendentes até gravações reais revisadas.

### Reconciliação do frontend e retomada do teste de áudio — 2026-11-07

- A usuária confirmou que abriu e conseguiu ler a interface no celular. Esta confirmação é de acesso visual; microfone e fala humana ainda não foram testados.
- O botão de áudio já usa `transcribeLocalAudio`/Whisper Tiny q8 com modelos locais e sem acesso remoto. A anotação anterior que dizia que a integração na UI estava pendente era histórica e foi atualizada na SPEC e no briefing.
- `npm run test:audio-browser`: `PASS` em Chromium 158, inferência sintética offline e zero solicitações externas; evidência em `docs/beta-offline/AUDIO_BROWSER_INFERENCE_2026-11-07.json`. `node scripts/check_device_preview.mjs`: `PASS_LOCAL_PREVIEW_READY` após rebuild do preview HTTPS.
- Preview de produção atual: `https://192.168.1.12:4173/`. A próxima validação é fala humana em Android e iPhone, três gravações por aparelho; manter as transcrições sem enviar a pergunta. Ver `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`.
- Limites mantidos: TTS PT-BR segue bloqueado; teste sintético não fecha o aceite de áudio humano ou de dispositivos.
- Resultado Android recebido em 2026-11-07: captura/transcrição funcionaram; 1/3 tentativas foi exata. As saídas divergentes e o teste iPhone estão registrados como pendentes em `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`.
- Após mais três testes Android, foi informado outro 1/3 aprovado (2/6 antes da correção). Para reduzir falhas de sinal, `src/localSpeech.js` passou a selecionar o canal mais claro, remover silêncio nas bordas, normalizar volume com limite e decodificar com 3 hipóteses. O ensaio sintético offline passou; fala humana pós-correção ainda precisa ser conferida no Android. iPhone fica para o final, conforme pedido.
- Lote Android seguinte: primeira transcrição preservou as palavras, mas usou `9` e `arbitro`; as duas demais tiveram variantes de `tiro esportivo`/`árbitro`. Acrescentada normalização contextual dessas variantes observadas. Relato bruto e limitações em `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`; falta validar uma gravação no Android já com essa camada. iPhone continua no final.
- Reversão solicitada: a camada de normalização lexical foi removida após o lote seguinte apresentar baixa precisão. A saída do Whisper volta a ser exibida sem substituições; permanecem o pré-processamento de sinal e `num_beams: 3` da configuração anterior. O último lote e esta reversão estão registrados no roteiro; falta uma gravação Android na versão revertida. iPhone segue para o final.
- Após a usuária informar que o resultado continuava pior que na primeira passagem, também foram revertidos os ajustes de sinal e `num_beams: 3`: o ASR voltou à mistura simples de canais e à transcrição Whisper bruta. Preview local reconstruído em `https://192.168.1.12:4173/`; aguarda nova gravação Android. iPhone segue para o final.
- Novo lote Android na configuração restaurada: 1/4 com conteúdo correspondente (o numeral “nove” apareceu como `9`), 0/4 literalmente idênticas; as outras três tiveram desvios de palavras/frase. Sem novo ajuste de código. Detalhes em `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`.

### Complemento de cobertura ATLAS — 2026-11-07

- Acrescentados 50 registros Q&A próprios do RENATE (10 em cada uma das cinco rotas anteriormente com zero), preservando o snapshot importado original de 960 registros. O empacotador combina as duas camadas no `atlas.jsonl` local de execução.
- O empacotamento local passou com 1.010 Q&A, 23 PDFs, 42 OCRs e 14.931 passagens. O Golden Set existente segue limitado aos 960 casos; as 50 entradas novas ainda não foram avaliadas.
- Relatório e matriz do complemento: `docs/beta-offline/ATLAS_ROUTE_SUPPLEMENT_2026-11-07.md` e `docs/beta-offline/ATLAS_ROUTE_SUPPLEMENT_COVERAGE_2026-11-07.csv`.
- Nenhuma alteração foi feita em ADANA20.

### Ajuste de identidade visual CBTE — 2026-11-07

- A Skin foi atualizada para a paleta do Manual de Identidade CBTE (`#034EA2`, `#00A651`, `#FFF200`), com superfícies claras e atualização dos cards, Biblioteca de regras, navegação e controles responsivos.
- O logo CBTE não foi reproduzido: o site oficial exige autorização prévia para uso da marca. RENATE mantém nome e monograma próprios.
- `npm run build`: PASS. O empacotamento preservou 1.010 Q&A, 23 PDFs, 42 OCRs e 14.931 passagens; precache com 272 entradas / 342.174.435 bytes.
- A inspeção visual local em Chromium 158 gerou capturas desktop, mobile e Biblioteca em `docs/beta-offline/.cache/CBTE_SKIN_*_2026-11-07.png`. A arte oficial da marca RENATE em `docs/Logo RENATE_ Alvo Esportivo Brasileiro.png` é exibida na posição de marca da barra lateral desktop e do cabeçalho móvel. Esse registro não substitui a revisão offline e o aceite da usuária.
- Conferência tipográfica por seção registrada em `docs/beta-offline/CBTE_ADANA_VISUAL_REFERENCE.md`: Roboto local na interface, com escala de 12–16 px para conteúdo e tamanhos de título responsivos; Zona Pro do manual CBTE não foi usada.
- Não foram alterados dados de ADANA20 nem configurados serviços externos.

### Acessibilidade visual por áudio — 2026-11-08

- Incluído no topo o ícone de acessibilidade por áudio. Ao ativar, RENATE lê somente os cards da resposta mais recente; cards de respostas novas também são lidos enquanto a opção permanecer ligada.
- Com a opção ativa, manter o mouse sobre um link ou trecho do conteúdo do assistente por 3 segundos lê somente aquele trecho. O foco por teclado segue a mesma espera; ao desligar, a fala e a fila são canceladas.
- A interface usa apenas uma voz `pt-BR` reportada pelo navegador como local (`localService`). Se ela não existir, informa a indisponibilidade e preserva a resposta textual.
- Limite: não há voz empacotada pelo RENATE. Voz instalada, funcionamento em modo avião e reprodução no Android/iPhone ainda exigem validação no aparelho. Este fallback não altera o estado de aprovação do TTS offline.
