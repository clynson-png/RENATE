# Briefing de retomada — RENATE BETA Offline

**Data de retomada:** 2026-11-07  
**Preparado em:** 2026-11-06  
**Raiz independente:** `RENATE/`. O ADANA principal permanece fora do escopo e bloqueado para ações de RENATE.  
**SPEC vigente:** [`RENATE_BETA_OFFLINE_SPEC_V1.md`](../../RENATE_BETA_OFFLINE_SPEC_V1.md), versão 2.9.

## Atualização — interface e teste de áudio — 2026-11-07

- A usuária confirmou que conseguiu abrir e ler RENATE no celular. Isso confirma o acesso visual, não a permissão ou captura do microfone.
- O frontend já integra o botão de gravação com `transcribeLocalAudio` e Whisper Tiny q8 local. Corrigida a descrição antiga que dizia que a integração na interface ainda estava pendente.
- `npm run test:audio-browser` passou em Chromium 158: amostra PT-BR sintética reconhecida offline; nenhum acesso externo. Evidência: [`AUDIO_BROWSER_INFERENCE_2026-11-07.json`](AUDIO_BROWSER_INFERENCE_2026-11-07.json). Isto não substitui fala humana nem teste Android/iPhone.
- Preview de produção recompilado e reiniciado em HTTPS: `https://192.168.1.12:4173/`. `node scripts/check_device_preview.mjs` retornou `PASS_LOCAL_PREVIEW_READY`, com `getUserMedia`, `MediaRecorder`, perfil/certificado servidos e zero solicitações externas.
- Próxima ação: testar três gravações no Android e três no iPhone, sem enviar a pergunta; registrar transcrições e resultado da permissão. A instrução de fala está em [`ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`](ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md).

### Resultado Android recebido — 2026-11-07

- Captura e transcrição funcionaram. Em três gravações da frase de referência, a segunda foi transcrita integralmente; a primeira e a terceira tiveram erros. Resultado Android parcial: 1/3 exatas. As três saídas foram registradas no roteiro de validação.
- O teste do iPhone ainda está pendente; a validação geral de áudio humano não está fechada.

### Ajuste do ASR Android — 2026-11-07

- Após o segundo lote Android, a usuária reportou novamente 1/3 aprovada; no total dos dois lotes, 2/6 foram aprovadas antes da correção. As transcrições do segundo lote foram preservadas, sem assumir qual delas passou.
- Ajustado `src/localSpeech.js`: seleção de canal com maior energia, corte de silêncio nas bordas, normalização de nível limitada e busca Whisper com 3 hipóteses. Não foi aplicada uma transcrição predeterminada.
- `npm run test:audio-browser` passou depois da alteração em fala sintética offline, sem solicitações externas. Isso não comprova melhora em fala humana; repetir as três gravações no Android com a versão atualizada. O iPhone fica para o final, conforme pedido.

### Reconciliação de transcrições e normalização contextual — 2026-11-07

- Novo lote Android após o ajuste do sinal: primeira transcrição reconheceu a frase, com `9` no lugar de “nove” e sem acento em “arbitro”; as outras duas variaram `Itiro`, `sportivo` e `ábirto`.
- Incluída normalização local contextual desses erros de vocabulário no `src/localSpeech.js`, sem trocar o áudio por uma frase completa fixa. O texto corrigido permanece editável antes do envio.
- As variantes recebidas foram verificadas contra o pós-processamento; o teste automatizado de ASR sintético continua `PASS`. A normalização textual não comprova que o modelo ouviu corretamente. Repetir uma gravação Android após atualização para validar o fluxo final. iPhone permanece para o final.

### Reversão da normalização lexical — 2026-11-07

- A usuária reportou outro lote com três saídas (registradas no roteiro) e pediu voltar à configuração anterior, com apenas mudanças pequenas.
- Removida a camada contextual de substituição de palavras. O campo volta a receber a transcrição bruta do Whisper.
- Mantidos o pré-processamento de sinal e `num_beams: 3`, que faziam parte da configuração anterior considerada melhor. Aguardar uma gravação Android após a atualização antes de avançar ao iPhone.

### Restauração da primeira configuração ASR — 2026-11-07

- A usuária informou que a configuração ainda estava pior que na primeira passagem e pediu reverter as modificações.
- Restaurada a mistura simples dos canais; removidos corte de silêncio, seleção do canal mais energético, ganho limitado e `num_beams: 3`. Mantida a saída bruta Whisper Tiny local.
- Preview HTTPS reconstruído e reiniciado em `https://192.168.1.12:4173/`. A próxima ação é uma gravação Android de referência; iPhone permanece para o final.
- Novo lote Android recebido após a restauração: 1/4 reconheceu o conteúdo da frase (com `9` no lugar de “nove”); as outras três tiveram desvios relevantes. Nenhuma foi literalmente idêntica. Transcrições completas em `ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`; nenhuma nova alteração de código foi aplicada.

## Atualização após cards de medidas de pistola — 2026-11-07

- Criados cards 10 m e 25 m para dimensões/caixa, peso da pistola, peso mínimo do gatilho e punho. Abrangência: ISSF 10 m e 25 m; WSPS P1/P2/P5/P6 e P3, respectivamente. As exceções específicas WSPS foram preservadas; a pistola 50 m não herda esses limites.
- Recortes da tabela oficial ISSF 8.12, p. 375, estão nas imagens dos dois cards; o recorte comparativo do punho da p. 355 aparece junto da resposta.
- Build PASS: 1.010 Q&A, 24 PDFs, 43 OCRs, 15.010 passagens, 91 cards normativos, 34 recortes. SHA-256 `72bdec681963e95a1d5d0fd9befcc674a6b16e2fc9f0d729724c7b25f46508eb`.
- Relatório: [`PISTOL_SPECIFICATION_CARDS_2026-11-07.md`](PISTOL_SPECIFICATION_CARDS_2026-11-07.md).

## Atualização após divisão dos cards por prova — 2026-11-07

- Cards agregados de Light, WRABF e CMP encontrados em `dist/renate-pack/cards/other` foram desdobrados em 18 cards individuais (8 Light, 7 WRABF, 3 CMP), com fatos e proveniência normativa local preservados.
- A seleção WSPS agora prioriza a prova resolvida, incluindo P1, P2, P3, R3 e R11.
- Build PASS: 1.010 Q&A, 24 PDFs, 43 OCRs, 15.010 passagens, 89 cards normativos; SHA-256 `028bd3ebc090f6cee4fb99a8891806ef059fd62a34fc9b5d0b8d820b3af5856f`.
- Matriz offline de 82 perguntas: 82/82 cards corretos. A conferência é do worker local; revisão visual e validação em aparelhos continuam pendentes.
- Relatório: [`CARD_PROOF_RECONCILIATION_2026-11-07.md`](CARD_PROOF_RECONCILIATION_2026-11-07.md); matriz: [`MODALITY_PROOF_QUESTION_TEST_AFTER_RECONCILIATION_2026-11-07.csv`](MODALITY_PROOF_QUESTION_TEST_AFTER_RECONCILIATION_2026-11-07.csv).

## Atualização após complemento ATLAS — 2026-11-07

- O complemento RENATE adicionou 50 Q&A, 10 em cada uma das cinco rotas listadas no estado-base abaixo. O snapshot importado original de 960 registros foi preservado; o pacote de execução contém 1.010 Q&A.
- O empacotamento gerou 23 PDFs, 42 OCRs e 14.931 passagens. SHA-256 do pacote: `08c7c59ce6d7f880db2e16a0bd36017705a51a4fa79c65f196b4133f43a97e88`.
- As 50 entradas ainda não têm casos Golden Set; o `PASS` de empacotamento não valida busca, apresentação ou correção semântica em runtime.
- Relatório e matriz: `ATLAS_ROUTE_SUPPLEMENT_2026-11-07.md` e `ATLAS_ROUTE_SUPPLEMENT_COVERAGE_2026-11-07.csv`.
- Nenhuma alteração foi feita em ADANA20.

## Estado-base confirmado antes do complemento

- A auditoria visual e o teste browser do Chromium 158 passaram nos **960 casos ATLAS presentes**: respostas, fontes, localizadores e passagens PDF/OCR com hashes válidos em 960/960; cards/fotos aplicáveis em 45/45; recortes retornados íntegros em 812/812; associações explícitas figura-pergunta em 9/9; zero chamadas externas.
- Há **33 recortes PNG** extraídos de documentos locais e vinculados à fonte, edição, página e hash. Para as 960 perguntas presentes não foi identificada imagem que a usuária precise buscar.
- Cinco rotas não têm perguntas ATLAS no snapshot: `cbte.cmp.rimfire_sporter`, `cbte.shotgun.automatic_trap`, `cbte.shotgun.issf`, `cbte.shotgun.trap_nacional` e `issf.event.14`. Não se inferiu que figuras estejam ausentes; a necessidade visual dessas rotas não pode ser determinada sem casos e relações de fonte.
- A consulta integral é acessível sem pergunta pelo item permanente **Biblioteca de regras**; respostas mantêm links locais para os PDFs completos que citam. A consulta funciona sem rede.
- Resultado técnico registrado no pacote: 267 entradas / 339.196.564 bytes no precache; SHA-256 `60171673782cfec825eeb52c773fb6112792c0b8b11b9a2b47b4b34962cddd67`.

## Decisões e limites

- Todo trabalho, dado e arquivo de entrega fica dentro de `RENATE/`. Não consultar, extrair nem modificar ADANA. A autorização anterior de coleta foi pontual para o Dia 1 e não autoriza novas importações.
- Usar somente PDFs/OCRs já incluídos em `RENATE/library/` para criar recortes. Preservar contexto e rótulos da figura; não redesenhar nem inventar imagens.
- Não solicitar imagens para as cinco rotas sem casos. Primeiro identificar perguntas e fontes locais aplicáveis; se faltar material externo a RENATE, interromper a importação e solicitar autorização específica.
- Supabase e Vercel continuam adiados até fechar a validação offline local. TTS PT-BR segue bloqueado; Whisper Tiny passou apenas a amostra sintética PT-BR. Android/iPhone, fala humana e quota de armazenamento móvel ainda não foram validados.

## Skin RENATE

- O shell usa identidade visual CBTE e composição conversacional de referência ADANA, com tokens/fontes locais rastreáveis; o layout responsivo foi validado no Chromium.
- Os cards ativos foram padronizados com a skin derivada do modelo P6, preservando fatos, identidade e ordem de origem. Há 30 cards ativos de 15 rotas; `wsps.event.r6:both` permanece sem asset. A aprovação humana por hash está registrada para P6 qualificação/final; o catálogo não registra aprovação explícita dos outros 29 cards, e essa distinção permanece preservada.
- As imagens de card são distintas dos recortes normativos PNG; a auditoria de figuras não altera o estado de governança dos cards.
- Decisão do usuário em 2026-11-07: os cards são evidência normativa em RENATE. Cada card runtime apresenta o suporte por Q&A aprovado, fonte PDF local, edição e localizadores; imagem sem essa ligação não basta.
- Foram gerados quatro cards SVG com o esquema visual do Trap Nacional: Fossa Olímpica e Skeet Olímpico, cada um com qualificação e final. Os cards usam Q&A `RENATE:CBTE-ISSF-TRAP:001–008` e o ISSF Rule Book 2026, Third Print 10/2026. O Skeet Light local não fornece especificações olímpicas.
- O empacotamento local passou em 1.010 Q&A, 23 PDFs, 42 OCRs e 14.931 passagens; 59 cards padronizados no total, 18 de qualificação, 11 de final e 17 rotas CBTE. SHA-256: `877b7be4928a6f996da74cf7cc96e56b182567e5971629de9bb406b6a3bded36`. Conferência focada no Chromium da instância local de produção passou 4/4: os quatro nomes de modalidade/fase abriram o SVG certo, inteiro (1080×820), com as fontes/localizadores; o hash servido igualou o build e não houve requisições externas. Não equivale à regressão integral.
- Imagens opcionais para substituir os esquemas vetoriais: diagrama/foto aérea da Fossa com bunker e cinco postos; diagrama oficial de Skeet com casas High/Low, oito postos e trajetórias cruzadas; fotos de atletas em qualificação/final. Os SVGs vetoriais atuais permitem continuar sem esperar por imagens novas.

## Arquivos de referência e mudanças

- SPEC atualizada para v2.8: `RENATE_BETA_OFFLINE_SPEC_V1.md`.
- Novo relatório de retomada: `docs/beta-offline/BRIEFING_RETOMADA_2026-11-07.md`.
- Evidência de figuras: `docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`.
- Relatório de implementação e aceite: `docs/beta-offline/DAY3_IMPLEMENTATION_REPORT_2026-11-06.md`.
- Resultados detalhados: `docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json`, `docs/beta-offline/SEARCH_BROWSER_960_2026-11-06.json` e `docs/beta-offline/BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json`.
- Proveniência dos 33 recortes: `data/imports/day1_2026-11-06/figure-crops/manifest.json`.
- Histórico diário: `README.md`; princípios de resposta: `TRUST.md`.

## Próximos passos

1. Retomar pela validação real de instalação, armazenamento e Whisper Tiny em Android e iPhone, se os aparelhos estiverem disponíveis; registrar separadamente o que foi testado e o que permanecer pendente.
2. Avaliar a aplicabilidade de figuras às cinco rotas agora cobertas por Q&A, usando relações com fontes locais; se faltar material externo a RENATE, solicitar autorização específica antes de importar.
3. Manter TTS PT-BR como bloqueado até uma inferência offline PT-BR demonstrada, com licença e proveniência fechadas.
4. Só depois da validação local e da atualização do aceite preparar a etapa Supabase para inserção inicial de leads e Vercel/HTTPS.

## Comandos/evidências já registrados

- `npm run test:browser` — `PASS` no Chromium 158, conforme `FIGURE_BROWSER_TEST_2026-11-06.log` e JSONs de resultados.
- `npm run test:locators` — `PASS`, 8/8.
- `npm run test:pack` — `PASS` no pacote documentado para essa execução.
- Esses resultados cobrem o snapshot existente; não declaram cobertura para as cinco rotas sem casos nem validação em dispositivos móveis.
