# Whisper Tiny — licença, proveniência e pacote local

**Estado:** `ASR_ASSET_REDISTRIBUTION=PASS`; a revisão de hashes passou. Os avisos de licença aplicáveis foram incluídos no pacote. A saída de voz em português continua bloqueada por outro candidato (Kokoro JS sem voz PT-BR).

## Proveniência fixa

| Camada | Identificação | Evidência |
|---|---|---|
| Pesos base | `openai/whisper-tiny`, revisão `169d4a4341b33bc18d8881c4b69c2e104e1cc0af` | [Cartão HF fixado](https://huggingface.co/openai/whisper-tiny/tree/169d4a4341b33bc18d8881c4b69c2e104e1cc0af); declara `apache-2.0`, inclui 99 idiomas e descreve o modelo Tiny multilíngue. |
| Export browser ONNX | `onnx-community/whisper-tiny`, revisão `ff4177021cc41f7db950912b73ea4fdf7d01d8e7` | [Árvore de arquivos fixada](https://huggingface.co/onnx-community/whisper-tiny/tree/ff4177021cc41f7db950912b73ea4fdf7d01d8e7); metadado `base_model` aponta para `openai/whisper-tiny`, autores de export listados: Xenova e whitphx. O repositório export não publica campo/license tag separado. |
| Licença declarada pelo autor | OpenAI Whisper | O [README upstream](https://github.com/openai/whisper/blob/main/README.md#license) diz que o código e os pesos estão sob MIT; a licença MIT está copiada no pacote. |
| Metadado da fonte de pesos | Hugging Face `openai/whisper-tiny` | A página/metadata do checkpoint declara Apache-2.0. O texto integral Apache-2.0 está copiado no pacote. |

As declarações MIT (README upstream) e Apache-2.0 (metadado do cartão HF) diferem. Ambas autorizam redistribuição permissiva sob suas condições. O pacote preserva os dois avisos e textos de licença, a origem, os autores do export e as revisões; não atribui uma licença própria ao repositório ONNX, que não declarou uma. Os arquivos ONNX são os arquivos quantizados publicados na revisão fixada, sem transformação local. Essa é a base de redistribuição documentada para o artefato empacotado.

## Artefatos e integridade

O conjunto está em `public/models/whisper-tiny/`:

- `onnx/encoder_model_quantized.onnx`: 10.124.990 bytes; SHA-256 `2af4a414ca47aa30f61246017e5fe82b0a8d229281d1255ba666a2a7f6b84d19`.
- `onnx/decoder_model_merged_quantized.onnx`: 30.719.241 bytes; SHA-256 `25e807a962b6349356d0ea5d0dfe530b7e5bf0e2a484aeca0359d03143faddd3`.
- Configurações e tokenizer correspondentes, ambos os textos de licença, cartões/model cards, aviso de atribuição e hashes completos: `public/models/whisper-tiny/PROVENANCE.json` e `NOTICE.md`.
- WASM de execução ONNX está em `public/onnxruntime/`, copiado de `onnxruntime-web@1.22.0-dev.20250409-89f8206ba4`, com licenças e SHA-256 em `PROVENANCE.json`.

O teste carregou Whisper do caminho local `/models/whisper-tiny`, configurou `allowRemoteModels=false`, executou inferência offline em Chromium 158 e não registrou chamada externa. `npm run test:model-provenance` verificou **23 arquivos**, **66.931.251 bytes**, sem divergências de tamanho ou SHA-256. A inferência transcreveu a gravação PT-BR sintetizada; isto ainda não é avaliação de fala humana/WER nem teste de aparelho.

O PWA compila com 36 itens de precache, 69.988.565 bytes (aprox. 66,7 MiB), incluindo modelo, runtime WASM e textos de licença. A aceitação do shell/browser foi repetida após a inclusão: busca 960/960, histórico restaurado, busca offline e zero requisições externas.

## Resultado do aceite do Dia 2

`DIA2_ACCEPTANCE=PASS_WITH_DOCUMENTED_AUDIO_LIMIT`: FlexSearch está aprovado pelo usuário e passou 960/960 seleções; Whisper Tiny está aprovado pelo usuário, empacotado com origem/licenças/hashes e passou inferência offline; Kokoro JS foi testado e não fornece voz PT-BR, então não foi declarado equivalente nem aprovado como TTS. O shell responsivo e os tokens CBTE continuam rastreáveis em `CBTE_ADANA_VISUAL_REFERENCE.md`. O teste de saída de voz PT-BR e a avaliação em aparelhos ficam para a etapa correspondente.
