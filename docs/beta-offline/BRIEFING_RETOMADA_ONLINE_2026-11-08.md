# Briefing de retomada — etapa online RENATE

**Atualizado:** 08/11/2026 · **Workspace:** `E:\ADANA 2.0\RENATE`  
**Estado:** retomado pela usuária em 08/11; configuração em andamento, sem deployment.

## Objetivo autorizado

Fechar Supabase apenas para a inserção inicial de lead (nome, e-mail, telefone), sem leitura pelo cliente, e publicar RENATE no Vercel/HTTPS após testar a política, o fluxo e a PWA. O PIN, conversas, perguntas, respostas e histórico continuam locais. Nenhum segredo administrativo deve entrar no frontend, pacote, Git ou chat.

## Gates offline já fechados

- A usuária informou `offline aprovado` para instalação e consulta offline da PWA no Android; registro em `OFFLINE_HUMAN_ACCEPTANCE_2026-11-08.md`.
- Pacote local: 1.106 Q&A e 131 cards aprovados. SHA-256 do pacote: `5627f767a3ba3f24fadc2c01173ae5768e558aebb58afb0cff797ae5cddfbd55`; `cards.json`: `d1e560c39fd169e52c57b235db5ebce5b71b079ef8a1aaed1fb497ec868103ef`.
- As lacunas gerais de apresentação permanecem adiadas na SPEC. Não alterar rotas, perguntas ou sequência do Q&A.

## Fluxo local preparado

- Primeiro acesso sem PIN: formulário de lead → convite para instalar a PWA → criação do PIN local.
- Dispositivo que já tem PIN: entra pelo fluxo local existente, sem exigir novo cadastro.
- Somente o marcador de conclusão do cadastro é gravado no IndexedDB; nome/e-mail/telefone não são persistidos localmente.
- Arquivos principais: `src/leadRegistration.js`, `src/App.jsx`, `src/localHistory.js`, `src/styles.css`.
- Migration preparada: `supabase/migrations/20261108203000_create_private_leads.sql`.
- Migrations `20261108220000_leads_contact_fields_only.sql` e `20261108223000_leads_exactly_three_columns.sql` aplicadas após dry-run. Consulta read-only remota confirmou exatamente `full_name,email,phone`, RLS ativo, INSERT validado pela policy e SELECT/UPDATE/DELETE negados para `anon`. Nenhum lead foi enviado. O formulário já envia somente os três campos.

## Estado Supabase

- Projeto fornecido pela usuária: ref `lqcckwnewvvifhjxdbxo`; URL pública `https://lqcckwnewvvifhjxdbxo.supabase.co`.
- CLI 3.0.0 está instalada como dependência local. Use `npx supabase`; o executável global `supabase` não está no PATH desta sessão.
- `supabase/config.toml` já existe com `project_id = "renate"`. Não rode `supabase init --force`.
- `npx supabase init --yes` foi tentado e retornou `InitConfigExistsError` porque o arquivo já existe; não houve alteração destrutiva.
- A usuária autenticou e vinculou o projeto no terminal interativo. O `link` foi concluído com sucesso.
- A imagem enviada pela usuária mostra a conta aberta na página Database → Migrations. O controle do navegador da sessão Codex estava indisponível, portanto nenhum clique ou mudança foi feito no painel.
- A migration `20261108203000_create_private_leads.sql` foi aplicada via `npx supabase db push --remote`; o dry-run listou somente esse arquivo. Nenhum lead ou dado pessoal foi enviado ao Supabase.

## Estado Vercel

- Projeto: `clynson-pngs-projects/renate`, associado ao GitHub.
- Variáveis Production confirmadas por nome (valores não revelados): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, tipo `Config`.
- A usuária informou que criou a publishable key; ela já aparece no ambiente Production. Nunca usar chave `secret` ou `service_role` em `VITE_*`.
- O projeto estava definido como Node `26.x`, incompatível com o build atual. Ajustado para `24.x` via `vercel project update renate --node-version 24.x --yes`, depois `vercel pull --yes --environment production`.
- `vercel build --prod --yes`: **PASS**, saída em `.vercel/output`. O primeiro retry ainda leu settings locais antigos (`26.x`); após `vercel pull`, passou.
- **Nenhum deployment foi feito.**
- Build Vercel emitiu aviso que scripts de instalação de `esbuild`, `onnxruntime-node` e `protobufjs` não foram aprovados pelo npm; o build concluiu. Revisar antes de ativar qualquer instalação ou rebuild que dependa deles.

## Verificações desta etapa

- `npm run build`: **PASS**; pacote manteve 1.106 Q&A e 131 cards, sem mudança de rota/Q&A.
- `npm run test:history`: **PASS 4/4**.
- `npm run test:lead-privacy`: **PASS estático**; nenhum lead ou segredo administrativo no pacote; `.env.local` está ignorado pelo Git.
- `git diff --check`: sem erro de whitespace; apenas avisos de conversão CRLF do Git.
- Auditoria/registro de privacidade: `LEAD_PRIVACY_ACCEPTANCE_2026-11-08.json`, `SUPABASE_LEADS_ADMIN_GUIDE.md` e `ONLINE_SERVICE_REGISTRY_2026-11-08.md`.

## Credenciais e cuidado com arquivos locais

- Não solicitar nem colar chave Supabase, token pessoal, senha de banco ou token Vercel no chat.
- `.env.local` e `.vercel/.env.production.local` são arquivos ignorados que podem conter token OIDC/variáveis. Não ler, imprimir, copiar para Git nem apagar nesta retomada sem necessidade.
- Valores das variáveis Vercel foram conferidos somente por nomes; não foram exibidos.

## Próximos passos ao retomar

1. Validar Data API/formulário com dado sintético (INSERT permitido; GET/SELECT, UPDATE e DELETE negados). Não enviar lead real; excluir o registro sintético pelo painel administrativo autenticado.
2. Antes de publicar, a usuária precisa decidir/documentar o prazo de retenção dos leads e o procedimento/canal de exclusão. Também revisar mitigação de spam: unicidade por e-mail não limita tentativas por IP.
3. Revisar as aprovações de scripts npm pendentes; depois, refazer o build Vercel com ambiente Production.
4. Só então publicar no Vercel e validar HTTPS, formulário inicial, instalação/atualização PWA hospedada e consulta offline no Android. Registrar evidências; não inferir aprovação humana a partir do build.

## Estado final desta pausa

Supabase: migrations aplicadas; três colunas, grants e policy RLS confirmados por consulta read-only; Data API runtime pendente.  
Vercel: projeto e variáveis Production configurados; build remoto local de produção passou; sem deployment.  
Pendências bloqueantes: Data API runtime, política de retenção/exclusão, mitigação de abuso, validação hospedada e revisão do aviso de privacidade.  
Invariante: não tocar rotas, perguntas, respostas ou sequência do Q&A.
