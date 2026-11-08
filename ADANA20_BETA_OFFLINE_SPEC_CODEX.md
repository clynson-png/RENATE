# ADANA 20 — SPEC DE IMPLEMENTAÇÃO DO BETA OFFLINE

**Identificador:** `ADANA20_BETA_OFFLINE_V1`  
**Versão do documento:** 1.0  
**Data:** 2026-11-05  
**Destinatário:** CODEX — execução no repositório do ADANA 20  
**Status:** especificação de implementação; **não** representa auditoria do código-fonte já realizada  
**Prioridade:** preservar integralmente o ADANA 20 principal e as rotas/cards já homologados.

---

## 0. ORDEM EXECUTIVA AO CODEX

**EXECUTE A IMPLEMENTAÇÃO, NÃO APENAS UM PROTÓTIPO OU UM PLANO.** Primeiro descubra, no repositório real, como funcionam a pesquisa de **REGRAS**, o Meilisearch, os aliases, o reconhecimento de perguntas e os **cards de respostas** já existentes. Depois construa **um aplicativo BETA independente**, utilizando React/Vite/PWA, que rode **totalmente offline após a instalação e o download íntegro dos dados**, sem backend, Meilisearch em execução, MCP, Qwen3, llamafile, Vulkan ou chamadas à internet durante o uso.

**Não refaça a aplicação principal. Não implemente um chatbot generativo. Não invente regulamentos, artigos, cards, IDs ou componentes que já existem. Não altere a semântica de rotas homologadas.** O produto é uma extração controlada de uma funcionalidade já existente: **pergunta do usuário → busca local → regras existentes → card existente → fontes normativas**.

A implementação deve produzir **código funcional, build instalável como PWA, exportação versionada de uma biblioteca BETA limitada, testes automatizados, auditoria de correspondência com o ADANA e relatório de aceite**. Caso existam lacunas nos dados ou no código, registre-as objetivamente e implemente o subconjunto comprovadamente apto, sem preencher lacunas com ficção.

### Definição de sucesso em uma frase

> Um avaliador instala o ADANA 20 BETA no telefone, ativa o modo avião, fecha completamente o aplicativo, abre-o novamente, faz perguntas em português sobre regras selecionadas e recebe **os mesmos cards e referências normativas homologados**, sem nenhuma requisição à rede e sem executar IA generativa.

---

## 1. OBJETIVO, ESCOPO E LIMITES

### 1.1 Objetivo

Distribuir um **ADANA 20 BETA limitado**, representativo e estável para divulgação e avaliação em celulares Android e iPhone, inteiramente executado no dispositivo após a preparação offline. A experiência deverá preservar o valor visível do sistema: localizar regras esportivas e apresentar os cards de respostas já existentes, com fundamento verificável.

### 1.2 Funcionalidades incluídas — V1

1. Campo de pergunta em linguagem natural, principalmente PT-BR.
2. Interpretação **determinística** de códigos de prova, entidades, palavras-chave, aliases e contexto da pergunta, conforme dados homologados.
3. Pesquisa textual e recuperação de documentos **local** no celular.
4. Renderização dos **componentes React de card existentes**, sempre que portáveis, preservando identidade, composição, conteúdo e ordem de informações; adaptações apenas de responsividade/acessibilidade.
5. Exibição da **prova, entidade reguladora, regra/artigo, fonte, edição/versão do regulamento, página/localizador** e trecho de evidência quando autorizados e presentes na fonte.
6. Diferenciação explícita entre regra encontrada, resultados candidatos e ausência de cobertura.
7. Biblioteca BETA reduzida e versionada, composta **somente por registros aprovados e efetivamente exportáveis**.
8. Instalação como PWA com navegação offline, atualização controlada e estado visível de `Pronto para uso offline`.
9. Registro **local e opcional** de feedback/erros, sem telemetria automática ou dependência de rede.
10. Página `Sobre`: versão da aplicação, versão da biblioteca, abrangência e data de referência normativa.

### 1.3 Exclusões obrigatórias — V1

- Nenhum uso em tempo de execução de MCP, Meilisearch servidor, Qwen3, llamafile, Vulkan, APIs de embeddings, RAG remoto ou serviços externos.
- Nenhuma inferência por LLM, geração livre de texto normativo ou resposta especulativa.
- Nenhuma sincronização, login remoto, analytics, telemetria, fonte externa, CDN, chat online, licença validada por servidor ou consulta ao ADANA principal.
- Nenhuma disponibilização da biblioteca completa, prompts, algoritmos proprietários de orquestração, segredos, credenciais ou ferramentas administrativas do ADANA.
- Nenhuma alegação de DRM impossível de violar ou de proteção absoluta dos dados embarcados.
- Nenhuma reconstrução de todo o ADANA, troca de arquitetura do produto principal ou migração de outras funcionalidades.

### 1.4 Distinção indispensável: instalar versus funcionar offline

- **PWA web:** a primeira visita/instalação requer, normalmente, conexão para obter aplicativo e biblioteca. **Após o download e a verificação completa, tudo deve funcionar offline.**
- **Instalação também sem internet:** se futuramente for exigido instalar diretamente de um arquivo em dispositivo sem conexão, criar uma entrega **separada**, como APK Android empacotado com os assets (ex.: Capacitor). Isso é **fase opcional**, não uma desculpa para introduzir servidor no BETA.
- Um PWA não tem garantia absoluta contra exclusão de dados pelo sistema operacional/navegador; o aplicativo deve detectar perda de pacote, recusar respostas incompletas e orientar reinstalação/recarregamento com conexão. Documentar risco especialmente em iOS.

---

## 2. INVARIANTES E PROIBIÇÕES DE REGRESSÃO

**INV-01 — Autoridade:** a versão vigente/aprovada de cada regra e card é definida **na fonte canônica já utilizada pelo ADANA**, nunca por conteúdo redigitado no BETA.

**INV-02 — Imutabilidade funcional:** rotas aprovadas, critérios de prova, identificadores, conteúdo normativo, ordenação de fases, nomenclatura original das provas e composição dos cards não podem ser mudados por esta migração.

**INV-03 — Separação:** o BETA terá pasta/app/build próprios. Qualquer ajuste compartilhado só pode ocorrer após evidência de que não altera o produto principal; preferir cópia/adaptador isolado a mudanças no contrato do ADANA.

**INV-04 — Fonte normativa:** todo resultado normativo exibido deve apontar para regra/documento/versionamento **existentes no pacote**. Sem fonte confirmada, não apresentar resposta normativa afirmativa.

**INV-05 — Sem duplicatas:** identificadores estáveis e chaves compostas devem impedir que aliases ou múltiplas ocorrências da mesma regra criem cards duplicados.

**INV-06 — Zero dependências de rede:** uma consulta, renderização, navegação entre cards e reinicialização do BETA **não podem depender da internet**. Links externos para consulta posterior não contam como fonte offline.

**INV-07 — Offline atômico:** nunca declarar `Pronto para uso offline` antes de confirmar presença e integridade dos recursos mínimos e da biblioteca.

**INV-08 — Biblioteca limitada:** um mecanismo de allowlist explícita selecionará as regras/cards do BETA. Proibido exportar indiscriminadamente todo o índice ou toda a base do ADANA.

**INV-09 — Não alteração de fontes:** exportar é operação **somente leitura**. Não alterar Meilisearch original, dados canônicos, schema original, arquivos de aprovação ou rotas.

**INV-10 — Testabilidade:** preservar fixtures e provas automatizadas para confirmar identidade da regra, card, referências e não regressão.

**INV-11 — Não mascarar falhas:** dado ausente, ambiguidade, erro de exportação ou inconsistência de fonte devem ser bloqueio/auditoria, jamais corrigidos por invenção.

---

## 3. GATE 0 — INVENTÁRIO DO REPOSITÓRIO E LINHA DE BASE

**Primeira ação obrigatória do CODEX: INSPEÇÃO READ-ONLY. Não criar patches antes do mapa de dependências.**

### 3.1 Identificar os caminhos reais

Localizar e documentar:

- Raiz React/Vite atual, `package.json`, build, componentes e roteamento;
- módulo, página ou aba `REGRAS`, formulários de pergunta e handler de busca;
- cliente Meilisearch e índices consultados, suas configurações e transformações da consulta;
- pipeline pergunta → aliases → ID da prova → recuperação → seleção da regra → card;
- catálogos de cards, schemas, props, estilos, imagens, ícones e fontes;
- regras já homologadas, versão `CURRENT` ou equivalente, status de aprovação, relatórios e testes existentes;
- fontes originais e direitos de redistribuição de textos/figuras normativas;
- mecanismos de geração de links/localizadores, PDFs locais, referências e códigos;
- qualquer dependência de backend **indireta** no renderer dos cards, inclusive hooks, stores, API clients, assets, utilitários e autorização;
- versões efetivas de Node, Vite, React, Meilisearch e scripts de build/teste.

Comandos de **descoberta**, ajustados ao shell real (não presumir paths; não executar comandos destrutivos):

```bash
pwd
git status --short
git branch --show-current
rg -n -i "meili|search|regra|rule|alias|card|discipline|source|citation" . --glob '!node_modules/**' --glob '!dist/**' --glob '!build/**'
```

Investigar configuração de pesquisa, entre outros: `searchableAttributes`, `filterableAttributes`, `rankingRules`, `synonyms`, `stopWords`, `typoTolerance`, filtros de status/versão e eventuais mapas de aliases mantidos fora do Meilisearch.

### 3.2 Entregável do Gate 0

Gerar `docs/beta-offline/GATE0_INVENTARIO.md` com:

1. Caminhos **reais** de cada artefato encontrado.
2. Fluxo atual ponta a ponta e quais componentes rodam no frontend versus backend.
3. Tabela `card atual → origem dos dados → dependência de rede → modo de portabilidade`.
4. Identificação dos dados indispensáveis para compor cada card.
5. Relação de regras/cards **elegíveis** para a primeira exportação, sem inventar quantitativos.
6. Identificação do mecanismo de aprovação e da versão normativa vigente.
7. Limitações constatadas: cards que dependam de Qwen/backend, permissões de documentos, imagens externas, indexação híbrida/vetorial, funcionalidades não exportáveis.
8. Lista dos testes atuais que **não podem regredir**.

**Condição de passagem:** deve ser possível apontar com evidências concretas no código como uma pergunta existente se transforma no card aprovado. Se um card somente existir como texto gerado por Qwen em tempo real, ele **não** pode ser considerado portável automaticamente: verificar se existe representação estruturada homologada; caso contrário, excluí-lo do V1 e registrar lacuna.

### 3.3 Proteção do repositório

- Não sobrescrever arquivos com alterações não commitadas do usuário.
- Trabalhar em branch de feature separada quando seguro, por exemplo `feat/adana20-beta-offline`; se não for seguro trocar de branch, registrar o estado e trabalhar sem alterar o que não pertence ao BETA.
- Não excluir rotas, refatorar o backend ou alterar testes para mascarar falhas.
- Capturar `git diff --stat`, commits-base e resultados dos testes antes das mudanças.

---

## 4. ARQUITETURA TÉCNICA ALVO

```text
                   ETAPA DE BUILD / EXPORTAÇÃO (DESENVOLVEDOR)
    +-------------------------------------------------------------+
    | FONTES EXISTENTES DO ADANA (somente leitura)                 |
    | Regras aprovadas | Meilisearch | aliases | cards | fontes    |
    +-----------------------------+-------------------------------+
                                  |
                     exportação allowlisted + validação
                                  v
               Pacote estático BETA assinado/hasheado*
                 manifest + regras + índice + cards
                                  |
                           build React/Vite
                                  v
            +-----------------------------------------------+
            |     PWA ADANA 20 BETA — CELULAR, OFFLINE       |
            |                                               |
            | Pergunta → normalizador → roteador local       |
            |          → busca lexical local (Web Worker)    |
            |          → resolver de evidências              |
            |          → renderer de card existente          |
            |                                               |
            | React + JS + assets + pacote local + SW/cache   |
            +-----------------------------------------------+

   * Hashes protegem principalmente contra corrupção/acidente;
     assinatura só oferece autenticidade quando há chave pública confiável.
```

**Não haverá Meilisearch embutido no navegador.** O Meilisearch permanece apenas como **fonte na fase de preparação**, caso seja a fonte canônica de documentos. O motor local sugerido é **MiniSearch** (JavaScript de pesquisa textual em memória) executado em Web Worker. Se o inventário demonstrar que a coleção ou os filtros exigem outra alternativa (por exemplo SQLite-WASM/FTS), a escolha deve ser justificada por benchmarks em celulares e **não** pode introduzir backend runtime.

### 4.1 Estrutura proposta — adaptar à organização real

```text
<repo>/
  apps/
    adana20-beta-offline/
      src/
        app/
        components/
        cards/                    # imports/adapters dos cards existentes
        domain/
          normalizeQuery.ts
          resolveDiscipline.ts
          resolveRuleCandidates.ts
          buildEvidence.ts
        search/
          localSearch.worker.ts
          searchClient.ts
        data/
          loadBetaPack.ts
          verifyBetaPack.ts
        pwa/
          offlineReadiness.ts
        styles/
      public/
        beta-pack/               # pacote estático gerado, versionado
          manifest.json
          rules.json
          cards.json
          aliases.json
          sources.json
          search-index.json      # se adotada pré-serialização
        icons/
      tests/
      package.json
      vite.config.ts
  scripts/
    beta-offline/
      export-beta-pack.*
      validate-beta-pack.*
      compare-against-adana.*
  docs/
    beta-offline/
      GATE0_INVENTARIO.md
      EXPORT_AUDIT.md
      EQUIVALENCE_REPORT.md
      TEST_REPORT.md
      RELEASE_NOTES.md
```

Se o projeto existente não usa TypeScript, seguir padrão consolidado do repositório; nomes acima são **propostos**, não fatos constatados. Respeitar workspace e lockfile já existentes. Evitar dependências novas desnecessárias.

### 4.2 Contrato interno de busca

Criar interface independente de componente/UI e de Meilisearch:

```ts
interface OfflineQuestion {
  text: string;
  disciplineId?: string;
  federationId?: string;
  language?: 'pt-BR' | 'en-US';
}

interface OfflineRuleHit {
  ruleId: string;
  cardIds: string[];
  disciplineId: string | null;
  routeId: string | null;
  score: number;
  matchKind: 'exact-id' | 'approved-alias' | 'lexical';
  sourceIds: string[];
}

interface OfflineSearchResult {
  status: 'matched' | 'ambiguous' | 'not-found' | 'unavailable';
  query: string;
  hits: OfflineRuleHit[];
  packVersion: string;
}
```

Tipos ilustrativos; adequar campos aos schemas reais. **ID de rota e ID de card são distintos** e não podem ser confundidos. O renderer consome o mesmo modelo de dados que o card original (diretamente ou por adaptador com teste de equivalência).

---

## 5. BIBLIOTECA BETA — EXPORTAÇÃO CONTROLADA

### 5.1 Fonte e seleção

Construir um **exportador de desenvolvimento/build**, nunca chamado pelo PWA. Ele deve:

1. Consultar as fontes reais **somente leitura** (base canônica, endpoints administrativos existentes ou dump autorizado do Meilisearch).
2. Selecionar **somente** provas, versões de regulamento, regras e cards definidos em arquivo explícito de allowlist revisável (`beta-allowlist.json` ou equivalente).
3. Exigir estado de aprovação canônico, na denominação real do projeto, e fonte válida.
4. Exportar as referências necessárias à resposta, inclusive aliases, relacionamentos e props visuais.
5. Resolver dependências transitivas dos cards **sem incluir dados fora do escopo**. Se dependência essencial não pode ser exportada, excluir card e registrar a razão.
6. Preservar integralmente grafia das provas (nomes oficiais não são traduzidos), IDs, números de artigos, páginas, ordem de fases e versões de fonte.
7. Deduplicar pelo identificador canônico apropriado, sem fundir regras distintas.
8. Produzir arquivo de auditoria com contagem e lista de IDs incluídos, excluídos e motivo de exclusão.
9. Falhar o build diante de referência quebrada, card sem fonte obrigatória, versão ausente, ID repetido em conflito ou material não autorizado.

**Nunca** exportar dump bruto do Meilisearch com dados internos, índices secretos, registros de atletas, respostas privadas, contas, logs, prompts ou chaves. O exportador precisa aplicar lista de campos permitidos, não apenas retirar alguns campos conhecidos.

### 5.2 Esquema mínimo ilustrativo de um registro de regra

```json
{
  "ruleId": "ID_CANONICO_REAL",
  "routeId": "ID_DA_ROTA_SE_EXISTENTE",
  "disciplineId": "ID_DA_PROVA_REAL",
  "federationId": "ISSF_OU_WSPS_OU_CBTE_CONFORME_FONTE",
  "title": "TITULO_EXISTENTE",
  "normativeText": "TEXTO_AUTORIZADO_E_EXISTENTE",
  "section": "ARTIGO_OU_REGRA_REAL",
  "cardIds": ["CARD_ID_REAL"],
  "aliasIds": ["ALIAS_ID_REAL"],
  "sourceIds": ["SOURCE_ID_REAL"],
  "approvalState": "VALOR_CANONICO_APROVADO",
  "versionId": "VERSAO_CANONICA_REAL"
}
```

**Este JSON descreve formato, não conteúdo normativo.** Preencher exclusivamente pela origem verificada. Não supor que os campos ou nomes coincidam com o schema real: criar adaptador documentado.

### 5.3 Contrato de fonte / evidência

Para cada fonte incorporada, se disponíveis e licenciados:

- `sourceId`, `authority` (ISSF/WSPS/CBTE/outro confirmado), `documentTitle`, `edition`/`effectiveDate`, `ruleNumber`/`section`, `page`/localizador, trecho exato ou resumo canônico aprovado, `sourceUrl` original, `offlineAssetPath` se documento autorizado fizer parte do pacote.
- Uma URL externa é **apenas referência de origem**, e não evidência disponível offline por si só.
- Se não houver PDF/trecho local, informar claramente que o documento integral depende de acesso posterior à internet; não exibir botão que simula abertura offline.
- Não embutir PDFs completos sem analisar tamanho, direito de redistribuição e necessidade real para o BETA.
- Documentar data de corte do pacote e aviso de que regulamentos podem mudar.

### 5.4 Manifesto e integridade

Exemplo:

```json
{
  "schemaVersion": 1,
  "packId": "adana20-beta-rules",
  "packVersion": "1.0.0",
  "createdAt": "DATA_REAL_GERADA_NO_BUILD",
  "sourceSnapshotId": "REFERENCIA_REAL_DA_ORIGEM",
  "includedDisciplines": [],
  "counts": { "rules": 0, "cards": 0, "aliases": 0, "sources": 0 },
  "files": [
    { "path": "rules.json", "sha256": "HASH_REAL", "bytes": 0 }
  ]
}
```

Substituir placeholders por valores reais. Verificar hash SHA-256 de cada artefato e consistência referencial. **Não alegar que hash com manifesto no mesmo pacote impede adulteração maliciosa.** Para autenticidade real, assinatura com chave privada fora do pacote e verificador cuja âncora de confiança seja tratada explicitamente — ainda sujeita a substituição no frontend puramente web.

### 5.5 Atualização versionada

- Build reproduzível a partir do snapshot/commit identificado e allowlist.
- Pacote antigo permanece funcional até que novo pacote seja carregado e verificado.
- Não misturar JS antigo com schema novo incompatível ou dados incompletos.
- Versionar schema e construir migração ou rollback.
- Não apagar dados/caches válidos durante atualização parcial.
- Preferir solicitar ao usuário a ativação de atualização quando o aplicativo já estiver aberto, para não interromper uma consulta.

---

## 6. BUSCA LOCAL — COMPATIBILIDADE E PRECISÃO NORMATIVA

### 6.1 Tecnologia preferida

Usar `minisearch` no navegador, idealmente em **Web Worker**, com índice pré-construído/serializado se vantajoso. Medir o custo real de baixar, descompactar, inicializar e manter o índice em memória. A capacidade de carregar índice serializado deve ser validada na **versão exata** instalada. Caso haja incompatibilidade ou desempenho inadequado, justificar alternativa local com mesma capacidade de testes.

Não colocar Meilisearch como dependência de runtime; não criar servidor loopback; não exigir porta HTTP local no telefone. Não usar funções que dependam de Node no bundle do browser.

### 6.2 Normalização e interpretação

Implementar pipeline **documentado e determinístico**:

1. `trim`, compactação de espaços e tratamento Unicode.
2. Normalização de acentos/caixa **somente para busca**; exibição preserva o texto oficial.
3. Tokenização e separação controlada de pontuação, hífens e numerais.
4. Detecção prioritária de **códigos exatos** de provas/disciplinas, regras e artigos, usando dicionário aprovado; preservar distinções (`R5` ≠ `R50`, `P5` ≠ `P1`, `10.9` ≠ `109`).
5. Expansão de aliases/sinônimos **oriundos do ADANA**, evitando criar equivalências falsas.
6. Identificação de entidade normativa e contexto (ISSF, WSPS, CBTE etc.), se presentes.
7. Busca lexical com pesos por campos, prefixo/fuzzy quando seguro, filtros de prova/versão/aprovação.
8. Deduplicação e ordenação estável por ID/regra/score.
9. Resolução de ambiguidade antes da exibição de conclusão normativa.

**Não confundir similaridade textual com identidade jurídica/normativa.** Erros de digitação em códigos alfanuméricos ou números de artigos não podem levar silenciosamente a outra prova/regra. Para esses campos, dar prioridade à igualdade exata e desabilitar fuzzy quando necessário.

### 6.3 Prioridade de recuperação

1. **Identificador exato aprovado** (`ruleId`, código da prova ou artigo qualificado por fonte/edição).
2. **Alias aprovado** e vínculos explícitos pergunta/rota/regra/card.
3. **Termos normativos exatos** em campos prioritários.
4. **Busca lexical** por relevância com pesos definidos após observar a configuração original do Meilisearch.
5. **Fuzzy/prefixo** apenas como apoio a termos textuais, nunca como fundamento único de uma conclusão crítica.

Quando múltiplas provas, edições ou regras competirem, **não escolher arbitrariamente**. Exibir opções claras ou pedir que a pessoa especifique a prova/fase. Se não houver cobertura validada: `Esta pergunta não está coberta pela biblioteca offline desta versão.`

### 6.4 O que pode diferir do Meilisearch

MiniSearch **não replica automaticamente** filtros, stemming, ranking, ranking rules, typo tolerance e semântica do Meilisearch. Portanto:

- Capturar a configuração efetiva dos índices usados pelo ADANA.
- Construir conjunto de perguntas de referência com resultados canônicos.
- Comparar ID de rota, ID de regra, ID de card, fonte, edição e ordem de relevância, não apenas o texto renderizado.
- Calibrar busca local sem mudar conteúdo homologado.
- Registrar diferenças inevitáveis e **bloquear release** se alterarem a conclusão ou a referência normativa esperada.
- Se o Meilisearch usa busca vetorial/híbrida, esse comportamento **não será preservado sem modelo local**; restringir escopo às perguntas que a recuperação lexical/aliases consiga atender, com teste demonstrativo.

### 6.5 Política de abstenção

O BETA não deve compor uma regra a partir de vários trechos desconexos nem transformar um card ilustrativo em interpretação normativa nova. Para perguntas fora do pacote, registrar `not-found` ou `ambiguous`. **Nunca** preencher os espaços com resposta generativa, template inventado ou afirmação sem fonte.

---

## 7. REUTILIZAÇÃO DOS CARDS HOMOLOGADOS

### 7.1 Auditoria de portabilidade por card

Para cada família de card existente, verificar:

- origem e contrato das props;
- dependência de `fetch`, contextos globais, hooks com efeitos de rede, stores e chamadas ao backend;
- fontes, ícones, fotos, logotipos e estilos externos;
- composição e ordem dos blocos (regra, penalidades, qualificação/final, equipamento, citação, notas);
- condições de exibição e permissões associadas.

**Estratégia preferida:** reutilizar o componente React original (ou sua cópia isolada, devidamente atribuída no código), substituindo apenas o provedor de dados por adaptador offline. Se for necessário modificar markup, registrar diferenças e comparar screenshots do card original e do BETA com a mesma fixture.

### 7.2 Regras de integridade do card

- O `cardId` deve apontar para **o mesmo tipo de card** e mesma regra que no ADANA homologado.
- Não mudar nomes oficiais de provas.
- Não usar imagens de prova, arma, vestimenta ou posição diferentes das homologadas para preencher ausências.
- Quando um card contiver qualificação e final, preservar as diferenças; não fundir fases ou comandos.
- Preservar dados de alvos, equipamentos, dimensões, penalidades, pontuação, desempate, aliases e localizadores **quando existirem na fonte/card aprovado**.
- Não sintetizar regras adicionais para atingir artificialmente um modelo de card.
- Se faltar dado crítico, sinalizar card `incompleto` na auditoria e não publicá-lo no pacote até resolver pela origem.
- Cada imagem, CSS, fonte e ícone exigidos pelo card deve estar dentro do pacote offline, com licenças observadas.
- Proibir HTML bruto não sanitizado de fontes indexadas (`dangerouslySetInnerHTML` sem sanitização/auditoria).

### 7.3 UI mínima

Tela inicial:

- marca e título `ADANA 20 BETA — OFFLINE`;
- indicador claro de prontidão da biblioteca;
- caixa `Pergunte sobre uma regra...`;
- botão `Pesquisar`;
- filtros leves de entidade/prova apenas se realmente úteis;
- resultado em cards existentes, com fontes e versão;
- explicação de escopo e aviso de ausência de atualização automática de normas;
- tela de Sobre, versão do pacote, data da fonte e espaço para feedback local.

Responsividade: largura de celulares pequenos a tablets, orientação retrato/paisagem, sem scroll horizontal desnecessário, alvos de toque adequados, contraste e leitura legível. PT-BR por padrão. Não exigir login para a operação offline; não insinuar controle de licença efetivo por uma senha embutida no frontend.

### 7.4 Exemplo de UX de resposta válida

```text
Pergunta: [texto real do usuário]
Status: Regra encontrada / Mais de uma possibilidade / Não coberta
Prova: [nome oficial, se confirmado]
Card homologado: [renderização do componente existente]
Referência: [entidade] — [edição] — [regra/artigo] — [página]
Base local: ADANA 20 BETA [versão]
```

Não fornecer exemplos de penalidades ou resultados reais sem validação da biblioteca original.

---

## 8. PWA OFFLINE — IMPLEMENTAÇÃO OBRIGATÓRIA

### 8.1 Empacotamento

- React + Vite com `vite-plugin-pwa`/Workbox, na versão compatível com o repositório.
- Manifesto válido (`name`, `short_name`, `start_url`, `scope`, `display: standalone`, ícones 192/512 e máscara quando aplicável, `theme_color`, `background_color`).
- Service worker controla rota principal e navegação interna; app shell, chunks JavaScript/CSS, fontes, ícones, imagens dos cards, arquivos de biblioteca e índices devem estar disponíveis offline.
- Dependências importadas pelo NPM e empacotadas no build; **proibido CDN e fontes remotas**.
- Garantir que arquivos de biblioteca não sejam omitidos pelo limite padrão de tamanho do precache do Workbox. Configurar tamanho/estratégia conforme tamanho real, com verificação de cobertura do pacote.
- Garantir que o instalador PWA não sinalize pronto se ainda restar download obrigatório pendente.

### 8.2 Modelo de armazenamento

Para pacote BETA pequeno, preferir arquivos estáticos versionados + Cache Storage/precaching. Se o índice for grande ou precisar de consultas persistentes, avaliar IndexedDB/OPFS com medição de tamanho e compatibilidade real. Não duplicar os mesmos dados em memória, Cache Storage e IndexedDB sem necessidade.

Recomendações:

1. Indexação pesada fora da thread da interface (Web Worker).
2. Verificação de integridade completa de manifesto, cards, regras e índice.
3. `navigator.storage.persist()` quando disponível, **sem assumir que será concedido**.
4. Capturar quota/storage failures e oferecer erro compreensível.
5. Não confiar na propriedade `navigator.onLine` como prova de prontidão; o critério é **presença e validade** dos assets/dados.
6. Carregamento sob demanda apenas para arquivos **que já estão armazenados localmente**.
7. Recuperação após fechamento completo, reinício de aparelho e desativação de rede.

### 8.3 Estados obrigatórios do aplicativo

| Estado | Comportamento |
|---|---|
| `INSTALLING` | Baixando/preparando todos os recursos obrigatórios. Não prometer uso offline. |
| `VERIFYING` | Conferindo hash, schema, relações e conjunto mínimo. |
| `READY_OFFLINE` | Pesquisa, cards, fontes e navegação liberados, sem depender da rede. |
| `PACK_INCOMPLETE` | Não emitir respostas normativas parciais; explicar como recuperar o pacote. |
| `PACK_INCOMPATIBLE` | Aplicativo e biblioteca com schemas divergentes; atualização/rollback seguro. |
| `OFFLINE_NOT_PREPARED` | Primeira instalação ainda não concluída; orientar conexão inicial. |

### 8.4 Estratégia de atualização

- Nenhuma atualização de regras sem novo pacote versionado/revisado.
- Não sobrescrever silenciosamente o pacote íntegro anterior por arquivo parcial.
- Se o app for atualizado quando a internet estiver disponível, validar tudo antes de marcar a nova versão como ativa.
- Quando offline, permanecer integralmente no pacote instalado.
- Se a interface oferecer `Verificar atualizações`, a ação deve ser opcional e nunca obrigatória para pesquisar.

### 8.5 Links e referências externas

Em modo avião, links de documentos hospedados na internet não abrirão. Apresentar a URL como referência para acesso posterior ou abrir PDF local **somente quando efetivamente empacotado**. Nenhum card deve depender de um link web para exibir seu conteúdo essencial.

---

## 9. SEGURANÇA, CRIPTOGRAFIA E LIMITES REAIS

### 9.1 Princípio

**Tudo que o navegador precisa consultar ou interpretar offline pode ser extraído por um usuário tecnicamente capacitado.** Portanto a proteção primária do BETA não é criptografar o JavaScript; é **não distribuir** o algoritmo proprietário nem os dados completos.

### 9.2 Medidas obrigatórias

1. Exportação com allowlist estrita e revisão de todos os campos publicados.
2. Ausência de segredos, tokens, credenciais Meilisearch, endpoints administrativos, configurações internas de MCP, prompts e caminhos privados nos arquivos gerados.
3. Build de produção sem sourcemaps públicos, com minificação; não confundir com criptografia forte.
4. Política de dependências e varredura de arquivos do bundle por strings/URLs proibidas.
5. Sem `fetch` externo, analytics, trackers ou bibliotecas de terceiros que exijam rede durante a operação.
6. Renderização sanitizada de textos indexados, CSP compatível com PWA e sem scripts remotos.
7. Hash de integridade do pacote e manifesto, permitindo detectar dados corrompidos.
8. Marcação clara `BETA — biblioteca limitada`, edição/data e escopo.
9. Repositório/artefatos de origem privados conforme configuração já existente; não publicar scripts exportadores contendo segredos.

### 9.3 Criptografia opcional — decisão consciente

Se a intenção for acrescentar **barreira contra cópia casual**:

- É possível criptografar `rules`/`cards` e desbloquear por senha fornecida ao usuário, usando Web Crypto (ex.: AES-GCM com derivação de chave apropriada e salt por pacote).
- **Nunca** embutir a chave de descriptografia no JavaScript ou no próprio pacote como se isso protegesse os dados.
- Com chave fornecida pelo usuário, o dado será necessariamente descriptografado no dispositivo durante o uso; extração ainda é possível. Não haverá autenticação/revogação offline confiável.
- A criptografia e a exigência de senha tornam o beta menos simples; **não são requisito da V1** sem decisão explícita. Implementar primeiro isolamento/limitação dos dados; reportar risco residual.

### 9.4 Auditoria obrigatória de bundle

Pesquisar no resultado final por nomes de hosts/URLs, tokens, `MEILI_`, `API_KEY`, `Authorization`, prompts internos, schemas privados, endpoints `/admin`, artefatos de backend e qualquer referência a serviços externos. **Nem toda ocorrência de termos genéricos é segredo; a análise deve ser contextual, documentada e sem false positives artificiais.**

---

## 10. TESTES OBRIGATÓRIOS E MATRIZ ANTIRREGRESSÃO

### 10.1 Construir a linha de base dourada (golden set)

Antes da troca de motor, executar — sobre a origem existente e quando disponível — um conjunto de perguntas de referência **já aprovadas** e salvar snapshots com:

```json
{
  "caseId": "CASO_REAL",
  "question": "PERGUNTA_REAL",
  "expectedRuleIds": [],
  "expectedCardIds": [],
  "expectedRouteIds": [],
  "expectedSourceIds": [],
  "expectedStatus": "matched",
  "sourceSnapshotId": "IDENTIFICADOR_REAL"
}
```

Cobrir, quando existentes no BETA: comandos de qualificação/final, penalidades, tiros antecipados, pontuação, desempate, equipamentos, dimensões, alvos, aliases, edições diferentes, nomes próximos de provas e relações card/regra. **Não incluir como aprovadas perguntas sem gabarito comprovado.**

Os critérios já homologados para reconciliação de rotas do ADANA devem ser considerados **quando aplicáveis**: desenvolvimento da prova e fases; alvos/dimensões; equipamentos; penalidades; comandos; pontuação; desempate; aliases; regras/localizadores; cards de equipamento; cards distintos de qualificação/final. Esta especificação não autoriza inventar qualquer desses campos.

### 10.2 Comparação obrigatória entre ADANA e BETA

Para toda pergunta do golden set do pacote:

- Mesma prova e entidade.
- Mesmos IDs de regra e rota quando fixados pela homologação.
- Mesmos IDs de cards, sem omissões ou duplicatas.
- Mesmos números de regra, edição, página e referências.
- Mesma conclusão **quando ela já existe como dado aprovado**.
- Mesmos casos de abstenção/ambiguidade quando canônicos.
- Resultados de ranking secundário podem divergir **somente** com justificativa, sem mudar resposta final, card ou referência correta.

**Critério de aceite:** 100% dos casos homologados incluídos no golden set devem conservar identidade de regra/card/fonte e status esperado. Qualquer falha crítica bloqueia release. As perguntas sem gabarito aprovado devem ser separadas como casos exploratórios e não usadas para afirmar equivalência.

### 10.3 Testes negativos

- `R5` não pode retornar `R50` por engano.
- `P1` não pode ser tratado como `P10`.
- `10.9` não pode virar `109`.
- Edições e fontes conflitantes não podem se misturar.
- Pergunta fora do conjunto deve retornar `não coberta`.
- Palavra genérica não pode disparar penalidade ou comando sem prova/condição suficiente.
- Card sem fonte obrigatória não é publicável.
- Aliases diferentes da mesma regra não criam duplicata.
- Usuário não precisa de backend ativo para acessar uma resposta válida.
- O aplicativo não deve produzir resultado normativo se o índice ou o pacote estiver corrompido.

### 10.4 Testes de rede e offline

**Automatizado (Playwright ou ferramenta já usada):**

1. Build de produção e servidor estático local apenas para **instalação inicial**.
2. Primeira visita com rede disponível, esperar `READY_OFFLINE`.
3. Fechar/reabrir o contexto e simular `offline: true`.
4. Bloquear/registrar acessos externos; falhar diante de qualquer requisição a host que não pertença aos assets já cacheados ou diante de chamada a backend.
5. Perguntar, recuperar cards, abrir evidência local, voltar e pesquisar de novo.
6. Simular pacote incompleto/corrompido e verificar abstenção.
7. Simular atualização interrompida e garantir que o pacote anteriormente válido permanece utilizável.
8. Verificar que todos os recursos necessários estão no cache/armazenamento e que nenhum arquivo foi omitido por limite de precache.
9. Reiniciar o navegador em contexto persistente compatível e confirmar consulta offline após reinício.

**Teste manual obrigatório em dispositivos reais:**

- Android: instalar PWA, confirmar biblioteca pronta, modo avião, encerrar o aplicativo, reabrir pelo ícone instalado, executar conjunto mínimo de perguntas e navegar por cards.
- iPhone: instalar pelo fluxo de Adicionar à Tela de Início, confirmar biblioteca pronta, modo avião, encerrar/reabrir e repetir perguntas/cards.
- Testar baixo armazenamento/limpeza de dados quando possível; confirmar diagnóstico honesto e nenhuma resposta com pacote inconsistente.
- Registrar modelo, versão do SO, navegador e resultado; em caso de não haver aparelhos disponíveis, **não declarar a validação real como concluída**.

### 10.5 Benchmarks (medir, não inventar)

Medir tamanho do pacote transferido, tamanho descompactado, custo de memória, tempo de inicialização do índice, latência p50/p95 das consultas e tempo até `READY_OFFLINE` em aparelho mediano. Registrar limites encontrados; decidir redução da allowlist se o pacote for pesado. Não impor metas fictícias sem hardware de referência.

### 10.6 Testes do ADANA principal

Rodar a suíte existente **antes e depois**; garantir que o exportador não alterou base, rotas, cards, SQL, índices do Meilisearch ou endpoints. O relatório deverá apresentar `PASS/FAIL`, comandos, logs resumidos e diferenças. **Não apagar nem reescrever testes antigos para alcançar verde.**

---

## 11. GATES DE EXECUÇÃO

| Gate | Objetivo | Critério de saída |
|---|---|---|
| **G0 — INVENTÁRIO** | Descobrir pipeline original e base canônica | Mapa de dependências, portabilidade e baseline comprovados |
| **G1 — EXPORTAÇÃO** | Pacote BETA limitado somente leitura | Dados aprovados, íntegros, referências completas, allowlist auditada |
| **G2 — BUSCA LOCAL** | Recuperação determinística offline | Golden set preservado, sem dependência de Meilisearch runtime |
| **G3 — CARDS** | Adaptar componentes existentes | Mesmo card para mesma regra, sem dependências remotas |
| **G4 — PWA** | Instalação, pré-cache e persistência | `READY_OFFLINE` após pacote íntegro; consulta sem rede |
| **G5 — SEGURANÇA** | Reduzir conteúdo publicado e verificar bundle | Sem segredos, endpoints privados, telemetria ou assets remotos |
| **G6 — REGRESSÃO** | Provar equivalência e isolamento | Golden set 100% crítico, suíte principal sem regressão |
| **G7 — RELEASE BETA** | Entrega utilizável e auditável | Build, instruções e relatórios; validação real de celulares declarada honestamente |

**Política de bloqueio:** `FAIL` crítico ou ausência de fonte canônica impede marcar como aprovado. Se um subconjunto falha, é permitido **retirar explicitamente esses cards da allowlist** e concluir um BETA menor, desde que o corte e a nova cobertura estejam documentados e a funcionalidade principal não tenha sido alterada.

---

## 12. ORDEM PRÁTICA DE IMPLEMENTAÇÃO PELO CODEX

1. Inspecionar repositório, estado Git, componentes de regras/cards e contratos atuais; registrar Gate 0.
2. Congelar baseline funcional/testes e identificar fonte de verdade/versões aprovadas.
3. Definir allowlist inicial baseada em dados **existentes**, com cobertura pequena mas representativa; documentar critérios.
4. Implementar exportador somente leitura e validador (schema, chaves, integridade, fonte e licença).
5. Gerar pacote BETA de exemplo **com dados reais e permitidos**; não usar respostas fictícias como dados de produção.
6. Criar aplicação React isolada, aproveitando cards e CSS já existentes.
7. Implementar motor de pesquisa local, normalização, resolução de aliases e abstenção.
8. Conectar saída do buscador ao renderer de cards e evidências.
9. Configurar PWA/Workbox, manifest, ícones, caches e estado de integridade.
10. Implementar testes automatizados de busca, equivalência, integridade, PWA e ausência de rede.
11. Auditar build publicado e segurança; rodar antirregressão do ADANA original.
12. Produzir build final, instruções de instalação/uso em Android e iOS e relatórios com evidências.

**Não interromper o trabalho após escrever um plano.** Executar até o máximo que o repositório e as ferramentas permitirem. Caso um requisito dependa de material ausente (ex.: acesso ao Meilisearch, fonte de cards, dispositivo iOS), entregar os demais itens funcionais e indicar **exatamente** o bloqueio e o teste pendente, em vez de marcar tudo como concluído.

---

## 13. CONTRATOS DE ACEITE E EVIDÊNCIAS EXIGIDAS

### 13.1 Checklist de aceite

- [ ] Existe uma aplicação BETA separada, com build Vite executável.
- [ ] O backend ADANA principal está inalterado e sua suíte segue passando.
- [ ] Regras/cards foram extraídos da origem canônica com aprovação verificável.
- [ ] Allowlist explícita impede publicação da base integral.
- [ ] O BETA não faz chamadas de runtime a Meilisearch, MCP, Qwen ou backend.
- [ ] Os cards existentes foram reutilizados ou adaptados com equivalência visual/semântica comprovada.
- [ ] Toda resposta normativa tem ID e referência compatíveis com o pacote.
- [ ] Sem cobertura não resulta em regra inventada.
- [ ] Aplicação usa busca local no celular; não roda servidor local de pesquisa.
- [ ] Fontes, CSS, scripts, imagens e ícones necessários estão disponíveis offline.
- [ ] PWA informa prontidão somente após verificação íntegra.
- [ ] PWA consulta em modo avião após fechamento e reabertura.
- [ ] Golden set de casos homologados passou 100% nos critérios críticos.
- [ ] Builds, hashes, contagens e snapshots são rastreáveis.
- [ ] Bundle não contém segredos, endpoints internos ou dados fora da allowlist.
- [ ] Testes de Android/iPhone estão documentados como executados ou pendentes, sem suposições.

### 13.2 Relatórios finais

Entregar, pelo menos:

- `GATE0_INVENTARIO.md` — arquivos efetivos, pontos de integração, riscos;
- `EXPORT_AUDIT.md` — allowlist, IDs, volume e motivo de inclusão/exclusão;
- `EQUIVALENCE_REPORT.md` — perguntas, gabaritos, resultados e diferenças;
- `TEST_REPORT.md` — testes de build, performance, offline e antirregressão;
- `RELEASE_NOTES.md` — versão, cobertura, limitações, instruções de instalação;
- **caminho do artefato de build**, comandos concretos para executá-lo e, se possível, screenshots da interface em celular;
- resumo do `git diff --stat` e relação de novos/alterados arquivos.

O CODEX deverá informar **expressamente**: `IMPLEMENTADO`, `VALIDADO` e `PENDENTE`, separando código escrito de teste efetivamente executado.

### 13.3 Comandos esperados

Adaptar ao package manager real. Exemplos de scripts que o novo pacote deve disponibilizar:

```bash
# nomes propostos — podem ser adaptados ao workspace
npm run beta:export      # ambiente de desenvolvimento com fontes acessíveis
npm run beta:validate    # integridade e contratos do pacote
npm run beta:test        # unitários e integração
npm run beta:test:offline
npm run beta:build       # Vite/React PWA estático
npm run beta:preview     # apenas para teste/instalação inicial
```

O comando de build do BETA deve usar **pacote exportado já validado**, sem tentar conectar ao ADANA/Meilisearch durante execução no usuário final. Se quiser permitir um pipeline integrado de exportação + build, mantê-lo **separado** do build offline/reproduzível.

---

## 14. RISCOS, COMPROMISSOS E DECISÕES ARQUITETURAIS

| Risco | Decisão/mitigação |
|---|---|
| Código frontend pode ser analisado | Não embarcar orquestração proprietária; dados BETA mínimos; minificação não é segredo |
| Pacote de regras pode ser copiado | Biblioteca restrita; controle de redistribuição/licenças; criptografia opcional apenas como barreira |
| Meilisearch e MiniSearch têm ranking diferente | Golden set e filtros/códigos exatos prioritários; abster-se em ambiguidade |
| Card depende indiretamente do backend | Adaptador local ou exclusão do V1; sem endpoint disfarçado |
| PWA perde cache por limpeza/quota | Verificação na inicialização, estado incompleto, recuperação segura |
| Regulamento muda após exportação | Exibir edição e data do snapshot; atualização versionada quando disponível |
| Pacote cresce demais no celular | Reduzir allowlist, imagens e PDFs; medir aparelhos reais |
| Documentos sem direito de redistribuição | Incluir somente metadados/trechos autorizados e fonte identificada |
| PWA não instala sem primeiro download | Explicitar no manual; APK empacotado é entrega opcional futura |
| Perguntas fora da biblioteca parecem respondidas | Mensagem explícita de não cobertura e ausência de geração livre |

---

## 15. FUTURO OPCIONAL — NÃO IMPLEMENTAR ANTES DE ACEITAR V1

**Fase 2A — APK Android offline desde a instalação:** empacotar o mesmo React + biblioteca BETA em Capacitor, sem requisições a servidor. Gerar APK/AAB para Android conforme distribuição escolhida. Validar tamanho, assinatura e atualização. PWA V1 continua fonte do comportamento.

**Fase 2B — Proteção adicional:** avaliar senha de desbloqueio fornecida externamente e arquivos de regras cifrados com Web Crypto, reconhecendo que o dado será visível após desbloqueio. Não confundir com DRM confiável.

**Fase 2C — Expansão da biblioteca:** adicionar novas provas e cards **após homologação e execução de todas as regressões**, sem mudar a autoridade canônica.

**Fase 2D — IA embarcada:** explicitamente fora do escopo. Exigiria avaliação separada de memória, modelo, GPU/WebGPU, licença e exposição do algoritmo.

---

## 16. REFERÊNCIAS TÉCNICAS PARA O CODEX

Consultar a documentação atual durante a implementação e respeitar as versões instaladas:

1. MiniSearch — busca textual local em browser/Node, fuzzy, prefixo e serialização: https://github.com/lucaong/minisearch
2. Vite PWA — integração e estratégias de service worker: https://vite-pwa-org.netlify.app/guide/
3. Workbox/precaching — observar tamanho de assets e cobertura: https://developer.chrome.com/docs/workbox/modules/workbox-precaching/
4. MDN — cache de PWAs e funcionamento offline: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching
5. MDN — quotas/evicção do armazenamento: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
6. Meilisearch — configurações de índice e ranking: https://www.meilisearch.com/docs/reference/api/settings
7. MDN — solicitação de persistência do armazenamento: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist

**A documentação acima orienta a implementação; não substitui o inventário do código real do ADANA 20.**

---

## 17. MENSAGEM FINAL PARA O CODEX

> Crie o ADANA 20 BETA como **produto frontend-only, offline-first, separado e limitado**, extraído da funcionalidade existente de **REGRAS + CARDS**. A biblioteca Meilisearch original poderá servir como **origem de exportação em tempo de desenvolvimento**, nunca como serviço em execução no telefone. O usuário deve fazer perguntas e receber cards normativos homologados com suas fontes, **inteiramente offline**. Preserve as rotas, IDs, provas, versões e conteúdos originais; não invente nem use Qwen. Faça leitura de arquitetura, exportação auditada, busca lexical local, empacotamento PWA, testes de equivalência, modo avião, segurança e antirregressão. Entregue código, build e relatórios, distinguindo o que foi testado do que ficou pendente. **Nenhuma alteração no ADANA principal será aceita como efeito colateral.**

**FIM DA SPEC `ADANA20_BETA_OFFLINE_V1`.**
