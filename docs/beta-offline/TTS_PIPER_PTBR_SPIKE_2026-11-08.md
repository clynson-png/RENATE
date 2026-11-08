# RENATE — teste isolado de candidato TTS PT-BR: Piper Faber medium

**Data:** 2026-11-08  
**Escopo:** spike dentro de `RENATE/.cache`; nenhum código ou pacote de produção alterado.

## Resultado

- **Síntese local no Chromium 158:** PASS técnico. O modelo `pt_BR-faber-medium` gerou áudio de português brasileiro no navegador.
- **Reabertura sem rede:** PASS técnico. Depois de preparar os recursos no mesmo origin, a síntese foi repetida com o navegador offline e Service Worker ativo; nenhuma requisição externa foi observada.
- **Desbloqueio para uso no produto:** ainda pendente. Este ensaio não recebeu avaliação auditiva humana, não foi executado em Android/iPhone e não fecha a compatibilidade de licença do conjunto de runtime/phonemizer. A leitura textual e o bloqueio de produto devem permanecer até esses itens serem resolvidos.

## Execução reproduzida

- Browser: Chromium `158.0.8127.18`; origin isolado: `http://127.0.0.1:5175`.
- Runtime: `piper-tts-web@1.1.2`, `onnxruntime-web@1.20.1`, Piper phonemizer WASM/data distribuídos com `piper-tts-web`.
- Modelo: `pt_BR-faber-medium`, qualidade `medium`, amostragem 22.050 Hz; licença registrada no MODEL_CARD como CC0.
- Entrada: “A competição começa às nove horas. O atleta permanece na linha de tiro até o comando do árbitro. Em caso de falha, informe o árbitro e aguarde instruções.”
- Geração inicial: 16.169 ms para áudio de 8.835 ms (389.676 bytes).
- Repetição offline aquecida: 6.103 ms para áudio de 8.811 ms (388.652 bytes).
- A página foi servida com COOP/COEP para habilitar o runtime WASM multithreaded. O teste offline reabriu a página controlada por Service Worker e repetiu toda a síntese.
- Requisições para hosts externos durante as fases medidas: zero.
- Modelo ONNX: 63.201.294 bytes; SHA-256 `858555E3A064209C57088FE6BD70C4C3DC54D03EAA00C45D5ECAF43A33F95AA7`.
- A amostra WAV está em [`tts-samples/piper-ptbr-faber-medium-2026-11-08.wav`](tts-samples/piper-ptbr-faber-medium-2026-11-08.wav), SHA-256 `3E9DC1D76CBB991B3A4D106AE171189FE944DF735F9C2867B690354ABE23AC7F`.
- Harness, modelo e cópia de runtime usados no spike permanecem em `RENATE/.cache/tts-piper-spike`; não fazem parte do pacote de produção.

## Itens para completar o desbloqueio

1. Revisão auditiva humana da amostra em português brasileiro: naturalidade, pronúncia de termos de tiro, números, siglas e nomes próprios.
2. Teste em aparelho-alvo (Android e iPhone conforme plano), incluindo instalação/armazenamento e nova síntese em modo avião. Este teste desktop não prova desempenho ou quota em celular.
3. Fechamento de proveniência/licença do conjunto executável. O MODEL_CARD Faber declara CC0 para a voz; `piper-tts-web` e `onnxruntime-web` publicam licença MIT. Entretanto, a biblioteca incorpora o phonemizer/espeak-ng em WASM/data; a cadeia upstream do eSpeak NG é GPL-3.0-or-later, e a distribuição atual do Piper também documenta GPL-3.0. A licença efetivamente aplicável aos artefatos incorporados precisa ser reconciliada antes de redistribuí-los no PWA.
4. Se os itens acima forem aprovados, integrar o runtime/modelo em uma mudança isolada, rever o precache e medir tamanho total, memória, inicialização e latência no aparelho.

## Fontes primárias consultadas

- [Piper TTS Web (README e instruções para WASM local)](https://github.com/Poket-Jony/piper-tts-web)
- [Catálogo oficial de vozes Piper; entrada pt_BR Faber](https://huggingface.co/rhasspy/piper-voices/blob/main/voices.json)
- [MODEL_CARD da voz Faber](https://huggingface.co/rhasspy/piper-voices/blob/main/pt/pt_BR/faber/medium/MODEL_CARD)
- [Repositório oficial Piper atual (GPL-3.0)](https://github.com/OHF-Voice/piper1-gpl)
- [eSpeak NG: licença GPL-3.0-or-later](https://github.com/espeak-ng/espeak-ng)
