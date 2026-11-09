# Plano de trabalho de 5 dias — RENATE BETA Offline

**Criado em:** 2026-11-05  
**Atualizado em:** 2026-11-08  
**SPEC vigente:** RENATE v3.0.  
**Escopo:** todo trabalho, teste, artefato e build deste plano fica dentro de `RENATE/`. ADANA20 não faz parte do escopo.

**Trava explícita da usuária — 2026-11-08:** IDs de rota e sequência/perguntas do Q&A permanecem protegidos. A solicitação posterior de reconciliação autorizou exceção estrita para resolver as 23 seleções, corrigir os vínculos de passagem e responder as nove perguntas sem Q&A pertinente. Não houve alteração de IDs de rota, pergunta ou ordenação; os aliases de busca e apenas as respostas/fontes dessas nove perguntas foram ajustados dentro do escopo pedido.

## Estado e regra de fechamento

**Correção de escopo, 2026-11-08:** os seis cards pré-aprovados referidos pela usuária são os de sapato/equipamento; os 13 cards dessa categoria já estavam aprovados por hash e permanecem incluídos. Seis cards de qualificação/programa foram incluídos por engano no suplemento e agora ficam excluídos por falta de aprovação correspondente. Pacote atual: 131 cards aprovados; histórico da correção em `CARD_HUMAN_APPROVAL_SUPPLEMENT_6_2026-11-08.json`.

**Aceite humano offline Android, 2026-11-08:** a usuária informou `offline aprovado` após instalar a PWA e verificar consulta offline no Android. O aceite está registrado em `OFFLINE_HUMAN_ACCEPTANCE_2026-11-08.md`; o gate local escopado para continuar as configurações online anteriormente autorizadas está atendido. iPhone, quota e validação de atualização hospedada permanecem pendentes.

**Atualização de fechamento escopado, 2026-11-08:** o runtime foi ampliado para 1.106 Q&A e passou 1.106/1.106: 960 do snapshot, 50 do suplemento, 94 do desempate e duas entradas posteriores. A suíte browser ampla ainda reporta problemas de associação/apresentação de cards, registrados para a próxima versão na SPEC v3.0; o aceite local é escopado e não implica revisão humana offline nem habilita serviços online.

O trabalho de hoje é fechar a validação offline e preparar uma versão local de produção para revisão da usuária. **Antes de qualquer criação, instalação ou conexão de instância/serviço que dependa de atividade externa ou login** — incluindo Supabase, Vercel/HTTPS ou cadastro de leads — a usuária deve poder abrir e revisar a versão local, sem rede, incluindo design, layout e funcionalidades. A revisão e o aceite são um gate; não são presumidos pelo build ou por testes automatizados.

Depois do aceite offline, registrar em seção separada qualquer etapa externa que venha a ser autorizada. Até lá, não criar, instalar nem conectar esses serviços. TTS PT-BR permanece bloqueado e não pode ser apresentado como funcional.

### Evidências de execução já registradas

- Dia 1: coleta autorizada e encerrada; Library e Gate R1 documentados em `EXPORT_AUDIT.md` e `DAY1_COLLECTION_REPORT_2026-11-06.md`.
- Dias 2–4: viabilidade, aplicação, busca local, histórico/PIN, cards, Service Worker e fluxo local documentados no README, relatórios de implementação e briefing de retomada.
- Snapshot original: Chromium 158 validou 960/960 respostas, fontes, localizadores e passagens; 45/45 cards aplicáveis; 812/812 recortes retornados íntegros; 9/9 associações explícitas de figura; zero chamadas externas. Isso cobre somente os 960 casos daquele snapshot.
- Complemento de 2026-11-07: 50 Q&A foram adicionados às cinco rotas antes sem cobertura. O build local reportou 1.104 Q&A; Golden Set e runtime próprios foram executados em 2026-11-08, com resultados discriminados abaixo e gate ainda reprovado.
- Golden Sets rastreáveis preparados em 2026-11-08 para os grupos original (960), suplemento (50), entradas posteriores (94) e pacote combinado (1.104); IDs, hashes e ordem concatenada foram conferidos contra o corpus sem editar perguntas/respostas. Os manifestos estão em `tests/golden/*_2026-11-08.json`.
- Regressão anterior preservada em `QA_PRESENTATION_REGRESSION_2026-11-08.json`: seleção 1.081/1.104, Q&A pertinente 1.095/1.104, cards aplicáveis 1.044/1.061 e vínculos de passagens 1.080/1.104. Após a reconciliação específica, a nova execução real passou: **1.104/1.104** em seleção, Q&A pertinente, apresentação dos cards aplicáveis, links/hashes locais, cabeçalhos/localizadores, hashes PDF/OCR, vínculos das passagens e ordem dos blocos; zero chamadas externas. Resultados por grupo: 960/960, 50/50 e 94/94. Detalhes: `QA_RECONCILIATION_COMPLETION_2026-11-08.md`, `QA_RECONCILIATION_RUNTIME_2026-11-08.json` e inspeção focada `QA_RECONCILIATION_INSPECTION_2026-11-08.json`.
- Reteste focado dos 17 casos de card ausente: **PASS, 17/17**. Dois cards existentes estavam sendo removidos pelo filtro lexical de fase “final”; corrigido para respeitar o route_id do Q&A exato e diferenciar pedido de fase final de frases temporais/consultas sobre existência de final. Quatro cards textuais locais foram acrescentados. Evidência: `CARD_GAP_COMPLETION_2026-11-08.md` e `CARD_GAP_RUNTIME_RETEST_2026-11-08.json`. A regressão global de 1.104 perguntas não foi repetida; seus demais gates continuam FAIL/não verificados.
- ASR humano Android: **PASS por decisão explícita da usuária** nesta retomada. Esse aceite não se estende ao iPhone, quota/instalação móvel ou TTS PT-BR, que continua bloqueado.
- Reteste focado de 2026-11-08: cards de falha das quatro provas ISSF de pistola e cards de equipamento CBTE passaram nos casos registrados; os controles de acessibilidade por áudio passaram em Chromium com voz PT-BR simulada, inclusive leitura apenas dos cards e hover/foco após 3 segundos. O teste não comprova áudio real, TTS offline nem funcionamento em aparelho. Evidência: `docs/beta-offline/FAILURE_EQUIPMENT_AUDIO_ACCESSIBILITY_RETEST_2026-11-08.md`.
- Apresentação compacta: teste de browser em Chromium 158 no viewport 390 × 844 passou para `CBTE:CBTE-ARB-020:A01`: ordem card → Q&A → link de regra local → disclosure; passagens recolhidas inicialmente, 18 figuras ao abrir, sem overflow e sem requisições externas. Evidência: `COMPACT_PRESENTATION_2026-11-08.json`. Isso valida o comportamento automatizado desse caso, não equivale ao aceite visual humano offline.
- Cards (estado corrigido): 131 cards ativos têm aprovação pelo hash corrente; os 13 cards de equipamento incluem os de sapato ISSF e vestuário WSPS. Seis cards de qualificação/programa continuam sem aprovação e foram retirados do pacote. O registro suplementar mantém o histórico da correção.
- Supabase/Vercel não foram configurados.
- A suíte browser atual preserva 960/960 em respostas, fontes, localizadores e proveniência PDF/OCR, mas registra 50 casos com questões de seleção/apresentação de cards. As consultas genéricas de rota, associações Rimfire/F-Class e demais IDs estão anotados para a próxima versão; não foram corrigidos neste fechamento escopado.

## Dia 1 — Recepção, inventário RENATE e pacote de dados — CHECK

**Objetivo:** fechar a entrada de material e tornar a primeira biblioteca reproduzível.

- CHECK — Inventariar os arquivos recebidos em RENATE, registrar proveniência e hashes, e manter o corpus local independente.
- CHECK — Concluir os pareamentos PDF/OCR e registrar cobertura e lacunas nos relatórios do Dia 1 e em `EXPORT_AUDIT.md`.
- CHECK — Validar allowlist e pacote de dados; fechar o Gate R1 para o escopo documentado.
- CHECK — Encerrar a autorização pontual de coleta do Dia 1. Ela não autoriza consultas, cópias ou alterações posteriores fora de RENATE.

**Resultado registrado:** Library com 31 PDFs e 50 OCR/textos de entrada; a cobertura do pacote varia conforme o snapshot/build e está discriminada no README e nos relatórios. A associação do Planejamento Técnico CAR/PST 2026 à rota `cbte.shotgun.trap_nacional` continua sujeita a revisão antes de ser usada como evidência.

## Dia 2 — Viabilidade técnica e fundação da aplicação — CHECK COM PENDÊNCIAS

**Objetivo:** escolher tecnologias locais e criar o shell do PWA.

- CHECK — Aprovar FlexSearch para busca local; a seleção no Worker passou nos 960 casos do snapshot avaliado.
- CHECK — Implementar o shell React/Vite/PWA, layout responsivo, identidade visual e tokens locais documentados.
- CHECK — Registrar viabilidade e limites de busca, áudio e referências visuais nos relatórios correspondentes.
- CHECK — Confirmar Whisper Tiny q8 em inferência offline na amostra sintética PT-BR e arquivar proveniência/licenças.
- CHECK — A usuária considerou PASS o teste de fala humana Android apresentado nesta retomada; preservar essa decisão como aceite do teste Android, sem extrapolar para iPhone.
- PENDENTE — Validar instalação, armazenamento/quota e ASR no iPhone.
- BLOQUEADO — TTS PT-BR: o candidato avaliado não passou; manter leitura textual disponível.

## Dia 3 — Conversa local, cards, PIN e histórico — CHECK COM PENDÊNCIAS

**Objetivo:** conectar conteúdo elegível à experiência local de pergunta/resposta.

- CHECK — Implementar pacote RENATE a partir de conteúdo e fontes locais allowlisted, com respostas, fontes e localizadores vinculados.
- CHECK — Implementar conversa, esclarecimentos, histórico local, PIN e navegação da Biblioteca de regras.
- CHECK — Renderizar cards e figuras locais aplicáveis; preservar conteúdo, ordem e proveniência.
- CHECK — Confirmar persistência local e funcionamento offline no Chromium para o escopo testado.
- CHECK — Aprovação vigente verificada por ID/grupo/SHA-256: 131/131 cards ativos; equipamentos e vestuário permanecem incluídos. Seis cards de qualificação/programa sem decisão foram excluídos.
- CHECK PARCIAL — ASR Android aceito como PASS pela usuária; iPhone permanece pendente. TTS PT-BR continua bloqueado.

## Dia 4 — PWA e operação offline local — CHECK COM PENDÊNCIAS

**Objetivo:** validar preparação, reabertura e integridade do pacote sem depender de serviços externos.

- CHECK — Implementar precache e Service Worker local; registrar inventário e tamanho do precache por build.
- CHECK — Validar no Chromium o app shell, navegação, busca, respostas, cards, histórico/PIN e zero chamadas externas no cenário testado.
- CHECK — Gerar build local após o complemento ATLAS de 50 Q&A.
- CHECK DE ENTREGA HTTPS (histórico do catálogo anterior) — A prévia LAN documentou HTTP 200 e hashes de 138 cards em `MOBILE_PREVIEW_2026-11-08.json`; essa evidência não cobre o pacote atual corrigido de 131 cards. Permanecem pendentes instalação PWA e reabertura offline em Android/iPhone; fala humana Android segue PASS e iPhone pendente.
- PENDENTE — A validação de atualização assinada e de recuperação de falha precisa constar de evidência própria antes de ser considerada aceita.
- ADIADO ATÉ ACEITE OFFLINE — Qualquer configuração ou teste de Supabase, Vercel/HTTPS, leads ou login externo.
- CHECK — Repositório Git local inicializado em `RENATE/`, branch `main`, sem remoto e sem commit inicial. GitHub, Vercel e Supabase permanecem fora desta etapa.

## Dia 5 — Fechamento e revisão da versão local de produção — EM EXECUÇÃO, atualizado em 2026-11-08

**Objetivo:** deixar uma versão local verificável para a usuária revisar e fechar a cobertura adicionada, sem criar ou conectar serviços externos.

1. **CHECK — ASR Android.** A usuária considerou PASS o lote humano apresentado. Registrar como decisão humana para Android; não declarar iPhone ou TTS aprovados.
2. **CHECK — Reteste focado de falhas, equipamento e interface de acessibilidade por áudio.** Os quatro cards ISSF de falha, os cards CBTE de equipamento e os controles UI de leitura por ícone/hover/foco passaram nos casos do relatório. A interface foi exercitada com voz `pt-BR` simulada; saída audível e TTS offline em Android/iPhone não foram aprovados. No viewport móvel Chromium 390 × 844, os quatro cards de falha corretos vieram primeiro (4/4); isso não substitui aparelho físico.
3. **CHECK AUTOMATIZADO PARCIAL — Apresentação compacta.** A ordem cards → resposta/perguntas Q&A pertinentes → links normativos → disclosure recolhido passou no caso CBTE especificado em `COMPACT_PRESENTATION_2026-11-08.json`, no viewport 390 × 844 e sem chamadas externas. Revisão visual humana offline continua pendente.
4. **CHECK — Aprovação humana dos cards por ID/hash.** O pacote ativo contém 131 cards com hashes aprovados no registro principal. Os cards de sapato/equipamento estão incluídos; seis qualificações/programas sem hash aprovado ficaram fora. O registro `CARD_HUMAN_APPROVAL_SUPPLEMENT_6_2026-11-08.json` preserva o histórico da correção.
   - Preview local: `https://192.168.1.12:4173/` (mesma rede Wi-Fi; cards aparecem ao perguntar pela prova/equipamento correspondente).
   - Galeria de revisão por ID/hash: `https://192.168.1.12:4173/cards-review.html`. Aprovações/ajustes ficam no navegador; usar **Exportar decisões** para entregar o arquivo JSON, sem envio externo.
   - Catálogo JSON completo: `https://192.168.1.12:4173/renate-pack/cards.json`.
   - Registro das correções e pendências: `docs/beta-offline/CARD_HUMAN_REVIEW_ADJUSTMENTS_2026-11-07.md`.
   - Arquivos de imagem/SVG: `E:\ADANA 2.0\RENATE\public\renate-pack\cards\` (subpastas `renate-generated`, `photos` e `adana-assets`; `old_cards` é arquivo histórico, não é a seleção ativa).
5. **CHECK — Manifestos Golden Set rastreáveis.** Manifestos por ID/hash/ordem para 960, suplemento de 50, entradas posteriores de 94 e combinado 1.104 foram gerados em `tests/golden/`; os IDs e a ordem conferem com o corpus. As relações semânticas entre pergunta, resposta e passagem não são aprovadas por esse check mecânico.
6. **PASS — Regressão runtime de apresentação para todas as perguntas.** Caminho real do Worker, sem ID forçado: seleção/resolução, Q&A pertinente, cards aplicáveis, links/hashes locais, disclosure, citações e vínculos de passagem — 960/960 no snapshot, 50/50 no suplemento, 94/94 nas entradas posteriores; combinado 1.104/1.104. Ordem compacta — PASS; chamadas externas — zero. As 23 seleções foram resolvidas, os 24 vínculos de passagem corrigidos e as nove respostas foram respondidas com regra e fonte locais. IDs de rota, perguntas e ordenação ficaram intactos. Relatório histórico preservado e execução nova em `QA_PRESENTATION_REGRESSION_2026-11-08.json` e `QA_RECONCILIATION_RUNTIME_2026-11-08.json`; síntese: `QA_RECONCILIATION_COMPLETION_2026-11-08.md`.
7. **PENDENTE — Revisar o candidato local offline.** Conferir design, layout responsivo, navegação, Biblioteca, chat, cards/figuras, PIN/histórico e estados de erro/espera. Incluir especificamente a nova ordem compacta de respostas e o disclosure fechado inicialmente. Registrar observações sem converter testes automáticos/build em aceite visual.
8. **Após a revisão, corrigir apenas os itens reprovados e reapresentá-los.** Preservar as decisões e hashes anteriores.
9. **Fechar o relatório local e parar no gate offline.** Atualizar relatórios, briefing, instruções e hashes. Não iniciar fase externa antes do aceite explícito da experiência local.

**Critério de saída do Dia 5:** a versão local abre e pode ser revisada sem login e sem atividade externa; os 50 Q&A têm resultados individuais; os problemas encontrados estão corrigidos ou listados como pendentes; o aceite da usuária está registrado separadamente. Se faltar aparelho ou fala humana, registrar pendência sem declarar teste móvel concluído.

## Etapa online — autorizada após aceite offline, em preparação

O aceite Android foi registrado e a usuária já autorizou esta etapa. Preparação local iniciada; publicação continua condicionada à autenticação, aos gates de privacidade e aos testes de acesso:

- Preparar Supabase somente para inserção inicial de lead com três campos. Migration `20261109210000_leads_insert_via_function_only.sql` aplicada; consulta read-only confirmou as três colunas, RLS e privilégios anon de INSERT/SELECT/UPDATE/DELETE negados; POST REST direto retornou 401. Edge Function + Turnstile passou 6/6 unit tests e teste browser sintético sem gravar lead. O deploy da função foi bloqueado pelo gate de confirmação do CLI. Retenção até pedido de exclusão aprovada; canal público de privacidade e sitekey/secret ainda pendentes.
- Hospedar no Vercel/HTTPS e validar instalação/atualização da PWA a partir da origem hospedada. Projeto vinculado, Node 24.x e build de produção local passou; deployment pendente.
- Configurar ou testar qualquer fluxo que exija conta, credencial, login ou atividade de terceiro.
- Registrar cada serviço, dado público de configuração, segredo, política de acesso, evidência e eventual aprovação de implantação.

## Critérios de conclusão do trabalho atual

- [x] As 50 entradas novas têm Golden Set rastreável e avaliação individual em runtime aprovada (50/50).
- [x] Regressão runtime aprovada de 1.106 Q&A: 960/960, 50/50, 94/94 e duas posteriores (2/2); Q&A pertinente, cards ativos aprovados, links/fontes, proveniência e vínculos de passagens — 1.106/1.106. Relatório `QA_RECONCILIATION_RUNTIME_2026-11-08.json`; as duas entradas têm manifesto próprio em `tests/golden/later_qa_2_2026-11-08.json`.
- [x] A usuária aprovou instalação e consulta offline do pacote escopado no Android; aceite registrado em `OFFLINE_HUMAN_ACCEPTANCE_2026-11-08.md`. Revisão iPhone/quota/atualização hospedada continua pendente.
- [x] `dist/` e `public/renate-pack/` refletem o build escopado corrigido de 08/11/2026. Build: 1.106 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 131 cards aprovados; SHA-256 do pacote `5627f767a3ba3f24fadc2c01173ae5768e558aebb58afb0cff797ae5cddfbd55`; SHA-256 de `cards.json` `d1e560c39fd169e52c57b235db5ebce5b71b079ef8a1aaed1fb497ec868103ef`.
- [x] Android ASR está registrado como PASS por decisão da usuária; iPhone, quota e instalação móvel seguem explicitamente marcados como pendentes.
- [x] O pacote contém 131 cards com hash aprovado atual, incluindo os 13 cards de equipamento; a auditoria `CARD_REVIEW_STATUS_2026-11-08.json` registra 131/131 aprovados e zero pendências ativas. Seis cards de qualificação/programa sem aprovação foram excluídos; o histórico da correção está em `CARD_HUMAN_APPROVAL_SUPPLEMENT_6_2026-11-08.json`. Os quatro finais CBTE solicitados estão suprimidos; lacunas de chamada foram adiadas e documentadas na SPEC v3.0.
- [x] TTS PT-BR permanece identificado como bloqueado até passar demonstração offline com proveniência/licença; o texto continua disponível.
- [x] Nenhuma instância Supabase remota foi criada/aplicada e nenhuma versão foi publicada. CLI Supabase instalada localmente; projeto Vercel foi criado e vinculado à conta autorizada, sem deployment.
- [x] Todo o trabalho desta missão permaneceu dentro de `RENATE/`; ADANA20 não foi alterado.
