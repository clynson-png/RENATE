# Briefing de retomada — Supabase/Vercel RENATE

**Criado:** 08/11/2026 · **Retomado:** 09/11/2026  
**Workspace:** `E:\ADANA 2.0\RENATE`  
**Estado:** retomada executada em 09/11/2026. Edge Function/Turnstile implementados e testados localmente; migration de revogação de INSERT direto aplicada; publicação da função e do frontend pendentes.

## Objetivo e limites

- Fechar a etapa online autorizada: registrar somente nome, e-mail e telefone no primeiro acesso; manter perguntas, respostas, histórico e PIN no dispositivo; depois publicar no Vercel/HTTPS quando todos os gates forem aprovados.
- A usuária decidiu que a tabela `public.leads` terá literalmente três colunas: `full_name`, `email`, `phone`. Não persistir consentimento, versão do aviso, ID ou timestamp.
- Retenção aprovada: manter até pedido de exclusão. Sem timestamp, não há expurgo automático por idade; o administrador removerá a linha manualmente após pedido recebido pelo canal público, ainda não informado.
- Proteção aprovada: Edge Function `renate-lead-registration` + Turnstile validado no servidor. A tabela não aceita INSERT direto de `anon`; Turnstile não é limite por IP.
- O PIN continua local; não foi solicitado nem configurado Supabase Auth remoto.
- Não alterar rotas, perguntas, respostas ou sequência do RENATE.
- Não mexer em `ADANA 2.0` fora da pasta `RENATE/`.
- Deployment Vercel e uso de dados reais não foram feitos. Teste Data API usou somente um registro sintético, removido em seguida.

## Supabase remoto — estado confirmado

- Projeto: `lqcckwnewvvifhjxdbxo` — `https://lqcckwnewvvifhjxdbxo.supabase.co`.
- A usuária aplicou a migration inicial `20261108203000_create_private_leads.sql`.
- Após a decisão por somente três campos, foram aplicadas as migrations:
  - `supabase/migrations/20261108220000_leads_contact_fields_only.sql`
  - `supabase/migrations/20261108223000_leads_exactly_three_columns.sql`
- Antes de cada aplicação, `npx supabase db push --dry-run --remote` listou somente a migration pendente esperada. Ambas foram aplicadas com `npx supabase db push --remote --yes`; CLI informou conclusão.
- Depois, `npx supabase db query --remote --read-only` confirmou:
  - colunas da tabela exatamente `full_name, email, phone`;
  - RLS habilitado;
  - antes da migration de 09/11 havia policy/INSERT para `anon`;
  - depois da `20261109210000_leads_insert_via_function_only.sql`, não há policy pública; `anon` não tem INSERT/SELECT/UPDATE/DELETE e `authenticated` não tem INSERT.
- Teste API em 09/11: INSERT sintético 201; GET/PATCH/DELETE 401; CLI removeu a linha; consulta posterior confirmou `lead_rows = 0`.
- Não compartilhar tokens, senha do banco ou chave `service_role` no chat. A chave publishable é configuração pública já cadastrada no Vercel; seu valor não foi exibido.

## Código local alterado

- `src/leadRegistration.js`: valida e envia somente `full_name`, `email`, `phone`; removida validação/serialização dos metadados de consentimento.
- `src/leadRegistration.js` envia os três campos e um token Turnstile efêmero somente para a Edge Function. `src/App.jsx` carrega o widget sob demanda e bloqueia o envio sem token.
- `supabase/functions/renate-lead-registration/index.js` valida allowlist de origem, formato dos campos, action e hostname via Siteverify antes de inserir somente três colunas com segredo server-side.
- `supabase/migrations/20261109210000_leads_insert_via_function_only.sql` remove policy e privilégios públicos; aplicada ao projeto remoto.
- `src/App.jsx`: formulário inicial exibe os três campos; checkbox removido; aviso de privacidade permanece disponível; PIN local e fluxo de instalação permanecem.
- `src/styles.css`: removidos estilos do checkbox de consentimento.
- Migration inicial aplicada não foi reescrita; mudanças de esquema foram feitas por migrations aditivas, preservando histórico.
- A SPEC, README, plano de cinco dias, registro de serviços e guia administrativo foram atualizados para refletir o esquema de três colunas.

## Verificações e pendências

- Verificação remota de catálogo/grants/policy: **PASS**, somente leitura.
- `git diff --check`: **PASS** sem erros de whitespace; Git reporta avisos de conversão LF/CRLF nos arquivos do worktree.
- Build com ambiente Production: **PASS** (`npx vercel env run -e production -- npm run build --ignore-scripts`); `prebuild` foi omitido para preservar o pacote de dados/cards.
- `npm run test:lead-privacy`: **PASS**; reporte atual em `LEAD_PRIVACY_ACCEPTANCE_2026-11-09.json`.
- Teste browser: três campos, sem checkbox, payload `full_name/email/phone`, avanço para instalação. API foi interceptada nessa verificação, sem gravar registro.
- Teste API sintético: POST 201; GET/PATCH/DELETE 401; linha removida e contagem final zero. Evidência em `SUPABASE_LEAD_API_RUNTIME_2026-11-09.json`.
- Testes locais da função: 6/6; formulário browser com token Turnstile sintético passou sem gravação. Após revogar grants, POST REST direto com publishable key retornou 401. Evidência `SUPABASE_LEAD_EDGE_RUNTIME_2026-11-09.json`.
- Deploy da função exigiu confirmação de mutação hospedada; CLI recusou sem alterar o projeto. Widget, segredos, sitekey pública e função remota continuam pendentes.
- Retenção decidida até pedido de exclusão; falta definir/divulgar canal de privacidade e exclusão.
- Vercel Production já contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`; Node está em `24.x`; `vercel build --prod --yes` havia passado antes desta alteração de formulário. Nenhum deployment foi feito.
- O teste da PWA hospedada/HTTPS e atualização instalada segue pendente.

## Git/worktree

- Repositório local RENATE existe na branch `main`, sem remoto configurado conforme estado anterior.
- Worktree já estava bastante alterado antes desta pausa, incluindo conteúdo, avaliações, build scripts, app e documentação. Não descartar, limpar, resetar ou commitar alterações sem instrução explícita.
- Nenhuma alteração foi feita fora de `E:\ADANA 2.0\RENATE` nesta retomada.

## Próximas pendências e retomada

1. Criar o widget Turnstile para o domínio final; configurar `TURNSTILE_SECRET_KEY` e `RENATE_ALLOWED_ORIGINS` em Supabase Edge Function secrets e `VITE_TURNSTILE_SITE_KEY` como configuração pública Vercel.
2. Solicitar confirmação de deploy da função: o Supabase CLI recusou a mutação hospedada no modo agente sem essa confirmação. Depois, testar token via função e resposta sem token; sem dados reais.
3. Definir/divulgar canal público para pedidos de exclusão; depois regenerar build Production (prebuild desativado), publicar Vercel e validar PWA hospedada/HTTPS Android.

**Estado confirmado em 09/11:** build Production após alterações PASS (cache `9964c0d2eb912e3b`, 306 assets, 363.294.605 bytes); Edge Function 6/6 unit tests; browser form PASS com token sintético; migration aplicada e grants `anon` negados; REST INSERT direto 401. Função não implantada pelo gate de confirmação do CLI. Sitekey/segredo Turnstile e canal público pendentes. Evidência `SUPABASE_LEAD_EDGE_RUNTIME_2026-11-09.json`.

**Invariante:** não alterar rotas, Q&A ou sequência; não publicar antes de implantar/testar a função, configurar Turnstile, divulgar o canal de exclusão e validar a PWA hospedada.
