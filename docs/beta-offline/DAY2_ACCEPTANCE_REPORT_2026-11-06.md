# Aceite do Dia 2 — RENATE

**Resultado:** `PASS_WITH_DOCUMENTED_AUDIO_LIMIT`  
**Ambiente:** Chromium 158.0.8127.18, execução local  
**Escopo:** motor de busca, ASR candidato, pacote offline, shell responsivo e rastreabilidade visual.

**Pré-condição registrada para Supabase:** antes de iniciar sua implementação, atualizar este aceite com a situação então vigente e confirmar que cada motor está aprovado pelos critérios da SPEC ou tem seu bloqueio técnico documentado, que o shell responsivo foi verificado e que tokens/fontes são rastreáveis. Não inferir equivalência para candidatos reprovados. Além disso, Supabase só começa após o PASS local final de 100% definido na SPEC.

## Critérios e resultados

| Critério | Resultado | Evidência |
|---|---|---|
| Motor local de busca selecionado | `PASS` — FlexSearch 0.8.212 executado em Web Worker; o Meilisearch JS não fornece engine de busca local no browser para este requisito. | `SEARCH_FRONTEND_FEASIBILITY.md`; `SEARCH_BROWSER_960_2026-11-06.json` |
| Cobertura de seleção em ATLAS | `PASS` — 960/960; 3 grupos conflitantes geram esclarecimento previsto; 0 falhas. | `npm run test:browser` |
| Whisper Tiny como ASR local | `PASS` técnico e aprovação humana — a transcrição da amostra PT-BR sintetizada foi confirmada tanto preparado online quanto offline, com `allowRemoteModels=false` e zero chamadas externas. | `AUDIO_BROWSER_INFERENCE_2026-11-06.json` |
| Licença/proveniência do Whisper no pacote | `PASS` documental — revisões fixadas, modelo base e export relacionados, atribuição preservada, ambos os textos MIT/Apache-2.0 incluídos e 23 arquivos verificados por tamanho/hash. O repositório do export não declara licença própria; as fontes upstream publicam declarações diferentes, descritas sem ocultar a divergência. | `WHISPER_TINY_PROVENANCE_2026-11-06.md`; `npm run test:model-provenance` |
| Shell responsivo | `PASS` — sem overflow horizontal em 320, 390, 768 e 1280 px; navegação móvel abre e fecha. | `BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json`; `npm run test:browser` |
| Tokens visuais rastreáveis | `PASS` — cores, fontes, pesos, origem e cópias locais documentados; sem CDN e sem logo CBTE. | `CBTE_ADANA_VISUAL_REFERENCE.md` |
| Uso offline e histórico local | `PASS` — autosave, restauração, busca após reload offline e zero requisições externas; IndexedDB passou 3/3 testes. | `BROWSER_RUNTIME_ACCEPTANCE_2026-11-06.json`; `npm run test:history` |
| Síntese PT-BR | `BLOCKED_TECHNICAL_FEASIBILITY` — Kokoro JS não contém voz PT-BR; não foi declarado equivalente. | `AUDIO_OFFLINE_FEASIBILITY.md`; relatório de inferência |

## Pacote e validações repetidas

- `npm run build`: `PASS`; Service Worker gerado com 36 itens e 69.988.565 bytes no precache (aprox. 66,7 MiB), incluindo pesos q8, runtime WASM e avisos/licenças.
- `npm run test:model-provenance`: `PASS`; 2 pacotes, 23 arquivos, 66.931.251 bytes, zero divergências de hash/tamanho.
- `npm run test:browser`: `PASS`; seleção 960/960, histórico restaurado, busca offline, responsividade nas quatro larguras e nenhuma chamada externa.
- `npm run test:audio-browser`: `PASS` para inferência local; Whisper reconheceu “competição”, “9” e “árbitro”. Kokoro reproduziu áudio inglês e confirmou ausência da voz `pf_dora`.
- `npm run test:history`: `PASS`; 3/3.
- `npm audit`: `PASS`; zero vulnerabilidades reportadas.

## Limites ainda abertos

O resultado não declara RENATE completo. A amostra de ASR foi sintetizada e não permite medir WER; ainda faltam fala humana PT-BR e validação em Android/iPhone. O motor ASR está empacotado e validado no browser, mas ainda precisa ser integrado à interface. TTS PT-BR segue bloqueado. PIN, integração completa de passagens/cards/figuras e demais etapas de produto permanecem no plano.

O navegador Playwright usado para executar os testes foi instalado no ambiente de desenvolvimento, fora de `RENATE/`; ele não é dependência de runtime nem entra no pacote transportável. Todos os pesos, runtime, dados e arquivos necessários ao app permanecem dentro de `RENATE/`.

## Fontes de licença registradas

- [Export ONNX Whisper Tiny na revisão fixada](https://huggingface.co/onnx-community/whisper-tiny/tree/ff4177021cc41f7db950912b73ea4fdf7d01d8e7)
- [Modelo base e metadado Apache-2.0 na revisão fixada](https://huggingface.co/openai/whisper-tiny/tree/169d4a4341b33bc18d8881c4b69c2e104e1cc0af)
- [README do Whisper upstream, seção de licença MIT](https://github.com/openai/whisper/blob/main/README.md#license)

O ONNX export não publica um campo de licença independente. Por isso o pacote preserva a proveniência completa, a atribuição e ambas as declarações/textos de licença aplicáveis ao modelo upstream. Veja `WHISPER_TINY_PROVENANCE_2026-11-06.md` para os hashes individuais.
