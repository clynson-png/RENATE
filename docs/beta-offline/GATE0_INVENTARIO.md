# RENATE BETA — GATE 0: Inventário e baseline

**Data da inspeção:** 2026-11-05  
**Modo:** read-only; nenhum arquivo do ADANA foi editado.  
**Raiz de entrega definida:** `RENATE/`, conforme `RENATE_BETA_OFFLINE_SPEC_V1.md`.

## 1. Estado do repositório e baseline

- O diretório de trabalho `E:\ADANA 2.0` não possui raiz Git (`git status` e `git rev-parse` retornam “not a git repository”). Portanto não há commit-base válido para este inventário.
- Existe um checkout Git aninhado em `E:\ADANA 2.0\ADANA20.1`, branch `main`. Na inspeção já havia duas pastas não rastreadas: `updates/2026-10-12-library-evidence-and-stable-top-k/` e `updates/2026-10-12-worker-package-only/`. Elas são alterações preexistentes e permanecem intocadas.
- Antes desta SPEC, `RENATE/` continha somente `ADANA20_BETA_OFFLINE_SPEC_CODEX.md`. Nenhum código ou dado do BETA foi criado/importado nesta etapa do inventário.
- Testes focados baseline: `test_adana_rules_reader.py` PASS (5/5) e `test_adana_wsps_event_p4_card_pass.py` PASS (6/6). O preflight estático global foi executado, mas bloqueou antes de validar a suíte: `answer_api` não corresponde ao hash protegido. O log está em `baseline_routes_static.log` dentro de RENATE. Não se declara o baseline global como PASS.
- Versões observadas no host de desenvolvimento: Node `v24.18.0`, npm `11.16.0`, Python `3.14.7`. O binário Meilisearch não foi executado para obter versão.

## 2. Artefatos efetivamente localizados

| Função | Caminho observado na origem ADANA | Evidência e implicação |
|---|---|---|
| UI React/Vite | `web/package.json`, `web/vite.config.js`, `web/index.html`, `web/src/App.jsx`, `web/src/RulesReader.jsx`, `web/src/styles.css`, `web/src/RulesReader.css` | React 19.3.0, Vite 8.3.2. É código do ADANA; não é import runtime aceitável no RENATE. |
| Aba REGRAS | `web/src/App.jsx`; `web/src/RulesReader.jsx` | `App.jsx` alterna para `RulesReader`. A tela de REGRAS faz chamadas HTTP próprias ao serviço REGRAS em `http://127.0.0.1:8795`. |
| API REGRAS | `scripts/adana_rules_reader_api.py` | Serviço HTTP local, porta 8795 por padrão; lê fontes/catalogação da Library e encaminha pesquisa ao Meilisearch. |
| Cliente/runtime de busca principal | `scripts/adana_answers_api.py` e código de biblioteca chamado por ele | API de respostas em `127.0.0.1:8791`, recupera por Meilisearch e compõe respostas com Qwen. Fora do escopo de runtime RENATE. |
| Exportação/apresentação de cards | `scripts/adana_competition_cards.py` | Resolve card depois da resolução de evento/rota. Lê o catálogo, verifica o arquivo e SHA-256, e devolve asset, legenda e referências. |
| Catálogo de cards | `config/adana_competition_cards_v1.json` | Schema `ADANA_COMPETITION_CARDS_V1`, raiz de assets `library/regras/CARDS_PROVAS`, 67 entradas de evento. |
| Assets de cards | `library/regras/CARDS_PROVAS/` | 179 arquivos. Entre os candidatos P4/P5 estão os dois cards de fase de P4 e o card de qualificação/“sem final” de P5. O inventário não conclui, por si só, autorização de redistribuição. |
| Renderer dos cards | `web/src/App.jsx` (renderiza payload `competition_card` e supplemental cards) | O React apresenta imagens recebidas da API em `/library-cards/...`; o conteúdo/card atual não é um componente React autossuficiente separado. O renderer depende do payload e do asset path da API. |
| Service worker atual | `web/public/sw.js` | Cacheia app shell/chunks same-origin; usa network-first e ignora `/v1/` e `/health`. Não torna as respostas REGRAS/ADANA offline. |
| Manifest atual | `web/public/manifest.webmanifest` | Manifesto PWA existente do produto ADANA; não é evidência de funcionamento offline da aba REGRAS. |
| Governança de rotas | `audit/route_governance_v1/ROUTE_REGISTRY.json`, `ROUTE_CONTRACTS.json`, `ROUTE_DEPENDENCIES.json` | Registro canônico da inspeção informa 62 identidades de rota; aprovação/LOCKED deve ser consultado por rota. Não copiar a governança completa para runtime. |
| Contratos de gate | `audit/route_governance_v1/Route_Template_validation_v2` e `REGRESSION_AUDIT.md` | Critérios de suites, evidência, cards, handoff e estados. Servem como referência de auditoria e não devem ser tratados como conteúdo normativo publicado. |
| Suítes focadas | `audit/route_governance_v1/focused_suites/` e resultados/rollups correspondentes | Casos contêm perguntas, IDs, marcadores e fonte esperada. Resultados podem conter resposta gravada e evidência, mas é preciso abrir o artefato apontado e validar caso a caso. |
| Meilisearch executável do ADANA | `tools/local-search/meilisearch.exe` | Binário fora de RENATE e pertencente ao ambiente ADANA. Não foi executado/copiadо. Uma PWA não pode iniciar esse executável do sistema operacional. |

## 3. Fluxo atual ponta a ponta

### REGRAS

1. `web/src/RulesReader.jsx` consulta `/health`, `/api/authorities`, `/api/documents`, `/api/search` e `/api/pdf` no host `127.0.0.1:8795`.
2. `scripts/adana_rules_reader_api.py` valida autoridade e `source_id`, mantém catálogo de fontes verificadas por hash e emite consulta ao índice `adana_library_v1` no Meilisearch (URL padrão `http://127.0.0.1:7700`).
3. A busca da REGRAS filtra documentos `PASSAGE`, limita fontes/autoridade e usa busca híbrida com embedder `local_multilingual` e `semanticRatio=0.35` (confirmado no código e no teste `scripts/test_adana_rules_reader.py`).
4. A API devolve metadados da fonte, edição, localizador, trecho e páginas; o frontend renderiza resultados e solicita PDF à API local.

### Pergunta conversacional e card de prova

1. A UI principal em `web/src/App.jsx` envia pergunta à API local de respostas em `127.0.0.1:8791`.
2. A API recupera e resolve rota/fonte/evidência no pipeline ADANA e compõe a resposta usando Qwen; isto não é uma busca determinística puramente frontend.
3. `adana_competition_cards.resolve_event_card()` é chamado com rota/evento já resolvido. Ele valida o hash do asset e anexa o card visual como complemento.
4. `App.jsx` apresenta imagem, legenda e referências; assets são servidos por rota da aplicação ADANA. Logo, copiar somente `RulesReader.jsx` ou somente os SVGs não produz uma aplicação independente.

## 4. Portabilidade de cards e respostas

| Elemento atual | Origem | Dependência de rede no ADANA | Portabilidade para RENATE |
|---|---|---|---|
| Resultado REGRAS | Meilisearch + API REGRAS + catálogo de Library | Sim, API e Meilisearch em execução; PDF via API | Dados precisam de snapshot local. O contrato de busca híbrida é referência para o gate de viabilidade do engine frontend; o SDK cliente sozinho não substitui o engine. |
| Card de evento | Configuração JSON + SVG/PNG + resolução pela API | Payload e imagem chegam por endpoint local da aplicação | Asset pode ser copiado byte a byte para RENATE após allowlist, hash, aprovação e análise de redistribuição; resolver/renderizar localmente. |
| Resposta de rota | API de respostas + evidências + Qwen | Sim | Apenas snapshot textual pré-testado elegível, com provenance completa e seleção de respostas aprovadas; sem Qwen em runtime. |
| Referência normativa | ID/hash de fonte, edição, regra e locator do resultado | PDF integral abre via API; fonte pode residir fora do bundle | Metadados/referências e trecho autorizado são portáveis; PDF completo depende de direito de distribuição e import explícito. |

Cards do catálogo são rotulados como `visual_supplement_only` no caminho de evento observado. O card não é evidência normativa nem deve, sozinho, fundamentar resposta afirmativa. A resposta gravada de preteste e o card precisam permanecer registros distintos, vinculados por IDs.

## 5. Candidatos de primeira exportação e limite atual

Com base somente no estado observado em 2026-11-05, **WSPS P4 e P5 são candidatos para o primeiro snapshot**, não aprovação final do pacote:

- `wsps.event.p4` consta `LOCKED`; o rollup atual `route44_p4_focused_evidence_rollup_20261105.json` registra 12 PASS, 0 FAIL, 0 ERROR. O rollup aponta para artefatos de evidência individuais que precisam ser validados antes da exportação.
- `wsps.event.p5` consta `LOCKED`; `route45_p5_12_gate_rollup_20261105.json` registra 12 casos PASS. Cada linha aponta a um artefato de evidência individual que precisa ser validado.
- O resultado P4 anterior `wsps_event_p4_focused_results_v1.json` registra 10 PASS/2 FAIL e aprovação anterior `UNVERIFIED`; ele é histórico e **não** deve substituir o rollup posterior de 12/12. Seus failures continuam preservados como histórico.
- Cards candidatos: P4 qualificação/final; P5 qualificação e card que representa a ausência de final. Os IDs, referências e hashes definitivos devem vir da configuração e dos artefatos atuais, validados após a cópia.
- A elegibilidade ainda depende de revisar resposta por resposta, conferir bindings de fonte/hash/localizador, verificar o hash atual de cada artefato e determinar licença/redistribuição. Não se declara quantidade final de perguntas publicáveis nesta inspeção.

Outras rotas e cards não são incluídos por inferência de proximidade. A allowlist do RENATE definirá cada item explicitamente. Registros de preteste `FAIL`/`ERROR`, rota não aprovada, resposta não utilizável ou proveniência incompleta não podem ser FAQ afirmativa.

## 6. Aprovação, fontes e direitos

- Mecanismo de governança encontrado: `ROUTE_REGISTRY.json`, `ROUTE_CONTRACTS.json`, `ROUTE_DEPENDENCIES.json`, suites focadas e evidências/autorizações de rota em `audit/route_governance_v1/`.
- A fonte normativa do conteúdo REGRAS é a fonte original catalogada na Library, associada a `source_id`, SHA-256, edição e localizador. Meilisearch e catálogos são mecanismos de recuperação/roteamento; não substituem a fonte.
- Em P4/P5, os resultados referem fontes WSPS/ISSF e outros materiais de comandos conforme a pergunta. Cada registro elegível deve preservar seus bindings individuais.
- Não foi confirmada neste Gate licença que autorize redistribuir regulamentos/PDFs completos. V1 deve excluir PDF integral até aprovação explícita de redistribuição; não afirmar disponibilidade offline de um documento não empacotado.

## 7. Limitações constatadas

1. REGRAS atual não é offline: depende de API local, Meilisearch e acesso PDF intermediado.
2. A busca híbrida inclui embedder `local_multilingual`; indexação/ranking/configuração efetiva precisam ser exportados e comparados no gate do motor frontend. Não se pode assumir equivalência lexical.
3. API conversacional atual usa backend e Qwen; sua resposta não pode ser reproduzida em runtime no RENATE. Apenas respostas capturadas em pretestes elegíveis entram como respostas fixas.
4. Cards atuais são assets estáticos com um payload montado no backend; não existe família de componentes React de card independente identificada nesta inspeção.
5. URLs `/library-cards/` e `/api/pdf` precisam ser substituídas por assets locais RENATE; PDFs completos têm redistribuição pendente.
6. Card `visual_supplement_only` não é fonte normativa.
7. O binário nativo Meilisearch do ADANA não pode ser iniciado por PWA. A viabilidade de engine real em browser/WASM permanece um gate separado; SDKs browser que acessam servidor não satisfazem a regra sem backend.
8. Testes reais Android/iPhone não foram executados.

## 8. Baseline de arquivos da origem

Não há commit-base da raiz `E:\ADANA 2.0`; os seguintes SHA-256 foram registrados para comparação posterior. A implementação RENATE deve preservar todos:

| Artefato | SHA-256 |
|---|---|
| `scripts/adana_competition_cards.py` | `5650ba583b6608e30252b03195907686bebb885e486f7bcc9ceefc85a8da069f` |
| `scripts/adana_rules_reader_api.py` | `007acaeb409084c509b78b6ca1eb282e64e12af0df950cbc531b3b516350e12c` |
| `scripts/adana_answers_api.py` (hash atual observado) | `c0627e773329270958ac1dcbd0b9e7dc432b4c40b53cb2b9847915c8f8bfcc20` |
| `config/adana_competition_cards_v1.json` | `e69d4279ad2d9b0ff2b4ff9994039873d288956e63f6cae7ace5ef66acbc0991` |
| `audit/route_governance_v1/ROUTE_REGISTRY.json` | `2582c7d2ca0f159872b0d78cecbab3fcf7f8d6c7d534c752601b09dc335a25f0` |
| `audit/route_governance_v1/focused_suites/wsps_event_p4_focused_cases_v1.json` | `0313aa8c744c028a064c346498122e9a89147ae400eea02361cec6c2c2b23f46` |
| `audit/route_governance_v1/route44_p4_focused_evidence_rollup_20261105.json` | `5ecdb463b48b0963bf2f8ec511d9661ec7b42d68ce02f5b21498899c255de7c9` |
| `audit/route_governance_v1/route45_p5_12_gate_rollup_20261105.json` | `49ae0adf9911356bd8e7777d8eb2dc69ef63bce489506bbe21c30df2699cbe7a` |

## 9. Testes que não podem regredir

Antes e depois da implementação, registrar resultados dos testes existentes relevantes, sem modificar os testes para forçar PASS:

- `python scripts/test_adana_rules_reader.py` — hash/catalogação de fontes, escopo de busca, filtro, híbrido e parser de localizadores;
- `python scripts/test_adana_wsps_event_p4_card_pass.py` — identidade/ordem de cards P4, fontes, hashes e critérios de entrega;
- `npm run test:routes:regression:static` — governança/contratos estáticos das 62 identidades, quando a execução controlada não modificar fora de `RENATE/`;
- `npm run test:routes:regression` — suíte runtime principal, quando serviços necessários estiverem disponíveis; exige registro explícito de API/Qwen e resultados.

Resultado baseline neste Gate: os dois testes focados acima passaram; o preflight estático global **FAIL/BLOCKED** porque `audit/route_governance_v1/ROUTE_BASELINE.json` espera `answer_api` SHA-256 `d82bf5c05ea7ee8985c13ddb05b350f74c27f84a6dd98f3205bca1d695af6bfc`, enquanto a origem atual é `c0627e773329270958ac1dcbd0b9e7dc432b4c40b53cb2b9847915c8f8bfcc20`. O mecanismo de teste barrou a validação e não iniciou replay runtime. Nenhum baseline foi atualizado. Os testes do RENATE devem rodar dentro de RENATE e escrever seus artefatos somente lá. Para testes existentes do ADANA, qualquer saída gerada fora de RENATE deve ser evitada ou ter sua escrita direcionada para área temporária sob RENATE.

## 10. Critério de saída do Gate 0

O fluxo atual REGRAS → API/Meilisearch e o fluxo pergunta → API/Qwen/evidência → card foram identificados com arquivos concretos. O inventário está completo, mas o Gate 0 permanece **ABERTO**: o baseline global foi bloqueado por divergência protegida de hash em `answer_api`. Esse estado pertence à origem e não foi corrigido nem reconciliado pelo RENATE. O baseline focado passou. Antes de exportação/release, repetir a validação global somente depois de a governança do ADANA resolver a divergência por seu processo próprio; em paralelo, executar o gate técnico do engine Meilisearch no frontend descrito em `RENATE_BETA_OFFLINE_SPEC_V1.md`.
