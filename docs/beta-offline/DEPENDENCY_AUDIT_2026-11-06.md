# Auditoria de dependências — 2026-11-06

## Resultado atual

Executado dentro de RENATE:

```text
npm audit
0 info, 0 low, 0 moderate, 0 high, 0 critical
154 dependências totais (6 production, 149 development, 81 opcionais; contagens de categorias não são mutuamente exclusivas)
```

`npm ls vite-plugin-pwa workbox-build workbox-core sharp` confirma que `vite-plugin-pwa`, Workbox Build e Workbox Core não estão na árvore. O único resultado é `sharp@0.35.5 overridden` sob `@huggingface/transformers@3.8.1`. `npm audit` cobre as dependências de produção e desenvolvimento registradas no lockfile.

## Reconciliação do registro anterior de seis vulnerabilidades

O README anterior registrava seis vulnerabilidades transitivas em dependências de build/PWA, mas não preservou os IDs dos avisos nem a árvore detalhada por pacote. Não é possível atribuir retroativamente cada um dos seis avisos a um ID individual sem esse snapshot. As correções verificáveis são:

| Área | Correção em RENATE | Evidência atual |
|---|---|---|
| Plugin PWA e transitivas Workbox | Removido `vite-plugin-pwa`; `scripts/generate_sw.mjs` gera Service Worker local a partir dos arquivos de `dist/`. | `npm ls vite-plugin-pwa workbox-build workbox-core` não retorna essas dependências; build/service worker e teste offline do browser verificam o fluxo local. |
| Vite | Mantido somente em `devDependencies`, com Vite 7.3.7. | `package.json` e `package-lock.json`. |
| Sharp transitivo | `overrides.sharp = 0.35.5`, versão verificada sem advisory ativo pela auditoria atual. | `npm ls sharp`; `npm audit` total zero. |

Assim, o total anterior está reconciliado como resolvido na árvore atual. A ausência dos IDs antigos fica registrada como limite de proveniência da auditoria anterior; não se inventou correspondência por advisory.

## Comandos reproduzíveis

```powershell
cd RENATE
npm ci
npm audit
npm ls vite-plugin-pwa workbox-build workbox-core sharp
```

Nenhuma dependência foi alterada fora de `RENATE/`.
