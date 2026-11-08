# RENATE BETA Offline

RENATE é um PWA independente para entregar respostas aprovadas, regras/fontes e cards, com uso offline no dispositivo. `RENATE/` é a raiz completa do futuro repositório Git e do pacote transportável.

## Fonte de verdade

- SPEC de produto: [`RENATE_BETA_OFFLINE_SPEC_V1.md`](RENATE_BETA_OFFLINE_SPEC_V1.md), versão 2.7.
- Princípios de confiança e fluxo de resposta: [`TRUST.md`](TRUST.md).
- SPEC de referência imutável: [`ADANA20_BETA_OFFLINE_SPEC_CODEX.md`](ADANA20_BETA_OFFLINE_SPEC_CODEX.md).
- Plano: [`docs/beta-offline/PLANO_TRABALHO_5_DIAS.md`](docs/beta-offline/PLANO_TRABALHO_5_DIAS.md).
- Relatório do Dia 3: [`docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md`](docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md).
- Importação de cards clonados e auditoria: [`data/imports/adana_cards_2026-11-06/README.md`](data/imports/adana_cards_2026-11-06/README.md) e [`IMPORT_AUDIT.json`](data/imports/adana_cards_2026-11-06/IMPORT_AUDIT.json).
- Relatório de apresentação dos cards: [`docs/beta-offline/ADANA_CARD_IMPORT_PRESENTATION_2026-11-06.md`](docs/beta-offline/ADANA_CARD_IMPORT_PRESENTATION_2026-11-06.md).
- Auditoria de figuras aplicáveis e imagens ainda necessárias: [`docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`](docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md).
- Matriz de cobertura de todas as rotas e cards: [`docs/beta-offline/ROUTE_CARD_COVERAGE_2026-11-06.csv`](docs/beta-offline/ROUTE_CARD_COVERAGE_2026-11-06.csv); os 960 resultados individuais ficam em [`docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json`](docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json).
- Briefing mais recente: [`docs/beta-offline/BRIEFING_RETOMADA_2026-11-07.md`](docs/beta-offline/BRIEFING_RETOMADA_2026-11-07.md).
- Relatório da coleta: [`docs/beta-offline/DAY1_COLLECTION_REPORT_2026-11-06.md`](docs/beta-offline/DAY1_COLLECTION_REPORT_2026-11-06.md).
- Auditoria de exportação e escopo do Gate R1: [`docs/beta-offline/EXPORT_AUDIT.md`](docs/beta-offline/EXPORT_AUDIT.md).
- Viabilidade da busca: [`docs/beta-offline/SEARCH_FRONTEND_FEASIBILITY.md`](docs/beta-offline/SEARCH_FRONTEND_FEASIBILITY.md).
- Viabilidade de áudio: [`docs/beta-offline/AUDIO_OFFLINE_FEASIBILITY.md`](docs/beta-offline/AUDIO_OFFLINE_FEASIBILITY.md).
- Referência visual CBTE: [`docs/beta-offline/CBTE_ADANA_VISUAL_REFERENCE.md`](docs/beta-offline/CBTE_ADANA_VISUAL_REFERENCE.md).
- Histórico local: [`docs/beta-offline/HISTORY_LOCAL_FEASIBILITY.md`](docs/beta-offline/HISTORY_LOCAL_FEASIBILITY.md).
- Auditoria de dependências: [`docs/beta-offline/DEPENDENCY_AUDIT_2026-11-06.md`](docs/beta-offline/DEPENDENCY_AUDIT_2026-11-06.md).

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

1. Criar/registrar casos ATLAS aprovados para as cinco rotas sem cobertura, caso haja conteúdo correspondente disponível dentro de RENATE.
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
