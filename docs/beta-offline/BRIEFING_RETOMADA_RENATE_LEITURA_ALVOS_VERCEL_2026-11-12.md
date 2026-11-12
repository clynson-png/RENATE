# Briefing de retomada — RENATE Ler alvos no Vercel

**Data:** 12/11/2026
**Workspace:** E:\ADANA 2.0\RENATE
**Objetivo:** identificar por que a aba **Ler alvos** não aparece no RENATE aberto pela usuária e concluir a validação da versão Production sem alterar o bypass local de desenvolvimento nem remover o login hospedado.

## Estado confirmado

- Código da aba incluído em `src/App.jsx` e componente em `src/target-reader/`. Build de produção local concluído com sucesso em 12/11; pacote local: 1.112 Q&A, hash `25fff504881ca4a3b07e7b3724ee1c4d8b25ccad8acfa8c74e29460d8aa51be1`. A guarda de login passou no build e no pre-commit; testes focados de pontuação: 6/6.
- Commit do código em GitHub `main`: `018476531cd881d479b5b3e4a4c0c6d0562a94ba`. Status contextual Vercel: `success / Deployment has completed`, deployment `44q8UZNhxJqwqq6ZSwaqBtMVFKew`.
- Commit documental: `218fc2acf0c530b40d47e633ccfb5ed830e17e0b`. Status contextual Vercel também `success / Deployment has completed`, deployment `59JcbTyYJx9cSQkzZuqmEDFtiVss`.
- Links de painel: [deployment do código](https://vercel.com/clynson-pngs-projects/renate/44q8UZNhxJqwqq6ZSwaqBtMVFKew) e [deployment documental](https://vercel.com/clynson-pngs-projects/renate/59JcbTyYJx9cSQkzZuqmEDFtiVss). Os status foram lidos da API GitHub para os commits.
- A URL `https://renate.vercel.app/` foi testada e entrega uma página Next.js relacionada a yoga, não esta aplicação. Não é a URL correta para avaliar este projeto.
- API pública do Vercel para consultar detalhes do deployment respondeu HTTP 403. A CLI Vercel 59.11.2 não tinha credenciais e `vercel ls` iniciou login interativo; a autenticação não foi concluída nesta verificação. Logo, o alias Production e a URL efetivamente usada pela atleta ainda são desconhecidos.
- O hook pre-commit está configurado no checkout; `git status` estava limpo após a publicação. O login hospedado permaneceu no código e a exceção local continua limitada a build DEV + loopback.

## Hipóteses ainda abertas

1. A URL aberta pela usuária pode ser um domínio/alias antigo ou de outro projeto.
2. O deployment verde pode ser Preview ou outro deployment, e não o alias Production esperado. O status GitHub sozinho não distingue isso.
3. Se a URL correta é usada em PWA instalado, o service worker pode estar servindo bundle anterior até receber e aplicar a atualização.
4. A configuração Root Directory/Production Branch do projeto pode apontar a outro checkout ou diretório; precisa ser conferida na configuração autenticada do Vercel.

Essas são hipóteses, não causa-raiz confirmada.

## Próximos passos

1. Consultar o projeto autenticado `clynson-pngs-projects/renate` via dashboard ou Vercel CLI autenticada; obter o domínio de Production, Production Branch, Root Directory e o deployment associado ao commit `0184765` ou `218fc2a`.
2. Abrir a URL Production confirmada e verificar versão/build servido, conteúdo do menu e navegação **Ler alvos** em desktop e mobile. Se o domínio servir commit antigo, disparar/repetir deployment Production pelo fluxo do projeto e confirmar status.
3. Se for um PWA instalado, abrir conectado, aplicar o botão de atualização quando o novo service worker estiver aguardando e reabrir a aplicação. Preservar IndexedDB e demais dados locais; não usar limpeza total dos dados como primeira ação.
4. No domínio final, confirmar que cadastro/PIN hospedados continuam ativos e que **Ler alvos** aparece após o fluxo autenticado. Não desativar o gate do hosted.
5. Registrar URL final, deployment ID, commit efetivo, horário e evidência visual/runtime. Atualizar a SPEC e encerrar o gate somente após a conferência real.

## Arquivos de referência

- `RENATE_BETA_OFFLINE_SPEC_V1.md` — seções 12.3–12.6: bypass local, guard de login, release e pendência atual.
- `src/App.jsx` — integração do menu e renderização da aba.
- `src/target-reader/TargetReaderView.jsx` — tela do módulo.
- `vercel.json` — guard de login antes do build Vercel.
- `public/renate-pack/manifest.json` — manifesto local empacotado.

## Limite da evidência atual

O PASS de build local e os status GitHub `success` comprovam artefato construído e deployments concluídos. Não comprovam que a usuária abriu o alias Production atualizado nem que o service worker no aparelho já ativou o novo bundle. Não foi realizada ainda a conferência visual na URL final correta.
