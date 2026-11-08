# RENATE — histórico conversacional local

**Data:** 2026-11-06  
**Estado:** mensagens do chat persistidas automaticamente; browser real Chromium 158 passou salvamento, restauração após recarga e busca offline; teste em aparelho pendente.

## Requisito de produto

- Quando houver ambiguidade, usar literalmente a pergunta de esclarecimento já cadastrada no ATLAS, caso exista. A resposta do usuário reexecuta a busca local com a pergunta original e o esclarecimento.
- A pergunta original deve ser persistida antes do esclarecimento; pergunta, esclarecimento, resposta, passagens e cards pertencem à mesma conversa local.
- Histórico fica no IndexedDB do PWA. Não enviar, sincronizar ou recuperar conversas pela internet.
- Permitir apagar uma conversa e apagar todo o histórico, com confirmação para exclusão total.

## Implementação e verificação

- `src/localHistory.js`: IndexedDB schema v1, leitura, gravação, leitura individual, exclusão individual e limpeza total.
- `src/App.jsx`: lista conversas, restaura a conversa selecionada, oferece exclusão individual e botão **Limpar histórico** com confirmação.
- `tests/history-store.test.mjs`: `fake-indexeddb` executa em Node o fluxo de salvar/ler a pergunta original e esclarecimento, excluir uma conversa, preservar outra e limpar tudo.
- Resultado executado em 2026-11-06: **3 testes passaram, 0 falhas** (`npm run test:history`).
- `tests/history-store.html`: roteiro complementar de validação do IndexedDB real.
- `src/App.jsx`: o composer fica habilitado após carregar o índice ATLAS; a pergunta é gravada antes de consultar, e respostas/esclarecimentos também são persistidos. Exclusão individual e total continuam disponíveis.
- Resultado real em `BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json`: pergunta e resposta gravadas, conversa restaurada após recarga, busca em modo offline e zero requisições externas.

## Limites confirmados

O IndexedDB simulado comprova as operações e a preservação dos campos pelo módulo, mas não comprova quota, persistência concedida, fechamento/abertura real, política de eviction ou comportamento após reinstalação. Esses pontos exigem teste em navegador e aparelhos. O PWA solicita `navigator.storage.persist()` quando disponível, sem prometer que o navegador concederá a solicitação.

## Rede e privacidade

O módulo `src/localHistory.js` não faz chamadas de rede. Nenhuma sincronização, telemetria, Supabase, Vercel ou endpoint de conversa está implementado. O tráfego externo observado no teste real foi zero; repetir em aparelhos quando esses forem disponibilizados.
