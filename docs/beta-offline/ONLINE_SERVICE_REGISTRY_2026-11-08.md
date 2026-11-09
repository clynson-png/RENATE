# Registro de serviços e configuração online — RENATE

**Atualizado:** 09/11/2026. **Deployment de produção:** não realizado.

| Serviço | Estado | Configuração/evidência | Aprovação |
|---|---|---|---|
| Supabase hospedado | Três colunas; INSERT direto revogado | Ref `lqcckwnewvvifhjxdbxo`; URL pública `https://lqcckwnewvvifhjxdbxo.supabase.co`. Migration `20261109210000_leads_insert_via_function_only.sql` aplicada remotamente. Consulta read-only confirmou colunas `full_name,email,phone`, RLS `true`, privilégios `anon` INSERT/SELECT/UPDATE/DELETE `false`, `authenticated` INSERT `false`, nenhuma policy pública. | Grants verificados. Edge Function ainda não implantada; sitekey/secret Turnstile e teste através da função pendentes. Retenção aprovada até pedido; canal de exclusão pendente. |
| Vercel | Projeto criado e vinculado ao repositório GitHub | `clynson-pngs-projects/renate`. `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão no Production como `Config`; conferidas por nome, valores não exibidos. Node `24.x`. `vercel build --prod --yes` passou para `.vercel/output`. | Hosting autorizado; deployment e aceite da versão hospedada pendentes. |
| Supabase Edge Function | Código local e testes sintéticos PASS; não implantada | `renate-lead-registration` valida origem, campos, action e hostname do token Turnstile via Siteverify; insere apenas as três colunas. Node unit tests 6/6 e browser form PASS com token sintético interceptado; nenhuma lead escrita. `anon` não grava diretamente. Evidência `SUPABASE_LEAD_EDGE_RUNTIME_2026-11-09.json`. | Gate remoto pendente: criar widget, definir segredos no Supabase, implantar e testar com token real sintético e REST denial. Sem rate-limit por IP. |

## Dados e permissões planejados

- Campos do lead aprovados e presentes na tabela: nome completo (`full_name`), e-mail (`email`) e telefone (`phone`); somente no primeiro cadastro. Nenhuma coluna adicional, consentimento ou carimbo temporal é persistido. Retenção: até pedido de exclusão; a remoção será manual após pedido pelo canal público, ainda a definir.
- PIN, perguntas, respostas e histórico: locais; não enviados aos serviços online.
- Migration: RLS habilitado; `public`, `anon`, `authenticated` sem privilégios e sem policy pública. A Edge Function insere após validar Turnstile e os três campos; e-mail único normalizado.
- A tabela privada deve ser consultada/exportada somente pelo administrador autenticado no painel Supabase.

## Credenciais e valores

- URL Supabase e ref do projeto: configuração pública, registrados acima.
- Publishable key: configurada no Vercel como `VITE_SUPABASE_PUBLISHABLE_KEY` (Production). Não usar `secret` nem `service_role`.
- Access token da CLI Supabase: autenticação e vínculo foram concluídos no terminal da usuária; nenhum valor foi salvo no repositório ou compartilhado no chat.
- `.env.local` contém configuração/autenticação de ferramenta Vercel gerada pelo CLI; o valor não foi lido nem reproduzido, o arquivo é ignorado pelo Git. Nunca incluir esse arquivo no commit.
- Nenhuma chave administrativa, service-role, senha SQL ou segredo Supabase está presente no cliente.

## Evidências e gates

- Build local de 09/11 com sitekey Cloudflare de teste: **PASS**; browser form com token sintético interceptado **PASS**. Build atualizado com ambiente Vercel Production também **PASS**, cache `9964c0d2eb912e3b`, 306 assets; sem sitekey pública o formulário segue desabilitado até configuração.
- `npm run test:history`: PASS 4/4.
- `npm run test:lead-privacy`: PASS estático e de política runtime; nenhum lead/segredo administrativo no pacote, `.env.local` ignorado. Evidência `LEAD_PRIVACY_ACCEPTANCE_2026-11-09.json`.
- Projeto Supabase CLI: dry-run remoto listou apenas a migration de leads; `npx supabase db push --remote` terminou com `Finished supabase db push.` em 08/11/2026. A tentativa local anterior apontou somente Docker/Postgres local indisponível e foi resolvida usando `--remote`.
- Migrations de esquema e migration `20261109210000_leads_insert_via_function_only.sql` aplicadas após dry-run. Consulta read-only confirmou três colunas, RLS e ausência de privilégios/policies públicos. O INSERT 201 documentado no teste antigo precede a revogação. Nova Edge Function passou seis unit tests; formulário browser passou com Turnstile sintético interceptado e não gravou lead.
- `Vercel env ls production` confirmou `VITE_SUPABASE_URL` como `Config`; nenhum deployment foi feito.
- Antes da publicação: criar widget Turnstile para domínio final; configurar `VITE_TURNSTILE_SITE_KEY` no Vercel e `TURNSTILE_SECRET_KEY`, `RENATE_ALLOWED_ORIGINS` e segredo Supabase server-side na Edge Function; confirmar deploy da função; testar fluxo via função; definir/divulgar canal de exclusão; validar PWA hospedada/HTTPS. Turnstile não é rate-limit por IP.
- Retenção aprovada até pedido de exclusão. O release segue bloqueado por sitekey/segredos e implantação da função, teste remoto, canal de privacidade e aceite PWA HTTPS. Nenhum lead real foi usado.
