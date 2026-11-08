# Briefing de retomada — RENATE BETA Offline

> **Histórico supersedido:** decisões e estado atuais estão no briefing de 2026-11-06 e na SPEC RENATE v1.8. Referências deste documento a snapshots ausentes e SPEC antiga não são instruções vigentes. O Golden Set atual é exclusivamente um manifesto de teste por IDs e hashes; o runtime lê o ATLAS diretamente.

**Data de referência:** 2026-11-05  
**Raiz exclusiva de trabalho/entrega:** `RENATE/`  
**Estado:** alinhamento documental concluído; implementação não iniciada.

## 1. Instrução de retomada

Retomar somente dentro de `RENATE/`. O ADANA 2.0 principal e a SPEC `ADANA20_BETA_OFFLINE_SPEC_CODEX.md` ficam bloqueados para qualquer ação de RENATE: não abrir fontes do ADANA, executar testes, iniciar serviços, consultar APIs/Meilisearch, exportar dados, comparar novos hashes, editar ou alterar gates. A SPEC de referência dentro de RENATE é somente leitura. Não considerar a inspeção histórica do Gate 0 como autorização para novas ações.

Use `README.md` como painel de status diário e `RENATE_BETA_OFFLINE_SPEC_V1.md` v1.3 como contrato operacional do produto.

## 2. Estado confirmado

- A SPEC de referência foi lida integralmente e mantida intacta. SHA-256 observado da cópia em RENATE: `01A52BB6D4DE99E621FA3D99A85D86382CED1A6650AEE30818044C646DD1CF67`.
- A SPEC específica de RENATE foi reconciliada com a referência sem editar a referência.
- O Gate 0 histórico identificou REGRAS, pipeline de cards, dependências de API/Meilisearch/Qwen, candidatos P4/P5, fontes e testes. Seu estado de saída continua **ABERTO/BLOQUEADO**, não PASS global.
- O relatório de Gate 0 registra os testes focados baseline como aprovados: `test_adana_rules_reader.py` 5/5 e `test_adana_wsps_event_p4_card_pass.py` 6/6. O preflight estático global está FAIL/BLOCKED devido à divergência protegida de SHA-256 de `answer_api`; o replay runtime não começou. Não repetir esses testes no ADANA.
- P4 e P5 aparecem no inventário como candidatos, não como pacote aprovado: evidências individuais, bindings completos e licenças ainda precisam estar disponíveis localmente para RENATE.
- RENATE contém a imagem `docs/Logo RENATE_ Alvo Esportivo Brasileiro.png`; é um asset de marca/referência, não uma Skin implementada.
- Não existe `package.json`, `src/`, `public/`, Skin React/CSS, build PWA, Supabase schema, banco de regras, banco de respostas, índice local ou bundle offline.
- `library/` foi criado como endereço próprio do corpus documental, com README e cabeçalho de manifesto; não há PDFs/OCR-fonte ali nem em outra pasta de RENATE nesta atualização. A entrada de documentos segue bloqueada até as cópias autorizadas serem fornecidas dentro de RENATE.
- Nenhum arquivo com nome RENATE foi encontrado fora da pasta RENATE na varredura do workspace; nenhum foi movido. `RENATE/` ainda não possui `.git`.
- Não foram executados testes nesta atualização documental.

## 3. Decisões vigentes

1. **Independência:** RENATE será o único diretório necessário para commit/transferência; todos os fontes, dados permitidos, assets, ferramentas declaradas, testes, relatórios e `dist/` devem ficar dentro dele.
2. **ADANA bloqueado:** usar somente os artefatos já arquivados em RENATE ou snapshots que o usuário coloque/autorize colocar dentro de RENATE. O agente não buscará arquivos no ADANA.
3. **Produto:** pergunta natural PT-BR, recuperação determinística e respostas de pretestes elegíveis; sem geração livre, Qwen, MCP, servidor ou consulta remota durante busca.
4. **Supabase:** somente INSERT de lead no primeiro cadastro, usando chave publishable pública e RLS; cliente sem SELECT/UPDATE/DELETE; administrador consulta/exporta pelo painel Supabase. Não incluir segredo no pacote.
5. **Login:** PIN local após preparação/instalação. Não é autenticação de identidade; sem recuperação remota.
6. **Atualizações:** ação manual `Verificar atualização`, confirmação antes de baixar, validação de assinatura e integridade e substituição atômica do pacote. Registrar que navegador pode verificar o script do Service Worker por conta própria ao abrir a PWA.
7. **Busca:** comparar Meilisearch com candidatos JS/WASM que rodam no browser, escolher por golden set e benchmark; não usar SDK remoto como engine.
8. **Skin e áudio:** identidade cromática/tipográfica da CBTE, layout/conversa do ADANA, pergunta e resposta em áudio offline. ASR/TTS e fontes devem ser locais, licenciados e testados.
9. **Fontes:** não redistribuir PDFs/documentos completos sem direito confirmado. Cards `visual_supplement_only` não são evidência normativa.
10. **Testes:** a suíte do ADANA está proibida. Executar e reportar somente testes RENATE; testes físicos Android/iOS devem ter evidência por aparelho, senão constar como pendentes.
11. **Library RENATE:** corpus próprio em `RENATE/library/` (no pacote Git, `library/`), limitado às cópias locais independentes dos documentos necessários e efetivamente referenciados para consulta. Guardar cada fonte autorizada em PDF e seu OCR correspondente com vínculo por hash, edição, localizador e licença. Nenhuma consulta, leitura ou extração em ADANA é autorizada; arquivos faltantes devem ser fornecidos dentro de RENATE. Não importar toda a Library nem arquivos sem uso comprovado.

## 4. Arquivos e artefatos

### Presentes antes desta reconciliação

- `ADANA20_BETA_OFFLINE_SPEC_CODEX.md` — cópia da referência, imutável.
- `RENATE_BETA_OFFLINE_SPEC_V1.md` — SPEC própria; estava em v1.2 antes desta continuação e está em v1.3 agora.
- `docs/Logo RENATE_ Alvo Esportivo Brasileiro.png` — imagem de logo; não integrada à Skin.
- `docs/beta-offline/GATE0_INVENTARIO.md` — relatório histórico, estado aberto/bloqueado.
- `docs/beta-offline/baseline_rules_reader.log` — evidência histórica 5/5.
- `docs/beta-offline/baseline_p4_card.log` — evidência histórica 6/6.
- `docs/beta-offline/baseline_routes_static.log` — evidência do preflight bloqueado pela divergência de hash.

### Alterados/criados nesta tarefa documental

- Alterado: `RENATE_BETA_OFFLINE_SPEC_V1.md` — reconciliação, bloqueio de acesso ao ADANA e Library independente mínima; versão 1.3.
- Criado: `README.md` — status e diário que deve ser atualizado ao final de cada dia de trabalho.
- Criado: `docs/beta-offline/BRIEFING_RETOMADA_2026-11-05.md` — este briefing.
- Criado: `docs/beta-offline/PLANO_TRABALHO_5_DIAS.md` — roteiro de execução em cinco dias, condicionado ao recebimento de insumos em RENATE.
- Criados: `library/README.md` e `library/manifest.csv` — estrutura e manifesto do corpus local mínimo, ainda sem documentos.
- Atualizados nesta continuação: `README.md`, este briefing e o plano de cinco dias para formalizar a Library própria e mínima de RENATE, com cópias locais independentes (PDFs referenciados e OCRs correspondentes) e proibição explícita de consultar/extrair arquivos do ADANA.

Não foram alterados nesta tarefa: SPEC de referência, relatório Gate 0, logs de baseline, logo e qualquer arquivo fora de RENATE.

## 5. Situação da SKIN RENATE

**Não iniciada.** O logo RENATE existe como imagem em `docs/`, mas não há aplicativo, CSS, fontes, ícones de PWA, componentes ou layout implementados. Também não foram extraídos os valores exatos de cor/tipografia da CBTE nem comparadas capturas do layout ADANA. A imagem presente não deve ser tratada como prova de uma Skin pronta nem como substituta da identidade CBTE solicitada.

Para reproduzir o layout ADANA sem acessar o ADANA, será necessário o usuário colocar dentro de RENATE as referências permitidas — por exemplo, capturas aprovadas, CSS/componentes já copiados ou descrição visual suficiente. Para conteúdo e cards, serão necessários snapshots aprovados e licenciados dentro de RENATE.

## 6. Bloqueios e próximos passos

1. **Disponibilizar material-fonte dentro de RENATE:** cópias locais independentes dos exports aprovados de pretestes/respostas e evidências individuais; allowlist que identifica as fontes realmente consultadas; somente os PDFs necessários e seus OCRs, com metadados de edição, hash, localizador e licença; assets de cards com configuração/hashes/licenças; golden set; referências visuais já colocadas e autorizadas para uso; dados públicos de tokens visuais CBTE. Não consultar nem extrair arquivos do ADANA.
2. Montar a Library mínima em `RENATE/library/`, validar somente arquivos que já estejam dentro de RENATE e criar `EXPORT_AUDIT.md`. Não importar toda a Library nem buscar material faltante fora de RENATE.
3. Produzir `CBTE_ADANA_VISUAL_REFERENCE.md` com cores, fontes, pesos, licença/proveniência e referências de layout disponíveis.
4. Executar viabilidade frontend do buscador e ASR/TTS offline em navegador/dispositivos-alvo; medir tamanho, memória, latência e cobertura PT-BR.
5. Implementar Skin/app/PWA, Supabase com RLS INSERT-only, PIN local, busca e pacote versionado, toda dentro de RENATE.
6. Testar golden set, negativas, integridade, funcionamento offline após reabertura, atualização cancelada/interrompida e bundle. Não executar nada na origem ADANA.
7. Completar instruções de instalação e validação real Android/iOS; publicar `TEST_REPORT.md`, `RELEASE_NOTES.md` e atualizar diariamente README/briefing.

## 7. Condição para encerrar a retomada

Só marcar cada gate como PASS com artefatos e resultados verificáveis em RENATE. O inventário histórico não desbloqueia acesso ao ADANA, o logo não equivale a Skin, os testes baseline do ADANA não equivalem a testes RENATE e a falta de snapshots não deve ser preenchida por respostas inventadas.
