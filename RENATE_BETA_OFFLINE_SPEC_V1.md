# RENATE — SPEC do BETA Offline Independente

**Identificador:** `RENATE_BETA_OFFLINE_V1`  
**Versão:** 3.0  
**Data:** 2026-11-08  
**Estado (último pacote, 2026-11-08):** 1.104 Q&A, 13 pretestes `PASS`, 27 PDFs, 46 OCRs, 15.174 passagens, 138 cards padronizados (99 de evidência normativa, 9 de equipamento) e 34 recortes PNG. `npm run build` PASS; SHA-256 do pacote `6be1e25c451cd02251d304c9da77c70424040827213e28a18cc02e1e8c8464f2`. A seleção visual de equipamento antes do card da prova passou sua verificação focada anterior (29 perguntas). Em 2026-11-08 foram adicionados quatro cards de falhas ISSF, e a seleção passou 8/8 casos focados no worker servido localmente; cards de equipamento continuam antes dos cards de falhas/prova. A foto local `img/wrabf_issf.png` foi vinculada ao card de qualificação WRABF; seu SHA-256 é `cef1ad2d2125d2708abf08ddbbadb982a0dabeaf9264d094da86808812141a50`. A fotografia é ilustrativa, não evidência normativa; o alvo WRABF aparece em separado, e regras/fatos continuam vinculados às fontes normativas locais. O card teve seu conteúdo visual alterado e exige nova decisão humana pelo hash vigente. Build e seleção mecânica não substituem revisão visual em runtime/browser nem aceite humano. Android ASR foi aceito como PASS pela usuária; iPhone, TTS PT-BR, quota móvel, Supabase e hospedagem permanecem pendentes.
**Raiz de entrega e do futuro repositório Git:** esta pasta `RENATE/`.

**Atualização de verificação (2026-11-08):** falhas/equipamento e UX da leitura por áudio foram revalidados em `docs/beta-offline/FAILURE_EQUIPMENT_AUDIO_ACCESSIBILITY_RETEST_2026-11-08.md`. A acessibilidade passou no browser com voz PT-BR local simulada; áudio real, modo avião e aparelho Android/iPhone ainda não foram validados. Isso não altera o gate de TTS offline aprovado.

---


## Atualização v3.0 — foto WRABF e estado reproduzível (2026-11-07)

- A fotografia `img/wrabf_issf.png` foi examinada e incorporada, sem edição, como ilustração do card `cbte.wrabf.rifle_international:qualification`. SHA-256: `cef1ad2d2125d2708abf08ddbbadb982a0dabeaf9264d094da86808812141a50`. O alvo oficial 50 m permanece em imagem separada.
- A imagem comunica contexto visual da competição; não serve como prova de regra nem altera os fatos do card. As afirmações normativas permanecem apoiadas por fonte, edição e localizador local. A fotografia foi colocada pela usuária em `RENATE/img`; não se registrou licença independente.
- Mudança de imagem altera o conteúdo revisável. A decisão anterior não vale para o hash novo; o card precisa voltar à galeria para aprovação explícita.
- Build reproduzido: 1.104 Q&A, 27 PDFs, 46 OCRs, 15.174 passagens, 134 cards padronizados, 95 normativos, 9 de equipamento e 34 recortes; SHA-256 do pacote `2d23430009ebd1d011d408f1ba18fa1d966c515bd1614160d7b659a8e4b7f235`. Build PASS não significa revisão humana nem validação visual no celular.

## 0. Autoridade e relação com a SPEC de implementação

Esta SPEC estabelece as regras de produto e arquitetura próprias do RENATE. `ADANA20_BETA_OFFLINE_SPEC_CODEX.md`, mantida imutável dentro desta pasta, é a referência funcional e de qualidade. O arquivo de referência não será editado, usado como autorização para operar no ADANA, nem usado para abrir o ADANA principal a ações de RENATE.

**Regra de alinhamento:** todos os requisitos da SPEC de referência aplicáveis são herdados; somente as exceções listadas abaixo foram substituídas por decisão explícita do usuário. Em caso de dúvida, preservam-se a exigência funcional, a evidência e os critérios de aceite da referência. Esta SPEC só define como implementá-los no pacote independente RENATE.

| Tema da SPEC de referência | Alinhamento para RENATE | Estado/limite confirmado |
|---|---|---|
| Seções 0–2: perguntas, regras/cards, fontes, determinismo, ausência de abstenção, ausência de IA e preservação semântica | Mantidos com o snapshot local ATLAS como banco conversacional direto. O Golden Set é somente manifesto de teste por referências e hashes, nunca uma fonte de runtime nem cópia de respostas. | Snapshot local com 960 Q&A; seleção 960/960 passou no browser. A UI apresentou regra e card P4 e passagem mais próxima em busca sem correspondência. A avaliação ponta a ponta dos materiais para os 960 casos segue pendente. |
| G0 e proteção do repositório | Inventário já registrado em `docs/beta-offline/GATE0_INVENTARIO.md` é evidência histórica. O ADANA principal, seus arquivos, testes, serviços, índices, rotas e skin ficam bloqueados para novas ações de RENATE, exceto a coleta pontual autorizada em 2026-11-06, já encerrada. | GATE0 registra divergência de hash no preflight global; permanece aberto/bloqueado. Não reexecutar nem corrigir. |
| Arquitetura React/Vite/PWA e raiz isolada | Mantidas, com `RENATE/` como raiz de código, build, snapshots, artefatos e Git. Dependências necessárias devem estar empacotadas ou declaradas dentro da pasta. | Shell React/Vite, manifest, Service Worker próprio, skin CBTE, ATLAS local, busca FlexSearch e histórico em IndexedDB estão em RENATE. Build de produção e browser offline passaram; responsividade verificada em 320/390/768/1280 px. |
| Exportação controlada, allowlist, proveniência, licenças e integridade | Mantidos e reforçados: somente snapshots/cópias locais em `RENATE/` podem alimentar build/export. As autorizações de coleta foram limitadas aos materiais descritos nos relatórios; nenhuma escrita ocorreu em ADANA. | 31 PDFs e 50 OCR/textos estão em RENATE; 31/31 PDFs têm OCR local vinculado. Os três PDFs autorizados foram copiados e hash-verificados. Whisper Tiny e runtime WASM também estão dentro do pacote, com revisão, proveniência, atribuições e licenças/notices documentados. |
| Busca: MiniSearch preferido na referência | Usar diretamente o snapshot local do ATLAS e as passagens da Library; selecionar um motor JS/WASM que execute no browser. O Golden Set de teste referencia registros ATLAS por ID/hash e não duplica conteúdo. Nenhum servidor/runtime remoto. | FlexSearch aprovado por humano e 960/960 casos de seleção passaram em Chromium 158/Web Worker. A validação ponta a ponta de regras/cards e de aparelhos continua pendente. |
| PWA sem rede após preparar, atualização versionada e armazenamento local | Mantidos para consulta. Exceções autorizadas: INSERT inicial de lead no Supabase e consulta/download somente após toque explícito em “Verificar atualização”. | Configuração Supabase, schema/RLS e atualização assinada pendentes. |
| Exclusão de login remoto | Exceção autorizada: formulário/cadastro inicial para gravar lead; depois PIN local, sem autenticação remota, recuperação remota ou envio do PIN. | PIN local por PBKDF2 passou criação, verificação e reabertura no Chromium. Cadastro de lead fica adiado até o aceite offline final e a etapa Supabase. |
| Imagens oficiais fornecidas pelo usuário | Preservar os arquivos sem edição e registrar caminho/hash. Para as fotos R7/R8, o usuário esclareceu que os elementos visíveis são apoios de descanso e que os atletas não apoiam o rifle durante a posição de tiro; usar as imagens nos cards conforme essa declaração. Essa nota visual não substitui nem altera regra técnica. | Registrado em `data/imports/user_provided_card_images_2026-11-06/IMAGE_PROVENANCE.json`; R7/R8 renderizados e carregados no Chromium. |
| Interface e cards existentes | Mantida a composição conversacional de referência; identidade visual (cores/fontes) da CBTE. Cards são evidência normativa no RENATE quando exibem fatos apoiados em resposta aprovada e preservam fonte local, edição e localizador; assets, isoladamente, não substituem essa vinculação. | Skin responsiva verificada. 30 cards do snapshot anterior foram clonados e padronizados; estados de revisão de origem permanecem registrados. Em 2026-11-07 foram adicionados quatro cards normativos para as fases de qualificação/final de Fossa Olímpica e Skeet Olímpico, cada qual ligado a Q&A do complemento RENATE e às referências locais da edição ISSF. Empacotamento passou; falta verificar visualmente os novos cards em runtime. |
| Segurança, testes, relatórios e release (seções 9–17) | Mantidos, com exceção da suíte do ADANA. O teste final do RENATE usa o manifesto Golden Set referencial contra o snapshot ATLAS local e exige 100% de acerto; conflitos determinísticos esperam esclarecimento. | Build, histórico 3/3, browser (960/960 seleções, responsividade, autosave, reload e offline), ASR offline e proveniência 23/23 foram executados; `npm audit` retorna zero vulnerabilidades. Teste ponta a ponta de materiais normativos, aparelhos, PIN, lead e update segue pendente. Gate 0 permanece apenas histórico. |

### Decisões explícitas que substituem cláusulas incompatíveis

1. **Supabase:** uma inserção pública inicial de lead; RLS permite inserir campos aprovados e nega leitura/alteração/exclusão ao cliente. Só o administrador lê/exporta leads pelo painel Supabase.
2. **PIN:** login local de desbloqueio, não prova de identidade nem autenticação de conta.
3. **Atualização:** botão explícito consulta versão; download só após confirmação; ativação validada/atômica. Não haverá polling/telemetria do app.
4. **Busca e testes:** escolher um motor JS/WASM compatível com execução integral no browser e consultar diretamente o snapshot ATLAS e a Library local. `pretests/atlas_golden_set_manifest_2026-11-06.json` é exclusivamente um oráculo de teste: guarda IDs, hashes esperados, referências, e casos de ambiguidade; não duplica perguntas ou respostas e não participa do runtime.
5. **Visual e áudio:** skin com identidade visual CBTE e layout/interação ADANA; voz de entrada e saída offline.
6. **Bloqueio ADANA:** nenhuma ação adicional de inspeção, edição, execução de testes, extração ou validação no ADANA principal. A coleta/download web autorizado em 2026-11-06 ficou limitado aos 11 documentos nomeados neste inventário e foi gravado dentro de `RENATE/`.
7. **Ordem:** primeiro concluir e testar o pacote offline localmente contra os 960 Q&A ATLAS. Somente após 100% de acerto configurar cadastro Supabase e hospedagem HTTPS no Vercel; os testes Android/iPhone ocorrem depois da hospedagem.
8. **Reconfirmação antes de Supabase:** imediatamente antes de iniciar qualquer implementação Supabase, atualizar o relatório de aceite com os resultados então vigentes e confirmar: motores aprovados pelos critérios da SPEC ou bloqueios técnicos documentados; shell responsivo testado; tokens visuais e fontes rastreáveis. Não declarar equivalência de ASR/TTS nem de outro candidato se falhar. Um PASS anterior não substitui essa atualização prévia.

**Precedência:** esta lista é a reconciliação completa dos deltas confirmados. A SPEC de referência permanece intacta; RENATE não altera nem “alinha” o arquivo original por edição.

O objetivo é um BETA instalável como PWA, independente do ADANA e sem backend próprio de aplicação. São permitidas duas exceções estritas de rede: inserir o lead no Supabase durante o cadastro inicial e, somente por ação explícita do usuário, consultar a versão e baixar uma atualização. Login local, busca, regras, respostas, cards e fontes permanecem no dispositivo.

## 1. Definição do produto

RENATE é um aplicativo BETA separado, distribuído a partir do conteúdo versionado nesta pasta. Usa diretamente o snapshot local aprovado do ATLAS como banco de perguntas e respostas, e a Library local para apresentar passagens normativas e figuras pertinentes. Não há serviço ATLAS em runtime. O Golden Set existe apenas como manifesto determinístico de teste referenciado ao snapshot, sem conteúdo duplicado.

RENATE não é uma extensão em runtime do ADANA, não é um cliente do backend do ADANA e não é um chatbot generativo. O comportamento de conversa é uma recuperação determinística de respostas, cards e passagens locais. **Abstenção não é um resultado permitido.** A busca percorre ATLAS, pretestes com status gravado `PASS` e o corpus local; em ambiguidade, RENATE pode pedir esclarecimento até duas vezes e desde o primeiro pedido apresenta uma passagem local. Ao atingir o limite, encerra as perguntas e apresenta a passagem mais próxima disponível. Mesmo quando nenhuma passagem é suficiente, mostra a mais próxima e identifica que a relação é fraca; não entrega resposta vazia, recusa ou fato normativo inventado.

### 1.1 Funcionalidade e UX herdadas da SPEC de referência

- Campo de pergunta PT-BR; interpretação determinística de códigos de prova, entidades, palavras-chave, aliases e contexto permitido pelos snapshots.
- A normalização da intenção de busca reconhece variantes controladas e sinônimos do mesmo conceito (por exemplo, empate/desempate, countback e shoot-off), sem usar a expansão lexical para alterar autoridade ou concluir a regra aplicável.
- A resolução de prova/autoridade é independente do resultado Q&A. Aliases PT-BR/EN resolvem a rota canônica antes da apresentação de cards, figuras e passagens; quando uma rota inequívoca for identificada pela pergunta, ela prevalece sobre classificações amplas herdadas do registro ATLAS.
- Busca e recuperação inteiramente local, com preferência por Web Worker quando adequado; resultado distingue resposta ATLAS, registro de preteste aprovado, regra exata, regra relacionada/mais próxima e candidatos ambíguos. Não há estado de abstenção.
- Entrega cards existentes/adaptados, preservando IDs, conteúdo, ordem dos blocos, fontes, edição, artigo, localizador e trecho autorizado.
- Quando a busca não encontrar resposta Q&A direta, oferecer de uma a três perguntas já respondidas no ATLAS local. Ordenar pela prova e autoridade resolvidas, depois pelo assunto; cada opção abre o registro existente e suas evidências. A sugestão sempre acompanha o melhor card e as passagens locais disponíveis e não os substitui.
- Para perguntas de desempate, recuperar e identificar separadamente a regra geral da autoridade e a regra específica da prova/fase, sempre que ambas existirem no corpus local. Cada passagem mantém edição, documento e localizador; se uma das camadas não estiver no pacote, RENATE não a inventa nem mistura regras de outra autoridade.
- Q&A e passagens de empate/desempate só podem ser selecionados quando a pergunta expressar essa intenção em português por “empate(s)” ou “desempate(s)”. A palavra “prova” ou o nome da modalidade não autorizam inferir intenção de desempate; os registros desse tema ficam fora do matching, das sugestões globais e das passagens relacionadas sem esse sinal explícito.
- Quando uma prova ISSF for identificada pelo nome ou alias, apresentar seu cartão normativo específico de `route_id`. Em colisões de nomes com WSPS/CBTE, resolver para ISSF somente com autoridade ISSF explícita ou contexto de resposta já identificado como ISSF; aliases RFP/RFPM pertencem a `issf.event.09`, e Standard Pistol ISSF a `issf.event.11`.
- Quando uma prova CBTE for identificada pelo nome ou alias, apresentar o cartão cujo `eventId` corresponde ao `route_id`; em rotas CBTE com cards de classes/divisões, apresentar também o detalhe explicitamente nomeado, ou os detalhes da rota quando a consulta citar somente a prova geral. Preservar os limites de autoridade: rotas `issf.event.*`, `wsps.event.*`, `cbte.issf.*` e `cbte.wsps.program` não são reinterpretadas como prova CBTE.
- Intenção de equipamento tem prioridade de apresentação quando a pergunta inclui `dimensões`, `caixa`, `medidas`, `largura`, `comprimento`, `espessura` ou `altura`, inclusive os aliases `dimensions`, `box`, `measurements`, `width`, `length`, `thickness` e `height`. Sem tipo de arma, apresentar somente cartões de equipamento, cada qual com seu escopo; com carabina/rifle, pistola/pistol, ou shotgun/pump/trap/skeet/fossa, filtrar para o tipo indicado. Se a pergunta também identificar uma prova, apresentar primeiro os cartões de equipamento pertinentes e, logo depois, o cartão da prova, sem combinar os fatos ou a autoridade dos cartões. Esta regra muda somente a seleção e a ordem visual: não altera IDs/aliases do roteador, `route_id`, texto normativo ou escopo dos cartões. Para Fossa/Trap, `CBTE_TRAP_NACIONAL_EQUIPMENT_AMMUNITION_V1` pode aparecer como cartão solicitado de equipamento; quando a rota for outra que Trap Nacional, o cartão deve declarar explicitamente que suas regras se aplicam somente a Trap Nacional CBTE. O suplemento `SHOTGUN_TRAP_SKEET_DIMENSIONS_V1` permanece visual e não normativo, com sua divulgação de evidência preservada.
- Quando uma pergunta contiver `falha`/`falhas` e identificar uma das quatro provas ISSF, apresentar também seu card explicativo de falhas, vinculado exclusivamente ao seu `route_id`: Pistola Standard (`issf.event.11`), Pistola de Tiro Rápido 25 m (`issf.event.09`), Pistola 25 m (`issf.event.08`) ou Fogo Central (`issf.event.10`). Os cards distinguem falha admissível/não admissível, comunicação/limites de reclamação, pontuação e procedimento por prova; não transferem fórmulas entre provas. Se houver pergunta de equipamento, os cards de equipamento continuam primeiro; o card de falhas vem separado do card normal da prova. Essa seleção é somente de apresentação: não altera os IDs/aliases do roteador ou o conteúdo e escopo de outras rotas. Finais seguem os localizadores ISSF 6.17.4.o/6.17.5.k e não herdam automaticamente o procedimento de qualificação.
- Para as rotas ISSF Pistola 25 m (`issf.event.08`) e Fogo Central (`issf.event.10`), o card explicita o tempo de complementação na etapa de precisão: `48 s × tiros faltantes`, derivado dos 240 segundos por série de cinco tiros (ISSF 8.7.6.4), 48 segundos por tiro de complementação (8.9.4.6(b), também 8.8.1(d)). Inclui o exemplo de 3 tiros realizados + 2 faltantes = 96 segundos. Não aplicar esse cálculo à etapa rápida, cuja complementação começa na primeira exposição do alvo (8.9.4.6(b)).
- Os cards de Pistola Standard e Tiro Rápido apresentam exemplos numéricos separados conforme ISSF 8.9.4.5(d): Standard soma os cinco menores valores entre os disparos registrados (exemplo X, 8 e repetição X, X, X, 9, 9 → 46); Tiro Rápido seleciona o menor valor em cada um dos cinco alvos e soma (exemplo → 44). X conta como 10 pontos nos exemplos.
- UI mantém a composição de conversa do ADANA, responsiva para telefone/tablet, com botão de pergunta por áudio e leitura em áudio da resposta.
- Quando mais de uma pergunta ATLAS competir, RENATE pede esclarecimento apresentando, quando disponível, o texto exato de uma pergunta existente no ATLAS como opção e simultaneamente exibe a regra local mais relacionada. Pode pedir novo esclarecimento uma vez; depois do segundo pedido apresenta a regra mais próxima e encerra novos pedidos. A resposta do usuário inicia nova pesquisa local combinando a pergunta original preservada com o esclarecimento.
- O texto original, esclarecimentos, tentativas de pesquisa e resposta/card/evidências ficam na mesma conversa local para preservar o contexto.
- A tela de PIN é um bloqueio de acesso local. Armazenar salt e verificador PBKDF2 com SHA-256 e 210.000 iterações; nunca enviar o PIN. O PIN não cifra o IndexedDB e não é autenticação de conta nem mecanismo de recuperação.
- Tela Sobre informa versões do app e biblioteca, escopo e data de corte normativa; feedback local é opcional e não altera o banco.
- Indicador de `READY_OFFLINE` só aparece após validar os recursos essenciais. Pacote incompleto/incompatível bloqueia respostas normativas e mostra instrução compreensível de recuperação.
- O conteúdo é marcado como BETA limitado; URLs externas são referência para conexão futura, nunca evidência disponível offline.

## 2. Regra de independência física e operacional

1. `RENATE/` é a raiz completa a ser enviada ao Git e transportada para outro drive, clone ou computador.
2. Todo fonte, dado importado, configuração, script, teste, imagem, ícone, índice, artefato de runtime e relatório necessário ao BETA fica dentro de `RENATE/`.
3. Nenhum build ou runtime pode importar caminhos `..\`/`../`, usar symlink/junction para fora, ler variáveis ou arquivos de configuração do ADANA, chamar APIs do ADANA, ou depender de arquivos adjacentes ao diretório RENATE.
4. A autorização pontual de consulta/clonagem de 2026-11-06 foi exercida para o inventário e as cópias registradas neste Dia 1 e está encerrada. Nenhuma nova consulta, leitura, varredura, exportação ou extração está autorizada no ADANA, incluindo sua Library, Meilisearch, arquivos, APIs, serviços, repositórios ou outros drives, sem nova autorização expressa. A SPEC de referência e o inventário já existentes dentro de RENATE não concedem autorização continuada para consultar a origem.
5. Arquivos-fonte necessários devem ser clonados/duplicados para um caminho próprio dentro da pasta RENATE antes de qualquer validação. A origem deve ser material fornecido pelo usuário, já existente em RENATE ou expressamente autorizado pelo usuário para coleta web; todo download deve ser gravado dentro de RENATE e registrado com URL, data, edição e SHA-256. Build, importador e release operam somente sobre essas cópias locais.
6. A Library própria fica em `RENATE/library/` (caminho físico relativo ao workspace) e, na raiz Git de RENATE, aparece como `library/`. Ela contém apenas os documentos necessários e efetivamente referenciados nas regras, respostas ou cards incluídos: cada fonte permitida em PDF e seu OCR correspondente, com vínculo verificável ao PDF. Não importar nem espelhar a Library inteira do ADANA, nem incluir documentos sem uso demonstrável.
7. Cada cópia importada registra identificador, nome do arquivo local, SHA-256 do PDF, SHA-256 do OCR, edição, página/trecho, regra/resposta/card que a referencia, data de entrada e licença/estado de redistribuição. Não gravar caminho privado de origem; a rastreabilidade dentro do pacote usa somente os caminhos próprios de RENATE.
8. O bundle publicado inclui todo JavaScript, CSS, fonte, ícone, asset, dado e WebAssembly necessário à consulta offline. Nada é carregado por CDN ou serviço externo.
9. Ferramentas de build são dependências de desenvolvimento declaradas e travadas em manifestos versionados dentro de RENATE. Nenhum executável ou serviço do ADANA é requisito de runtime. O navegador é a plataforma que executa a PWA; cadastro/preparação inicial e a verificação manual de atualização exigem hospedagem HTTPS e rede. O uso cotidiano e a busca não.
10. O pacote Git contém os arquivos estáticos compilados da release para que a PWA possa ser servida pelo hosting estático escolhido sem build remoto, segredo ou chamada ao ADANA. A integração inicial de lead exige o URL do projeto Supabase e sua chave publishable pública em configuração dentro de RENATE; esses valores não são segredos e devem operar sob RLS. Nenhuma chave privada/administrativa entra no pacote.

## 3. Contrato de runtime e exceções de rede

O runtime de consulta é frontend-only: não há backend próprio do RENATE. Após a preparação inicial, a aplicação não inicia tráfego de rede automático; o único fluxo pós-instalação iniciado pelo usuário é o descrito na seção 3.2. São permitidos somente os fluxos definidos nas seções 3.1 e 3.2. É proibido:

- qualquer serviço/backend próprio do RENATE, mesmo em `localhost`, loopback ou em um executável iniciado pelo aplicativo;
- Meilisearch Cloud, Meilisearch remoto, servidor Meilisearch local, MCP, Qwen, llamafile, serviço de embeddings, analytics, telemetria ou consulta ao ADANA;
- requisição de rede durante login local, busca, resposta, navegação entre cards ou abertura de evidência já empacotada;
- credenciais, chaves administrativas ou tokens de Meilisearch no bundle;
- afirmar que um SDK JavaScript do Meilisearch constitui o mecanismo de busca. Um SDK cliente que envia requisições a um host não satisfaz o contrato frontend-only.

O Service Worker deve precachear e verificar o app shell, a biblioteca, o motor de busca, os cards e seus assets. O estado `READY_OFFLINE` só pode ser exibido após checagem de schema, presença, referências e SHA-256 dos arquivos obrigatórios. Corrupção ou ausência de qualquer item essencial bloqueia respostas normativas.

### 3.4 Histórico de conversas estritamente local

1. O histórico completo de RENATE fica no armazenamento local do navegador, instalado e usado pelo PWA, preferencialmente em IndexedDB. A persistência inclui pergunta original, mensagens de esclarecimento, respostas e referências/cards exibidos. A conversa nunca é enviada ao Supabase, Vercel ou outro serviço.
2. O PWA solicita armazenamento persistente quando a API estiver disponível, mas informa que quota, política do navegador, remoção dos dados do site, limpeza ou desinstalação podem apagar o histórico. Não há sincronização nem recuperação remota.
3. A navegação lista conversas salvas no dispositivo. O usuário pode apagar conversas individuais e usar o botão **Limpar histórico** para apagar todas. A exclusão é local e sem arquivamento remoto; a exclusão total exige confirmação.
4. Atualização do app preserva o IndexedDB enquanto o schema continuar compatível. Migrações incompatíveis devem ser versionadas; uma falha não pode apagar silenciosamente o histórico existente.
5. A pergunta original deve ser gravada antes de pedir esclarecimento. Ao reabrir a conversa, o app restaura mensagens e contexto para a próxima busca local.
6. Testes verificam gravação, fechamento/reabertura, leitura, exclusão individual e exclusão total, confirmando que os registros apagados não reaparecem. Esses fluxos não podem chamar `fetch` nem serviços remotos.

O app shell e os assets estáticos usam Cache Storage/precaching; dados e índice persistentes usam IndexedDB quando o tamanho/consulta exigir. Evitar cópias desnecessárias da mesma base entre cache, memória e IndexedDB. Solicitar `navigator.storage.persist()` quando disponível, sem assumir concessão; tratar quota, eviction, perda de storage e falha de hash com recuperação compreensível. `navigator.onLine` não prova que o pacote está íntegro.

Estados de preparação herdados da referência: `INSTALLING` (download/preparação em curso), `VERIFYING` (integridade/schema/relações), `READY_OFFLINE` (perguntas/cards liberados localmente), `PACK_INCOMPLETE` (não emitir resposta normativa parcial), `PACK_INCOMPATIBLE` (bloquear uso até recuperação/atualização) e `OFFLINE_NOT_PREPARED` (orientar preparação inicial com rede).

### 3.1 Cadastro inicial e persistência de leads no Supabase

1. Na primeira visita online, RENATE apresenta cadastro/login inicial e informa a finalidade da coleta antes de solicitar os dados mínimos aprovados para o lead.
2. Após o consentimento aplicável e envio do formulário, o frontend pode fazer uma inserção na tabela de leads do Supabase usando somente a chave publishable (pública). Essa é a única mutação remota de dados de usuário no fluxo normal. Como esse INSERT é publicamente chamável, a segurança da leitura não elimina o risco de spam/escrita abusiva; R5 deve registrar e mitigar esse risco sem expor segredos ou abrir permissões de leitura.
3. A tabela deve ter RLS habilitado. A política do cliente RENATE permite `INSERT` apenas nos campos permitidos e nega `SELECT`, `UPDATE` e `DELETE` ao papel público/anônimo. A lista é acessível somente ao administrador autenticado no painel Supabase, que pode consultá-la e exportá-la em CSV. RENATE não oferece tela para listar leads.
4. É proibido incluir chave `secret`/`service_role`, credencial de administrador ou conexão SQL no frontend, no PWA ou em arquivos Git. A chave publishable não é segredo; a segurança depende de RLS, grants e validação no banco. Referência: [Supabase — segurança de dados no frontend](https://supabase.com/docs/guides/database/secure-data).
5. A chamada de inserção deve ter estados explícitos de sucesso e falha. Uma falha de rede não pode ser apresentada como persistência concluída. Retentativas devem evitar duplicação acidental quando tecnicamente possível; reinstalação, limpeza de dados ou uso de outro navegador podem produzir novo lead.
6. Campos coletados, consentimento, finalidade, retenção e procedimento de exclusão devem ser documentados antes da publicação. Coletar somente os campos aprovados. Não usar IA nessa gravação; a operação de banco não consome tokens de modelo.
7. O Supabase é o serviço escolhido para essa persistência inicial. Oracle SQL direto no navegador não é permitido, pois exigiria expor credenciais/conexão ou introduzir uma API/backend. O BETA não consulta o Supabase para autenticar, buscar conteúdo ou entregar respostas.

### 3.2 Verificação de atualização iniciada pelo usuário

1. A PWA instalada inclui o botão **Verificar atualização**. O código RENATE não faz verificação periódica, no carregamento, em background ou por push. O Gate R5 deve registrar que navegadores podem realizar sua própria verificação de atualização do Service Worker ao abrir a PWA; esse comportamento da plataforma não pode ser confundido com consulta de dados do app nem ser apresentado como totalmente desativado.
2. Somente após o toque, RENATE consulta um manifesto estático de versão hospedado junto à distribuição estática. Essa consulta não inclui PIN, dados de lead, perfil, histórico, busca ou pergunta do usuário.
3. Se não houver versão nova, informar a versão instalada. Se houver, mostrar versão, tamanho e notas da release e perguntar se o usuário deseja baixar. Sem confirmação, nenhum pacote é baixado.
4. Após confirmação, baixar a versão para staging local e validar assinatura criptográfica com chave pública embutida, SHA-256, schema, integridade, referências, licença e versão. Hash publicado ao lado do arquivo no mesmo host não autentica a origem; a release precisa de assinatura verificável. A chave privada de assinatura é segredo de release e nunca entra no pacote Git/PWA.
5. Só depois da validação integral, ativar a nova versão atomicamente e remover app shell, biblioteca, cards, modelos, caches e índice da versão anterior. O PIN permanece em armazenamento local separado quando o formato continua compatível; uma migração incompatível precisa avisar que exigirá novo PIN. Falha preserva a versão atual funcional. Nunca misturar app shell, dados e índice de versões distintas.
6. Atualizar não é reinstalar no nível do sistema operacional: a PWA mantém sua identidade/origem e o navegador aplica os novos recursos e caches. A primeira instalação continua sujeita ao fluxo e à confirmação do navegador, que variam por plataforma.
7. A verificação exige conexão e é sempre iniciada pelo usuário. Fora dessa ação, o modo offline não faz consultas remotas.

### 3.3 Login local por PIN

1. Após cadastro inicial, download e preparação, a PWA solicita que o usuário crie um PIN local. Nos usos seguintes, a tela de login pede esse PIN para desbloquear a aplicação no dispositivo.
2. Esse login não valida identidade em servidor: não consulta Supabase, não envia PIN e não renova sessão. É um bloqueio local do perfil/dispositivo, não autenticação de conta nem prova de identidade.
3. O PIN nunca é armazenado em texto aberto. Guardar somente um verificador derivado com salt individual e parâmetros versionados, aplicando atraso progressivo/bloqueio temporário após tentativas incorretas. Se for necessário proteger conteúdo local contra leitura após extração do armazenamento, usar criptografia autenticada e derivação de chave apropriadas; o PIN não protege contra atacante determinado com controle do dispositivo.
4. Esquecimento do PIN, troca de navegador/dispositivo, limpeza de dados ou reinstalação não têm recuperação remota. Um fluxo de recuperação, se implementado, deve explicar que apagará dados locais e exigirá nova preparação online, podendo gerar outro lead.
5. O PIN nunca concede acesso administrativo ou à lista de leads. Só o administrador autenticado no painel Supabase pode consultar/exportar leads.

## 4. Busca no frontend — gate técnico obrigatório

O requisito de produto é que a capacidade de busca esteja junto do frontend e dos demais arquivos do RENATE, sem backend. Meilisearch é um candidato, não uma exigência se outro motor frontend cumprir os cálculos e a qualidade de busca necessários. Isso significa **o mecanismo de busca**, e não somente a interface ou um SDK cliente.

As referências oficiais consultadas distinguem o SDK JavaScript, que funciona em browsers como cliente, do engine Meilisearch. O SDK Rust também declara suporte WASM para o cliente; isso, isoladamente, não prova que o engine completo possa indexar e consultar dentro de uma PWA. O repositório oficial identifica `milli` como biblioteca de busca do engine; a discussão oficial sobre suporte Web no `heed` (camada LMDB usada pelo engine) foi encerrada como `not planned` e explica que LMDB não compila para WASM/Web pelos requisitos de concorrência e sistema de arquivos. **Inferência técnica a validar no spike:** uma porta browser real exigiria substituir/reimplementar essa camada de armazenamento, podendo deixar de ser o engine suportado e exigindo equivalência de comportamento demonstrada. Fontes: [SDK JavaScript oficial](https://www.meilisearch.com/integrations/javascript), [repositório oficial Meilisearch Rust SDK](https://github.com/meilisearch/meilisearch-rust), [biblioteca oficial milli](https://github.com/meilisearch/milli), [issue oficial heed Web support — encerrada como not planned](https://github.com/meilisearch/heed/issues/162), [repositório do engine](https://github.com/meilisearch/meilisearch).

Antes de escolher ou implementar o motor, executar um spike independente dentro de `RENATE/` que demonstre:

1. motor executado no browser (JS/WASM), sem processo servidor, HTTP local, porta, conexão externa ou componente nativo;
2. índice e configurações de busca carregados dos arquivos RENATE, sem acesso a diretório externo;
3. consulta em modo avião após fechar e reabrir o PWA;
4. correspondência semântica e de ranking avaliada contra os casos de referência aprovados, inclusive aliases, códigos exatos, números decimais, filtros por autoridade/edição e casos de ambiguidade;
5. integridade de índice e dados verificada antes de `READY_OFFLINE`;
6. tamanho, memória, inicialização e latência medidos no navegador e em aparelho de referência quando disponível;
7. licença, dependências transitivas, compatibilidade PWA e política de atualização documentadas;
8. todo binário WASM/JS de runtime incluído e hasheado dentro de RENATE;
9. nenhuma chamada de rede no percurso de busca, resposta, regras/cards, evidência ou login local.

**Critério de decisão:** declarar `SEARCH_FRONTEND_ENGINE=PASS` somente se o motor executar no navegador sem servidor e localizar corretamente os registros do ATLAS e as passagens locais. A confirmação final de cobertura usa as 960 referências do Golden Set descrito na seção 6.3; esse manifesto não duplica perguntas/respostas. Um SDK cliente conectado a servidor, um engine executado fora do PWA ou um índice que duplique as respostas não contam como solução. **Decisão humana de 2026-11-06:** FlexSearch está aprovado como motor de RENATE. No Chromium 158, a execução de 960 casos passou 960/960 dentro de Web Worker; os três grupos ambíguos produziram esclarecimento. Isso valida a seleção do Q&A no corpus atual, não a apresentação integral de regras, cards e figuras prevista na seção 6.3. Evidências: `docs/beta-offline/SEARCH_BROWSER_960_2026-11-06.json` e `BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json`.

Se Meilisearch não puder ser embarcado como frontend autossuficiente, escolher outro motor JS/WASM compatível com o objetivo do produto, registrando licença, tamanho e resultado no teste de todas as 960 perguntas ATLAS. Se nenhum motor atender ao requisito de 100% no teste final, registrar `BLOCKED_TECHNICAL_FEASIBILITY`; não usar backend local, aplicativo nativo ou serviço remoto como substituição.

O pós-processamento não pode usar apenas posição no ranking para resolver ambiguidades. Se houver um registro ATLAS que expresse a distinção, apresentar literalmente sua pergunta como opção de esclarecimento. Após a resposta do usuário, pesquisar novamente no ATLAS local usando pergunta original e esclarecimento como contexto. Persistir ambos na mesma conversa. Pedir esclarecimento no máximo duas vezes; depois, apresentar a regra/passagem local mais próxima, identificando relação fraca quando aplicável. Não há estado de abstenção nem autorização para inventar fato.

## 5. Identidade visual, layout e voz

### 5.1 Identidade CBTE e layout ADANA

1. A paleta, tipografia e elementos de identidade visual do RENATE devem corresponder à identidade visual vigente do site oficial da CBTE (`https://www.cbte.org.br`). O Gate R0/R4 deve registrar a data de inspeção, páginas usadas, cores exatas (valores CSS/HEX), nomes/pesos das fontes e demais tokens visuais extraídos; não aproximar por memória ou por uma paleta genérica.
2. Fontes, ícones e assets necessários ao runtime devem ser empacotados dentro de `RENATE/`, sem CDN, Google Fonts remoto ou hotlink. Incluir somente arquivos cuja licença permita redistribuição e registrar licença/proveniência. Se a fonte exata não puder ser redistribuída, registrar o impedimento e apresentar fallback visualmente compatível para aprovação.
3. A identidade CBTE muda cores, tipografia e acabamento visual; a composição e interação devem seguir o layout do frontend ADANA existente: navegação/histórico lateral, área principal de conversa, hierarquia de mensagens, campo de pergunta e controles de voz, adaptados ao viewport de celular. Não alterar o ADANA para obter esse layout; copiar/adaptar os componentes permitidos para RENATE.
4. Não usar logo, selo ou marca gráfica oficial da CBTE sem que sua inclusão e redistribuição estejam autorizadas. O requisito de identidade visual por cor/tipografia não autoriza presumir licença para marca ou conteúdo institucional.
5. **Verificação do shell (2026-11-06):** Chromium 158 confirmou largura do documento sem overflow horizontal em viewports de 320, 390, 768 e 1280 px; a navegação drawer móvel abriu/fechou e alternou para navegação lateral no desktop. Os tokens, valores HEX, pesos, recursos e licenças das fontes locais ficam rastreados em `docs/beta-offline/CBTE_ADANA_VISUAL_REFERENCE.md`. Isto aceita o shell visual/responsivo, não a apresentação final dos cards ou a experiência em aparelhos reais.

### 5.2 Entrada e saída de áudio offline

1. Manter a ação de perguntar por áudio e a ação de ouvir a resposta por áudio, como no frontend ADANA. Ambas precisam funcionar no dispositivo sem conexão, incluindo em modo avião após a preparação.
2. O reconhecimento de fala e a síntese de voz devem executar localmente, com código e modelos/vozes necessários incluídos no pacote ou baixados e validados durante a preparação inicial. Não enviar gravação, transcrição, pergunta ou resposta a serviço remoto.
3. APIs nativas do navegador (`SpeechRecognition`/`webkitSpeechRecognition` e `speechSynthesis`) não contam como solução offline sem teste de modo avião, por plataforma, idioma `pt-BR`, voz instalada e prova de ausência de tráfego de rede. Se a disponibilidade offline variar, mostrar estado claro e manter digitação/leitura textual como fallback acessível; não declarar áudio offline validado.
4. Medir tamanho do modelo, tempo de primeira inicialização, latência de transcrição e síntese, memória e qualidade mínima em português brasileiro. A seleção de ASR/TTS exige licença compatível e cobertura de dispositivos-alvo; resultados devem constar do `EQUIVALENCE_REPORT.md` e do `TEST_REPORT.md`.
5. Áudio, modelos e vozes são artefatos versionados: atualizam-se somente no fluxo manual da seção 3.2 e são verificados pela assinatura/hash do pacote.
6. **Aprovação humana e proveniência ASR (2026-11-06):** o usuário aprovou Whisper Tiny multilingual como motor de reconhecimento do RENATE. Em Chromium 158, o modelo q8 reconheceu offline a amostra PT-BR sintetizada, com `allowRemoteModels=false` e sem chamadas externas. Pesos, runtime WASM, revisões fixas, atribuições, avisos e textos de licença ficam em `public/models/whisper-tiny/` e `public/onnxruntime/`; `npm run test:model-provenance` verificou 23 arquivos, 66.931.251 bytes, sem divergência de tamanho/hash. O modelo base HF declara Apache-2.0; o README do Whisper upstream declara MIT para código e pesos; o repositório do export ONNX não publica campo próprio de licença. Como as declarações upstream divergem, preservar ambas e toda a cadeia em `WHISPER_TINY_PROVENANCE_2026-11-06.md`, sem afirmar que o export publicou licença independente. O pacote documenta a base de redistribuição e inclui ambos os textos. Isso não substitui avaliação de fala humana/WER ou Android/iPhone, e o reconhecimento ainda precisa ser integrado à interface.
7. **Resultado de áudio do Dia 2:** `PASS_WITH_DOCUMENTED_AUDIO_LIMIT`. Kokoro 82M q8 executou síntese offline em inglês, mas `kokoro-js` não contém a voz PT-BR `pf_dora`; TTS PT-BR continua tecnicamente bloqueado e não foi declarado equivalente. Saída de voz permanece desabilitada até candidato PT-BR funcional e avaliado. O relatório de execução e tempos observados está em `docs/beta-offline/AUDIO_BROWSER_INFERENCE_2026-11-06.json`.
8. **Atualização de implementação e prontidão (2026-11-07):** Whisper Tiny q8 está integrado ao botão de gravação em `src/App.jsx`/`src/localSpeech.js`, com modelos locais e acesso remoto desabilitado. `npm run test:audio-browser` passou em Chromium 158 com amostra sintética PT-BR e zero solicitações externas. Após erros recorrentes em Android, o pré-processamento seleciona o canal de maior energia, remove silêncio nas bordas e normaliza volume com ganho limitado; decodificação usa três hipóteses. A suíte sintética passou após essa alteração, mas fala humana ainda precisa de reteste na versão atualizada. Antes da correção, a usuária reportou 2/6 tentativas aprovadas em Android. O preview HTTPS passou `node scripts/check_device_preview.mjs`; a usuária confirmou que abriu e leu a interface no celular. A usuária considerou PASS a validação humana de ASR no Android nesta retomada; isso não fecha teste no iPhone, quota/instalação móvel ou WER. TTS PT-BR continua bloqueado.

9. **Revisão das variantes ASR observadas (2026-11-07):** após o lote Android seguinte, `src/localSpeech.js` passou a normalizar variantes contextuais observadas (`Itiro`, `sportivo`, `ábirto`, `noventivos`) sem impor a transcrição integral. As entradas textuais foram exercitadas contra o normalizador e a suíte sintética segue `PASS`; ainda falta confirmação humana do fluxo final no Android. O registro detalhado está em `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`.

10. **Reversão da normalização lexical (2026-11-07):** após novo lote humano em Android, a usuária pediu retornar à configuração anterior e limitar ajustes. A substituição contextual de palavras foi removida; a UI volta a exibir a transcrição bruta. Mantêm-se as melhorias anteriores de pré-processamento do sinal e busca de três hipóteses, ainda sem aceite humano nesta configuração revertida. Resultado e próximos passos em `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`.

11. **Restauração do caminho de áudio da primeira passagem (2026-11-07):** a usuária relatou que o resultado continuava pior que na primeira passagem e pediu reversão. Restaurada a mistura simples de canais; removidos seleção de canal, corte de silêncio, ganho limitado e `num_beams: 3`. A transcrição continua local, bruta e editável. O preview foi reconstruído; a configuração aguarda nova gravação Android. Histórico em `docs/beta-offline/ASR_HUMAN_DEVICE_VALIDATION_2026-11-07.md`.

12. **Acessibilidade visual por áudio (2026-11-08):** ícone no topo ativa/desativa a leitura; ao ativar, fala somente os cards da resposta mais recente, e cards de respostas novas são lidos enquanto ativa. Mouse sobre link/trecho do assistente por 3 segundos e foco por teclado com a mesma espera leem apenas o texto daquele alvo; desativar cancela fala e fila. Para evitar fallback remoto, só é aceita voz `pt-BR` que o navegador reporte como local (`localService`). Sem essa voz, a interface mantém todo conteúdo textual e informa a indisponibilidade. Esta implementação de UX não é prova de TTS offline: voz instalada, modo avião e Android/iPhone ainda precisam ser validados; o candidato TTS empacotado continua sujeito a revisão auditiva e licença conforme `TTS_PIPER_PTBR_SPIKE_2026-11-08.md`.

### 5.3 Aceite técnico do Dia 2

O aceite do Dia 2 é `PASS_WITH_DOCUMENTED_AUDIO_LIMIT`, detalhado em `docs/beta-offline/DAY2_ACCEPTANCE_REPORT_2026-11-06.md`:

- FlexSearch 0.8.212 em Web Worker selecionou 960/960 Q&A/casos, com três grupos de esclarecimento previstos e zero falhas. Isso não é o teste final de resposta normativa com apresentação de fontes/cards.
- Chromium 158 validou shell responsivo, gravação/restauração de histórico e pesquisa offline por Service Worker, sem chamadas externas.
- Whisper Tiny foi aprovado pelo usuário, empacotado com cadeia de proveniência/licenças e passou inferência offline na amostra sintetizada.
- `npm run build` passou; precache de 36 itens/69.988.565 bytes. `npm run test:history` passou 3/3 e `npm audit` retornou zero vulnerabilidades.
- TTS PT-BR é bloqueio técnico documentado. No aceite original de 2026-11-06, fala humana, WER, integração ASR na UI e aparelhos reais permaneciam pendentes; a atualização de implementação/prontidão de 2026-11-07 está registrada acima. Fala humana, WER e captura nos aparelhos reais continuam pendentes.

## 6. Q&A do ATLAS e fluxo de resposta

O snapshot local `data/imports/day1_2026-11-06/atlas/atlas_qa_route_candidates_2026-11-06.jsonl` é a fonte direta do banco conversacional: os 960 registros aprovados são carregados e pesquisados pelo RENATE, sem chamada online ao ATLAS e sem cópia manual para outro FAQ. O índice derivado guarda referências aos registros. `pretests/atlas_golden_set_manifest_2026-11-06.json` contém um caso de teste por ATLAS ID, com hashes e expectativa determinística; não contém texto de pergunta/resposta e não é lido pelo runtime. O arquivo de associação ALPHAOMEGA classifica 43 registros do mesmo conjunto e não cria respostas adicionais.

O sidecar `atlas/atlas_source_bindings_2026-11-06.jsonl` resolve os IDs de fonte do snapshot para caminhos PDF/OCR e hashes dentro de `RENATE/library/`. O runtime usa esse vínculo local; não tenta abrir os caminhos originais preservados em `source_references.path` do snapshot de entrada.

### 6.1 Dados e proveniência

Preservar pergunta, resposta original, ID ATLAS, autoridade, rota ou classificação ALPHAOMEGA, referências normativas, edição, localizadores, hashes e estados de origem. A aprovação humana registrada pelo usuário em 2026-11-06 autoriza todos os Q&A importados para uso no RENATE. Pretestes e rollups permanecem como evidência histórica/proveniência; não formam outro banco conversacional nem condicionam a entrada dos Q&A aprovados.

Não reescrever as respostas ATLAS. Não fabricar correspondências quando houver colisão ou ambiguidade: pedir esclarecimento. Para uma pergunta sem correspondência no ATLAS, consultar as passagens da Library local segundo a seção 6.3.

### 6.2 Confiança e aprovação humana dos OCRs

Por decisão explícita do usuário em 2026-11-06, todos os OCRs incluídos na Library RENATE são considerados fontes confiáveis e têm aprovação humana para uso no banco offline. O OCR pode sustentar recuperação e resposta dentro do escopo do documento ao qual está vinculado. Para cada OCR, preservar SHA-256 próprio, vínculo com o PDF de origem, autoridade, edição e localizadores. A aprovação do OCR não altera o conteúdo do documento original nem dispensa a identificação da regra/página usada na resposta.

### 6.2.1 Q&A do ATLAS aprovado como fonte

Por decisão explícita do usuário em 2026-11-06, todas as perguntas e respostas registradas no ATLAS são consideradas confiáveis, corretamente referenciadas, revisadas e aprovadas por humano para uso no RENATE. A origem deve ser identificada como `ADANA20`; os registros do ATLAS são aceitos como fonte/evidência para compor respostas offline, preservando pergunta, resposta, identificador ATLAS, rota classificada, autoridade, regra/localizador, referências de fonte, edição, hashes e estados originais disponíveis. A aprovação humana registrada para RENATE é a decisão do usuário e prevalece como autorização de uso mesmo que campos originais como `atlas_review_status` ou `answer_key_status` continuem com valores de origem; não alterá-los. A classificação para uma rota deve ser única ou explicitamente marcada como compartilhada/ambígua. A aprovação ATLAS compõe o status de governança RENATE por rota, junto com o estado original ADANA20, cobertura de fontes e disponibilidade dos registros; não reescreve o status original armazenado em ADANA20. A auditoria de RENATE deve registrar separadamente o estado de aprovação/proteção importado de ADANA20, a cobertura de fontes locais e a contagem/classificação de Q&A ATLAS por rota; a camada composta é própria do RENATE e nunca equivale por si só a `LOCKED` em ADANA20.

### 6.2.2 Rota suplementar RENATE `ALPHAOMEGA`

Os Q&A do ATLAS sem qualificação/classificação de rota em ADANA20 estão revisados e aprovados por humano, conforme confirmação do usuário em 2026-11-06. Os 43 registros identificados no snapshot estão associados, pela pergunta, à rota suplementar do RENATE `renate.alphaomega` (`ALPHAOMEGA`). Essa associação por pergunta é uma operação de organização/classificação no RENATE, não uma nova revisão humana do conteúdo nem uma aprovação pendente. Preservar status, conteúdo, IDs, referências e proveniência de ADANA20; registrar separadamente a rota original ausente e a rota suplementar RENATE. `ALPHAOMEGA` é uma identidade RENATE e não acrescenta, substitui ou renomeia nenhuma das 62 identidades ADANA20.

### 6.3 Apresentação e critério de PASS

**Aditivo de apresentação — 2026-11-08:** para reduzir a quantidade de conteúdo simultâneo na tela, a ordem da resposta é: (1) card(s) aplicáveis; (2) resposta do Q&A e, quando existirem, perguntas pertinentes já registradas; (3) links locais dos regulamentos citados; (4) detalhes recolhidos inicialmente no disclosure **“Deseja ver mais passagens sobre o assunto?”**. Ao abrir o disclosure, apresentar as passagens e figuras pertinentes, além dos metadados de proveniência que antes apareciam em sequência. Isso altera apenas a organização e a visibilidade inicial: não remove conteúdo, não reescreve respostas/passagens, não altera busca, roteamento, evidência, links ou leitura acessível. Os requisitos de completude e proveniência abaixo continuam válidos. Perguntas pertinentes só são mostradas quando já fornecidas pelo Q&A/fluxo de esclarecimento; não criar sugestões artificiais.

1. **Pergunta encontrada no ATLAS:** apresentar a resposta ATLAS sem reescrita. Se houver card pronto e pertinente à prova, equipamento ou armamento, apresentá-lo; não mostrar placeholder nem card incompleto. Exibir a ação **Consultar passagens da regra**; ao acioná-la, mostrar todas as passagens selecionadas, cada uma com cabeçalho contendo regulamento, data de vigência e artigo/localizador, seguido do texto. Cada resposta também mostra links para abrir os PDFs completos locais citados. O menu permanente **Biblioteca de regras** permite localizar e abrir qualquer regulamento do pacote antes de fazer uma pergunta. Assim, ler a regra completa é uma escolha direta do atleta, sem etapa de esclarecimento ou pergunta intermediária. Para perguntas de equipamento, medidas, armamento ou controle, o recorte PNG local pertinente aparece acima das passagens.
2. **Imagem de regra/equipamento:** quando houver figura pertinente no PDF local, preparar antes do build um recorte da página, salvá-lo como PNG e vinculá-lo à fonte, edição, página e hash de origem. Preservar a figura e seus rótulos/contexto; não redesenhar nem inventar conteúdo. Exibir o PNG visualmente acima das passagens normativas.
3. **Pergunta não encontrada no ATLAS:** apresentar diretamente o PNG pertinente, se houver, seguido de todas as passagens selecionadas na Library, com regulamento, data de vigência, artigo/localizador e texto. Não exigir botão para revelar a regra.
4. **Pergunta ambígua ou sem resposta exata:** pesquisar ATLAS, respostas de pretestes com status gravado `PASS` e toda a Library allowlisted. Pedir esclarecimento no máximo duas vezes e, desde o primeiro pedido, apresentar passagem local relacionada. Depois do segundo pedido, encerrar perguntas e exibir a passagem mais próxima disponível, identificando regulamento, edição/vigência, artigo/localizador e PDF. A abstenção não é permitida mesmo se nenhuma passagem for suficiente: mostrar a mais próxima e indicar relação fraca, sem afirmar que responde ao fato solicitado nem atribuir conteúdo que ela não contém. Nunca entregar resposta vazia, recusa ou fato normativo inventado.
5. **Teste final:** executar os 960 casos referenciados pelo Golden Set sobre o snapshot ATLAS. O resultado é `PASS` somente com 100% de seleção correta do registro ATLAS e da resposta aprovada quando houver correspondência, apresentação das fontes/cards/figuras aplicáveis e fallback de passagem local nos casos sem correspondência exata/ambíguos; zero respostas vazias, fatos normativos inventados ou respostas incorretas. Os três grupos de pergunta normalizada com respostas conflitantes pedem esclarecimento e mostram regra local no mesmo turno; após dois pedidos, mostram a passagem local mais próxima. A aprovação deve também publicar a matriz de cobertura de todas as 62 rotas e o inventário de todos os cards configurados, marcando explicitamente rotas sem casos e rotas sem card. Ausência de card não autoriza criar conteúdo automaticamente.

**Resultado de Chromium 158 (2026-11-06): avaliação do conjunto coberto `PASS`.** Nos 960 casos: 960/960 respostas e conjuntos de fontes esperados, 960/960 localizadores e passagens locais com hash PDF/OCR, cabeçalho e texto válidos. Os 45 casos com card aplicável apresentaram card e foto locais (45/45). Foram configurados 33 recortes PNG locais; os 812 casos que retornaram figura passaram verificação de hash/proveniência (812/812), e nove perguntas críticas passaram associação figura-pergunta explícita (9/9). A integridade desses recortes não prova que toda figura de rotas sem casos tenha sido mapeada. O catálogo importado contém 31 definições por fase em 15 rotas; 30 têm asset e são cards runtime, e R6 `both` permanece sem asset. Há três cards de equipamento no catálogo. Os 30 cards ativos usam skin P6, com ordem textual e imagens locais. P6 qualificação/final têm aprovação humana por hash; para os outros 29 o catálogo de origem não registra estado de revisão, preservado no manifesto. Foram clonados 84 assets e os SVG originais estão arquivados em `public/renate-pack/cards/old_cards/`. A pergunta deve identificar diretamente o evento para exibir seu card. Cinco das 62 rotas não têm caso ATLAS neste snapshot e, portanto, não foram avaliadas pelo conjunto de testes. A avaliação testa integridade e apresentação vinculada, não substitui análise semântica humana de cada norma. O menu permanente **Biblioteca de regras** permite abrir e filtrar os PDFs completos sem iniciar conversa; cada resposta também liga ao PDF completo da fonte. Ver os relatórios de conteúdo, runtime e cobertura por rota.

### 6.3.1 Auditoria de figuras e acesso à norma integral

- O catálogo atual contém 33 recortes locais extraídos dos PDFs da Library, ligados à fonte, edição, página e hash. Abrange alvos CBTE/ISSF, empunhaduras, roupa e calçado de tiro, mecanismos/adaptações de gatilho e equipamentos de suporte WSPS, além dos recortes anteriormente cadastrados.
- Para os 960 Q&A presentes no snapshot, não há imagem adicional pendente de busca pela usuária: as nove associações críticas figura-pergunta passaram e os 812 resultados que retornaram recorte têm hash/proveniência válidos. Não interpretar 812/812 como prova de exaustividade visual para questões não testadas.
- As rotas `cbte.cmp.rimfire_sporter`, `cbte.shotgun.automatic_trap`, `cbte.shotgun.issf`, `cbte.shotgun.trap_nacional` e `issf.event.14` não têm Q&A no snapshot. Suas necessidades de figura permanecem indeterminadas até haver perguntas e relações normativas locais que permitam identificá-las; não inventar nem solicitar imagens sem essa identificação.
- O atleta pode abrir **Biblioteca de regras** pela navegação permanente, filtrar e abrir qualquer PDF incluído no pacote sem fazer uma pergunta. Respostas também mantêm link local ao PDF completo citado; figuras aplicáveis aparecem acima das passagens quando a regra é consultada. O fluxo é local e não usa requisição externa.
- Evidência detalhada: `docs/beta-offline/FIGURE_APPLICABILITY_AUDIT_2026-11-06.md`; captura de resultados: `docs/beta-offline/CONTENT_PRESENTATION_960_2026-11-06.json` e `docs/beta-offline/FIGURE_BROWSER_TEST_2026-11-06.log`.

## 7. Regras, fontes, cards e seleção da biblioteca

- O conteúdo normativo deve vir dos snapshots explícitos em RENATE e manter ID, autoridade, edição, regra/localizador e hash de origem.
- Cards devem preservar IDs, todos os fatos/textos e a ordem de origem. Por decisão do usuário em 2026-11-06, a skin visual comum pode ser redesenhada seguindo o modelo mais completo P6; os arquivos originais são arquivados em `old_cards/` com SHA-256. ID de card é distinto de ID de rota e de regra.
- **Decisão expressa do usuário em 2026-11-07:** cards são evidência normativa no RENATE. A UI deve apresentá-los como tal e mostrar as fontes locais, edição e localizadores que sustentam seus fatos. Um arquivo de imagem desacompanhado dessas referências não serve como prova; o card deve continuar vinculado às passagens e aos Q&A aprovados que lhe dão suporte.
- Snapshot `data/imports/adana_cards_2026-11-06/`: 31 definições de fase em 15 rotas, 3 cards de equipamento e 84 assets clonados, hash-verificados e empacotados em RENATE. Trinta definições de fase com asset usam skin comum; `wsps.event.r6:both` fica fora do runtime por não possuir asset. O catálogo preserva os estados de revisão de origem. Os quatro cards olímpicos derivados são locais a RENATE, usam fatos das respostas aprovadas do complemento e referenciam o PDF ISSF local por edição e locadores. O seletor exige identificação direta do evento e filtra Skeet/Fossa por modalidade.
- O manifesto local identifica Q&A ATLAS, respostas de pretestes elegíveis, regras, cards, fontes e assets necessários. Respostas de pretestes com status gravado `PASS` entram no banco suplementar, preservando o caso, status, pergunta, resposta, evidências e vínculos; candidatos sem `PASS` ou com fonte normativa não vinculada localmente não são promovidos como resposta normativa. O Golden Set só referencia IDs e hashes para executar testes; não duplica Q&A ATLAS nem alimenta o runtime.
- PDF e documento integral só são incluídos quando sua redistribuição está autorizada e seu tamanho foi medido. URL externa é referência para consulta posterior e não evidência offline.
- A origem e a aprovação humana do ATLAS são preservadas como proveniência; no runtime offline o snapshot local de RENATE é imutável e mostra a data/versão de corte.

## 8. Estrutura autocontida obrigatória

Adaptar a estrutura sem criar referências externas:

```text
RENATE/
  RENATE_BETA_OFFLINE_SPEC_V1.md
  ADANA20_BETA_OFFLINE_SPEC_CODEX.md
  package.json
  package-lock.json
  index.html
  vite.config.*
  src/                    # app React/PWA, busca e renderização
  public/                 # manifest, SW, ícones, app shell
  supabase/               # migrations, tabela de leads e políticas RLS (sem segredos)
  data/
    imports/              # snapshots filtrados, hashes e origem
    beta-pack/            # manifesto, FAQ, regras, cards, fontes, índice
    beta-allowlist.json
  assets/                 # cards/figuras/fontes/modelos ASR-TTS efetivamente exportados
  scripts/                # import, export, validação, build, auditoria
  tests/                  # busca, FAQ, proveniência, integridade, offline
  dist/                   # release estática versionada e servível
  docs/beta-offline/      # Gates, guia admin dos leads e relatórios de aceite
```

O layout pode variar se o inventário justificar. A propriedade invariável é que cada dependência da aplicação esteja dentro da raiz RENATE. Scripts devem resolver caminhos a partir de seu próprio arquivo, não do `cwd` do ADANA. O build deve ser reproduzível com os manifests/lockfiles guardados em RENATE e consumir apenas `data/` e `assets/` locais.

## 9. Gates próprios do RENATE

| Gate | Saída obrigatória |
|---|---|
| **R0 — Inventário e baseline** | Usar apenas o mapa histórico já registrado em `docs/beta-offline/GATE0_INVENTARIO.md`; nenhuma reabertura, inspeção ou execução no ADANA. Manter o resultado como parcial/aberto devido à divergência de hash registrada. |
| **R1 — Snapshot autocontido** | Cópias filtradas em RENATE, allowlist, licença/portabilidade, hashes e auditoria de inclusões/exclusões; Golden Set referencial e reproduzível; nenhum arquivo runtime externo. |
| **R2 — Busca frontend** | Selecionar um motor JS/WASM que execute no browser e consulte o snapshot ATLAS e a Library locais; sem servidor ou banco intermediário. |
| **R3 — Q&A e apresentação** | Usar diretamente os 960 Q&A aprovados do ATLAS; mostrar card, passagens e figuras conforme a seção 6.3. |
| **R4 — Aplicação, identidade, voz e cards** | UI com identidade visual CBTE e composição conversacional de referência; conversa determinística, regras/fontes/cards, fallback obrigatório em ambiguidade, limite de esclarecimento, ASR/TTS local. Sem alteração de componentes/rotas do ADANA. |
| **R5 — Integrações após PASS local** | Antes de qualquer implementação Supabase, atualizar e confirmar o aceite: motores aprovados pelos critérios da SPEC ou bloqueios técnicos documentados; shell responsivo testado; tokens visuais/fontes rastreáveis; sem equivalências presumidas após falha. Só então, e após o PASS local de 100% nas respostas e apresentações aplicáveis, configurar Supabase para lead inicial. Hosting Vercel/HTTPS e testes Android/iPhone vêm depois. |
| **R6 — Teste final local** | Executar as 960 perguntas ATLAS; `PASS` exige 100% de acerto e apresentação correta de resposta, passagens, cards e figuras aplicáveis. Não executar suíte nem comparar hashes no ADANA. |
| **R7 — Release** | `dist/` versionado dentro de RENATE, comandos, instrução de hosting/instalação, relatórios e pendências reais em Android/iOS. |

**Gate móvel — atualização 2026-11-08:** acesso à prévia atual na URL LAN `https://192.168.1.12:4173/` está `PASS` por confirmação da usuária; o host respondeu HTTP 200 e serviu o bundle atual sem reinício. Em UI responsiva 390 × 844 px, as quatro perguntas de falha ISSF exibiram o card vinculado à rota correspondente como primeiro card (4/4). Esse subgate não fecha instalação, quota, reabertura offline, TTS em aparelho nem revisão visual em Android físico/iPhone.

## 10. Relatórios e comandos

Todos estes artefatos ficam em `RENATE/docs/beta-offline/`:

- `GATE0_INVENTARIO.md`
- `SEARCH_FRONTEND_FEASIBILITY.md`
- `EXPORT_AUDIT.md`
- `EQUIVALENCE_REPORT.md`
- `CBTE_ADANA_VISUAL_REFERENCE.md`
- `AUDIO_OFFLINE_FEASIBILITY.md`
- `SUPABASE_LEADS_ADMIN_GUIDE.md`
- `TEST_REPORT.md`
- `RELEASE_NOTES.md`

Os comandos de validação/build (`beta:import`, `beta:export`, `beta:validate`, `beta:test`, `beta:test:offline`, `beta:build`, `beta:preview`, `beta:audit`) são declarados no `package.json` dentro de RENATE. Nenhum deles pode alterar arquivos fora de RENATE. Teste manual em dispositivo real é reportado como pendente se não tiver sido executado.

O aceite final declara separadamente `IMPLEMENTADO`, `VALIDADO` e `PENDENTE`. Um bloqueio técnico no Gate R2, no áudio offline ou na atualização assinada não pode ser encoberto por resultado de build ou resposta canned de FAQ.

O relatório final também registra o caminho de `dist/`, comandos concretos de build/preview/teste, versão e cobertura do pacote, hashes/contagens, logs resumidos, diferenças entre baseline RENATE e release, screenshot se disponível, modelo/versão do navegador/SO nos testes móveis e `git diff --stat` quando RENATE tiver metadata Git. Como o ADANA está bloqueado, não executar a parte da referência que requer suíte antes/depois do ADANA; registrar essa exceção, não um PASS presumido.

## 11. Imutabilidade do ADANA principal

O Gate R0 registra hashes e estado Git históricos disponíveis no inventário. Fora da autorização pontual de coleta registrada abaixo, o ADANA principal está bloqueado para qualquer ação de RENATE: não inspecionar seu estado Git, executar testes, iniciar serviços, extrair dados/assets, comparar hashes, editar arquivos, alterar aprovações ou publicar integrações. Não declarar que a origem ADANA está atualmente inalterada; reportar apenas o baseline histórico de GATE0.

### 11.1 Aditivo humano de coleta — 2026-11-06

Para a tarefa específica do Dia 1, o usuário autorizou coleta/clonagem de materiais definidos para RENATE. Os 11 pareamentos web anteriormente registrados permanecem descritos nos relatórios de origem, URLs e hashes. Em retomada, o usuário autorizou especificamente buscar e copiar três PDFs correspondentes a OCRs órfãos. Esses arquivos foram copiados apenas para RENATE, hash-verificados e ligados aos OCRs preexistentes. O manifesto e a allowlist atuais contêm 31 PDFs e 50 OCRs; a auditoria local de paths, hashes, edições, licenças declaradas, aprovações OCR e relações fechou R1 para o pacote de dados. Nenhuma escrita ocorreu em ADANA. A classificação de rota do Planejamento Técnico CAR/PST 2026 permanece a confirmar, pois o snapshot o associa a `cbte.shotgun.trap_nacional`.

## 12. Critério final de sucesso

Uma pasta `RENATE/` clonada isoladamente contém a aplicação, Library, snapshot ATLAS usado diretamente, cards, motor de busca, assets, scripts, testes, relatórios e build PWA. Em hospedagem estática, a pessoa cadastra o lead uma vez, prepara os recursos, instala o PWA e define um PIN local. Depois pode reabrir em modo avião, perguntar por texto ou áudio, receber a resposta ATLAS e consultar passagens/cards/figuras locais. O teste final percorre todas as 960 perguntas e só passa com 100% de acerto.

O RENATE consulta diretamente o snapshot local do ATLAS. O teste final percorre todas as 960 perguntas desse snapshot e só declara `PASS` com 100% de acerto e apresentação correta dos materiais aplicáveis. Nenhum conjunto duplicado intermedeia os dados ou define a aprovação.

**FIM DA SPEC `RENATE_BETA_OFFLINE_V3.0`.**
