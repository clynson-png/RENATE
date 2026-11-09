# Supabase — cadastro inicial de leads RENATE

**Atualizado em 09/11/2026:** três colunas confirmadas; retenção até pedido de exclusão e proteção via Edge Function + Turnstile server-side aprovadas. Migration aditiva aplicada; código local passou 6/6 unit tests e o POST REST direto está negado. Edge Function ainda não implantada; evidência antiga de INSERT direto 201 descreve o desenho anterior.

## Escopo e dados

- O único fluxo remoto de dados do usuário é o primeiro cadastro: nome completo, e-mail e telefone. A tabela contém exatamente essas três colunas; não há ID, data de criação ou metadados de consentimento.
- Conversas, perguntas, respostas, PIN e histórico não são enviados ao Supabase.
- O cliente usa `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_TURNSTILE_SITE_KEY` via HTTPS. Publishable key e site key são públicas; nenhuma delas autoriza leitura da tabela.
- A migration aditiva `supabase/migrations/20261109210000_leads_insert_via_function_only.sql` remove policy/grants diretos de `public`, `anon` e `authenticated`; RLS continua ativo. A função Supabase `renate-lead-registration` valida origem, formato dos três campos e token Turnstile via Siteverify antes de inserir.
- O segredo Turnstile e chave administrativa do Supabase ficam somente nos Edge Function secrets do projeto, nunca em `.env` de frontend, `VITE_*`, Vercel, browser ou Git. A função usa service-role somente para inserir no endpoint fixo de `public.leads`, com body contendo apenas `full_name`, `email`, `phone`.
- Um conflito HTTP 409 do banco por e-mail já cadastrado vira resposta idempotente de sucesso; a função não lê nem retorna o registro existente.
- A conclusão local guarda apenas um marcador de cadastro no IndexedDB. Os dados de contato não são gravados localmente.

## Acesso administrativo

Após a migration e o teste remoto, o administrador acessará a lista somente pelo painel autenticado do Supabase. Não criar tela administrativa no RENATE e não colocar `secret`, `service_role`, credencial administrativa ou conexão SQL no frontend, PWA, Git ou variáveis `VITE_*`. Exportação CSV deve ser feita pelo administrador no painel e armazenada em local privado.

## Itens obrigatórios antes de publicar

1. **Retenção aprovada:** manter leads até pedido de exclusão. Sem timestamp, não haverá expurgo individual automático. O administrador removerá a linha no painel Supabase após solicitação verificada.
2. **Gate antes de publicação:** definir e divulgar canal/endereço oficial para pedidos de privacidade/exclusão. O canal ainda não foi informado; não inventar ou publicar e-mail pessoal.
3. **Proteção aprovada; código e teste local concluídos, implantação pendente:** Edge Function + validação server-side Turnstile e allowlist de origens. Essa barreira bloqueia submissões sem token válido, mas não aplica rate-limit por IP; limite por IP não foi configurado nem aprovado.
4. **Concluído em 09/11:** migration `20261109210000_leads_insert_via_function_only.sql` passou dry-run e push remoto; consulta read-only confirmou grants públicos negados; POST REST direto com publishable key retornou 401. Deploy da Edge Function aguarda confirmação exigida pelo CLI.
5. Guardar `TURNSTILE_SECRET_KEY`, `RENATE_ALLOWED_ORIGINS` e a chave Supabase server-side como Edge Function secrets. Criar `VITE_TURNSTILE_SITE_KEY` só em Vercel Production como configuração pública.
6. Depois do deploy, testar token falso/reutilizado (deve falhar) e token válido sintético (só três colunas); remover qualquer registro sintético e confirmar lista vazia.
7. Teste antigo de 09/11 (antes da revogação): INSERT direto 201; GET/PATCH/DELETE 401, registro removido. Preservado como evidência histórica, não como aceite do novo desenho.
8. Registrar no inventário de release ref/URL públicos, variáveis no Vercel, nomes dos segredos (sem valores), grants/RLS, origem autorizada, evidência e aprovação; não registrar valores secretos.

## Situação operacional

- Supabase CLI 3.0.0 instalado no pacote local.
- A usuária autenticou a CLI no terminal e vinculou o projeto `lqcckwnewvvifhjxdbxo`. O dry-run remoto listou somente a migration de leads e `npx supabase db push --remote` terminou com sucesso em 08/11/2026.
- Docker/Podman não foi detectado; testes locais da stack Supabase não estão disponíveis nesta máquina. O alvo é o Supabase hospedado.
- Quatro migrations foram aplicadas; catálogo confirmou esquema/RLS e a migration mais recente revogou grants públicos. O POST sintético direto pós-migration confirmou HTTP 401 sem criar linha. O teste antigo de inserção ocorreu antes da revogação.
- Projeto Supabase fornecido pela usuária: ref `lqcckwnewvvifhjxdbxo`, URL pública `https://lqcckwnewvvifhjxdbxo.supabase.co`.
- Vercel Production contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como `Config`; os valores não foram mostrados ou copiados para o chat.
- O projeto Vercel `clynson-pngs-projects/renate` foi criado/conectado ao GitHub, sem deployment de produção. Node está em `24.x`; `vercel build --prod --yes` passou para `.vercel/output` após atualizar as configurações locais com `vercel pull`.
