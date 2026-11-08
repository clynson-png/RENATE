# Plano de trabalho de 5 dias — RENATE BETA Offline

**Plano criado:** 2026-11-05  
**Duração:** cinco dias úteis; datas sugeridas: 06, 09, 10, 11 e 12/11/2026.  
**Contrato atualizado:** SPEC RENATE v1.6. Todo trabalho, teste, artefato e build fica dentro de `RENATE/`. A autorização pontual de coleta em ADANA20 para o Dia 1 foi usada e encerrada; qualquer nova consulta exige nova autorização expressa.

### Nota de execução — Dia 1, 2026-11-06

Após a leitura deste plano, o usuário concedeu autorização pontual para coletar/clonar para RENATE os objetos enumerados na mensagem de 2026-11-06. Essa exceção vale somente para a coleta registrada em [`EXPORT_AUDIT.md`](EXPORT_AUDIT.md); não autoriza editar ADANA, executar serviços/testes, ampliar o conjunto, nem fazer novas coletas depois de hoje.

## Pré-condições para cumprir o prazo

O plano foi elaborado para receber o material abaixo dentro de `RENATE/`. A nota de execução registra a exceção de coleta concedida para o Dia 1:

- snapshot allowlisted de regras/fontes e seus metadados, hashes, edições, localizadores e licenças;
- cópias locais independentes dos documentos necessários e efetivamente referenciados nas respostas/cards; somente esses PDFs e seus OCRs serão admitidos em `RENATE/library/` (no pacote Git, `library/`). A coleta e o fechamento dos 11 pareamentos OCR foram concluídos em 2026-11-06; a Library cobre 28/28 PDFs;
- respostas e perguntas dos pretestes, resultados/evidências individuais e estados de aprovação;
- configuração, IDs, imagens/assets de cards autorizados e hashes;
- golden set aprovada, com IDs esperados de regra, rota, card, fonte e status;
- referências visuais permitidas do layout ADANA (capturas ou cópias previamente colocadas em RENATE);
- dados públicos de configuração do projeto Supabase (URL e publishable key), sem segredo; credencial administrativa continua apenas no painel Supabase;
- acesso a pelo menos um Android e um iPhone para executar a validação real, ou aceitação explícita de que esses testes ficarão pendentes.

O pacote estático precisa ser hospedado em uma origem HTTPS para instalação PWA, inserção inicial de lead e teste do fluxo de atualização. A chave privada de assinatura da release não pode ser gravada no Git/PWA.

Observação: 
Supabase, Vercel/HTTPS e testes em Android/iPhone são etapas posteriores; não bloqueiam o trabalho no pacote offline local.
A sequência para determinar o pre-dia 1 terminado é:
1. Construir e testar o núcleo offline em ambiente controlado local: conteúdo, busca, respostas, cards, PIN e áudio.
2. Aprovar uma golden set que cubra as rotas pretendidas. A atual, com 24 casos de P4/P5, não basta para validar cobertura mais ampla.
3. Só depois integrar o Supabase para o cadastro inicial de leads.
Hospedar no Vercel com HTTPS e validar instalação e atualização da PWA.
Fazer então os testes reais em Android e iPhone.


**Estado do Dia 1:** os 11 PDFs antes sem OCR foram baixados de fontes oficiais, validados por SHA-256 e receberam texto pareado; o relatório registra URLs, edições e hashes. A associação do Planejamento Técnico CAR/PST 2026 à rota `cbte.shotgun.trap_nacional` requer revisão antes de seu uso como evidência. Não consultar ADANA sem nova autorização.

## Dia 1 — Recepção, inventário RENATE e pacote de dados

**Objetivo:** fechar a entrada de material e tornar a primeira biblioteca reproduzível.

- Confirmar que cada arquivo de entrada está fisicamente dentro de `RENATE/`; registrar origem declarada, SHA-256, licença, escopo e versão.
- Confirmar os documentos copiados para RENATE e usar o relatório de cobertura PDF/OCR para fechar as lacunas; a autorização pontual de coleta do Dia 1 está encerrada.
- Criar `RENATE/library/` (na raiz Git: `library/`) como corpus próprio e mínimo; manter um PDF por documento referenciado e o OCR correspondente, vinculando OCR ao hash do PDF, edição, página/trecho e licença. Não armazenar documentos sem uso comprovado na allowlist.
- Validar allowlist, schema e relações dos pretestes, respostas, regras, fontes, cards e assets recebidos.
- Excluir com motivo qualquer registro sem `PASS` elegível, aprovação aplicável, proveniência completa ou redistribuição autorizada.
- Montar o golden set com gabaritos determinísticos; não promover perguntas exploratórias a gabarito.
- Criar/atualizar `EXPORT_AUDIT.md` e fechar o Gate R1 somente se os pacotes forem verificáveis.

**Saída/aceite:** corpus mínimo PDF+OCR, snapshot versionado e auditado dentro de `RENATE/`, allowlist revisada e contagens reproduzíveis. Cada PDF/OCR deve estar ligado a uma referência usada e ter proveniência/licença verificáveis. Se os arquivos não estiverem dentro de RENATE, parar e registrar bloqueio; não consultar ADANA nem modificar origem externa.

## Dia 2 — Viabilidade técnica e fundação da aplicação

**Objetivo:** escolher tecnologias que executem no browser e criar o shell do PWA.

- Comparar Meilisearch com candidatos JS/WASM locais na mesma golden set; medir cobertura, códigos exatos, aliases, ranking, ambiguidade, tamanho, memória e latência.
- Testar opções de ASR/TTS que funcionem em português brasileiro sem serviço remoto; medir tamanho dos modelos e confirmar licença.
- Extrair do site CBTE cores, fontes e pesos, registrando evidência/licença em `CBTE_ADANA_VISUAL_REFERENCE.md`.
- Implementar dentro de `RENATE/` o shell React/Vite, manifest, estados de instalação e Skin com identidade CBTE e composição ADANA a partir das referências entregues.
- Registrar decisões de engenharia e limites reais em `SEARCH_FRONTEND_FEASIBILITY.md` e `AUDIO_OFFLINE_FEASIBILITY.md`.

**Saída/aceite:** motores aprovados pelos critérios da SPEC ou bloqueios técnicos documentados; app shell responsivo e tokens visuais rastreáveis. Não fingir equivalência se um candidato falhar.

## Dia 3 — Produto funcional: conversa, cards, PIN, leads e voz

**Objetivo:** conectar conteúdo elegível à experiência de pergunta/resposta.

- Implementar importador/validador que consome somente snapshots locais e gera o pacote RENATE versionado.
- Garantir que a busca consulte apenas o corpus local allowlisted `RENATE/library/` (na raiz Git, `library/`); o OCR serve para recuperação textual, e o PDF preserva a fonte consultável e os localizadores. Respostas/cards sem vínculo com documentos desse corpus ficam fora do pacote.
- Implementar recuperação determinística, aliases aprovados, deduplicação e banco local suplementar das respostas de pretestes `PASS`. Não há abstenção: pedir esclarecimento no máximo duas vezes e apresentar a regra local relacionada desde o primeiro pedido; depois do segundo, apresentar a regra local mais próxima sem nova pergunta.
- Renderizar os cards locais autorizados em um único modelo responsivo com foto, preservando textos/blocos, ordem, identidade, regras e fontes; arquivar os SVGs de layout anterior em `old_cards/` sem apagar os originais do snapshot.
- Integrar Whisper Tiny ASR offline à interface; manter digitação acessível. TTS só pode ser ativado após candidato PT-BR passar teste offline; Kokoro JS continua reprovado e a leitura textual permanece disponível.

**Saída/aceite:** perguntas cobertas produzem resposta registrada, fontes e cards locais corretos; perguntas ambíguas pedem esclarecimento até duas vezes e mostram regra local em cada resposta; depois apresentam a regra mais próxima, sem abstenção ou conteúdo inventado; lead não pode ser lido pelo cliente; busca e ASR não acessam rede; TTS falho permanece explicitamente bloqueado.

## Dia 4 — PWA completa, armazenamento e atualização manual

**Objetivo:** operar após fechar/reabrir e aplicar updates de forma segura.

- Implementar precache e armazenamento local; validar app shell, índice, dados, cards, modelos, hashes e schema antes de `READY_OFFLINE`.
- Cobrir `INSTALLING`, `VERIFYING`, `READY_OFFLINE`, `PACK_INCOMPLETE`, `PACK_INCOMPATIBLE` e `OFFLINE_NOT_PREPARED`.
- Implementar botão de atualização: consulta de versão somente após toque, confirmação antes do download, validação de assinatura e pacote em staging.
- Aplicar release atomicamente; simular cancelamento, arquivo corrompido e interrupção; preservar versão funcional anterior em falha.
- Verificar em DevTools/logs de rede a ausência de chamadas da aplicação durante PIN, busca, resposta, áudio e cards offline. Registrar a possível verificação de Service Worker feita pelo próprio navegador.
- Implementar e revisar varredura de bundle, CSP e ausência de segredos/endpoints não permitidos.
- Implementar avaliação com fala humana e em celulares
- Implementar captura inicial de lead pelo Supabase com chave pública e política RLS insert-only; documentar leitura/exportação exclusiva pelo administrador.
- Implementar PIN local sem envio ao Supabase e estados de bloqueio/recuperação local.

**Saída/aceite:** PWA fecha/reabre em modo avião,  lead não pode ser lido pelo cliente; mantém PIN e pacote íntegro e só troca conteúdo após confirmação e verificação.

## Dia 5 — Regressão, dispositivos, relatórios e release

**Objetivo:** provar o escopo entregue e preparar pacote portátil.

- Executar testes unitários, integração, golden set 100% nos campos críticos, negativos de códigos/edições e auditoria de integridade.
- Executar testes de rede/offline após reinício, perda de cache/quota, pacote corrompido, update interrompido e PIN.
- Testar instalação e reabertura em modo avião em Android e iPhone disponíveis; anotar modelo, versão do SO, navegador e resultado.
- Fazer revisão visual da Skin e comparação dos cards com referências fornecidas; verificar tamanhos/licenças de fontes, imagens e modelos de voz.
- Gerar `dist/` dentro de RENATE; executar build/release e varredura final de caminhos/dependências externos à pasta.
- Entregar `EQUIVALENCE_REPORT.md`, `TEST_REPORT.md`, `RELEASE_NOTES.md`, guia de instalação, caminho do build, comandos, hashes/contagens e pendências.
- Atualizar `README.md` e este briefing com resultados reais. Não executar suíte, comparação de hash ou qualquer outra ação no ADANA.

**Saída/aceite:** pacote clonável/transportável inteiramente em `RENATE/`, com status separado `IMPLEMENTADO`, `VALIDADO` e `PENDENTE`. Qualquer teste móvel indisponível permanece pendente; nenhum PASS é inferido.

## Critérios de conclusão do projeto

- Aplicação React/Vite/PWA independente dentro de RENATE, com Skin CBTE e layout de conversa ADANA.
- Pergunta por texto e áudio; resposta local por texto e áudio em português brasileiro, com prova offline.
- Regras, cards e banco conversacional importados somente de snapshots elegíveis, com origem, hash, licença e proveniência.
- Login local por PIN; inserção de lead no Supabase apenas no primeiro cadastro, sem leitura no cliente.
- Motor de busca sem servidor e aprovado na golden set.
- Instalação, atualização manual assinada, armazenamento e reabertura offline validados.
- Relatórios previstos, release estática e todos os arquivos necessários dentro de `RENATE/`.
- Nenhuma ação no ADANA principal; status histórico de Gate 0 e testes do ADANA não são reclassificados como validação RENATE.
