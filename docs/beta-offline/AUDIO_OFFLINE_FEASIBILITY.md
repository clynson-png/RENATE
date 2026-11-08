# RENATE — viabilidade de áudio offline PT-BR

**Data:** 2026-11-06  
**Estado:** Whisper Tiny aprovado pelo usuário como ASR e export licenciado/proveniente, hasheado e incluído em `public/`; inferência offline com modelo local passou. Kokoro JS não atende TTS PT-BR por ausência de voz correspondente. Fala humana, TTS PT-BR alternativo e aparelhos ainda pendentes.  
**Regra:** áudio é processado no dispositivo; nenhuma API ASR/TTS remota.

## Comparação

| Opção | PT-BR | Local/offline | Tamanho consultado | Licença/proveniência | Decisão |
|---|---|---|---:|---|---|
| Web Speech `SpeechRecognition` | Varia por navegador | Pode usar serviço remoto; modo offline não é controlado nem garantido | 0 bytes no pacote | Voz/modelo pertencem à plataforma | Rejeitada como ASR de produção offline estrita |
| Whisper Tiny multilingual ONNX (`onnx-community/whisper-tiny`, q8) via Transformers.js | Multilíngue; PT-BR ainda precisa de avaliação com fala humana | Inferência WASM passou em Chromium 158 com arquivos locais e acesso remoto ao modelo desativado | 40.844.231 bytes de encoder+decoder q8, mais cerca de 4 MB de tokenizer/configuração | Upstream OpenAI declara MIT; cartão HF do modelo base declara Apache-2.0; export ONNX não tem licença própria declarada. RENATE preserva ambos os textos e atribuições. | **Aprovado pelo usuário; pacote de distribuição incluído**, fixado e validado por SHA-256 em `WHISPER_TINY_PROVENANCE_2026-11-06.md` |
| Web Speech `speechSynthesis` | Depende das vozes instaladas | Voz e eventual conexão variam com SO/navegador | 0 bytes no pacote | Licença/política depende da voz da plataforma | Só fallback após prova offline no aparelho |
| Kokoro 82M ONNX (`onnx-community/Kokoro-82M-v1.0-ONNX`, q8f16) via `kokoro-js` | Lista `pt-BR`, vozes `pf_dora`, `pm_alex`, `pm_santa` | Projeto declara execução local no browser por WASM/WebGPU | Modelo 86.033.585 bytes + voz 522.240 bytes; cerca de 86,6 MB decimais antes do runtime/cache | Pesos/modelo Apache-2.0; preservar hash/revisão da voz incluída | Candidato TTS; avaliar pronúncia e tempo em dispositivo |

Tamanhos calculados a partir das árvores de arquivos do Hugging Face consultadas em 2026-11-06. Whisper q8: `onnx/encoder_model_quantized.onnx` (10.124.990) + `onnx/decoder_model_merged_quantized.onnx` (30.719.241). Kokoro q8f16: `onnx/model_q8f16.onnx` + `voices/pf_dora.bin`. O app terá que empacotar/cachear os modelos localmente; CDN não satisfaz a SPEC.

## Fontes e licenças

- Transformers.js oficial: ASR/TTS e execução no browser: https://huggingface.co/docs/transformers.js/.
- Whisper upstream MIT: https://github.com/openai/whisper/blob/main/README.md#license. O repositório ONNX fixado não declara campo de licença próprio; por isso RENATE preserva a atribuição do export, a revisão, a proveniência do modelo base e os dois textos de licença declarados nas fontes (MIT e Apache-2.0). O manifesto lista os arquivos distribuídos e seus hashes; ver `WHISPER_TINY_PROVENANCE_2026-11-06.md`.
- `kokoro-js` oficial declara inferência 100% local via Transformers.js: https://github.com/hexgrad/kokoro/blob/main/kokoro.js/README.md.
- Kokoro 82M Apache-2.0: https://huggingface.co/hexgrad/Kokoro-82M.
- Revisões consultadas: Whisper `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`; Kokoro ONNX `1939ad2a8e416c0acfeecc08a694d14ef25f2231`.

## Estado de teste — Chromium 158, 2026-11-06

`AUDIO_BROWSER_INFERENCE_2026-11-06.json` registra inferência em navegador real sob Service Worker. Whisper foi carregado de `/models/whisper-tiny` com `allowRemoteModels=false`; o WASM veio de `/onnxruntime/`. Não houve chamada externa durante o ensaio. Whisper Tiny q8 transcreveu a amostra PT-BR sintetizada pelo Microsoft SAPI local; os termos competição, nove/9 e árbitro foram reconhecidos. Na repetição de 2026-11-06, a carga ficou em 652 ms online/635 ms offline e a inferência em 2.538 ms online/1.973 ms offline, neste desktop/browser. Resultados com cache aquecido; não medem WER e a amostra não foi falada por uma pessoa. `npm run test:model-provenance` confere os 23 arquivos e hashes.

Kokoro 82M q8 gerou áudio com voz inglesa `af_heart` em modo offline (carga ~1,6 s; síntese ~21,9 s neste desktop). A tentativa de voz `pf_dora` falhou: a distribuição `kokoro-js` instalada só expõe as vozes listadas no relatório, sem português. Portanto, Kokoro JS não atende TTS PT-BR neste teste. Não houve escuta humana, avaliação de naturalidade ou teste Android/iPhone.

**Decisão humana do Dia 2:** Whisper Tiny aprovado como ASR; pesos locais, WASM, ambas as licenças publicadas, proveniência e hashes estão fechados para o pacote RENATE. A cadeia e a declaração divergente estão descritas em `WHISPER_TINY_PROVENANCE_2026-11-06.md`. Kokoro JS não foi aprovado como TTS PT-BR. Voz PT-BR, fala humana e aparelhos permanecem pendentes; não anunciar áudio completo como pronto. O fluxo Whisper no teste não usou serviço ASR remoto.


## Atualização 2026-11-08 — candidato Piper pt_BR Faber

Spike isolado em .cache/tts-piper-spike passou síntese offline no Chromium 158 com a voz pt_BR-faber-medium, sem chamadas externas. Isso confirma viabilidade técnica no desktop, mas ainda não desbloqueia TTS no produto: falta revisão auditiva humana, teste em aparelhos e reconciliação da licença do phonemizer/espeak-ng. A amostra e os tempos estão em TTS_PIPER_PTBR_SPIKE_2026-11-08.md; manter leitura textual como alternativa e TTS de produção bloqueado até esses gates fecharem.

