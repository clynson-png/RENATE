import { env } from '@huggingface/transformers';
import { KokoroTTS, env as kokoroEnv } from 'kokoro-js';
import { transcribeLocalAudio } from '../src/localSpeech.js';
import sampleUrl from './fixtures/ptbr-sapi-smoke.wav?url';

const output = document.querySelector('#results');
const log = (state, payload = {}) => {
  const result = { state, ...payload };
  output.textContent = JSON.stringify(result, null, 2);
  document.documentElement.dataset.testState = state;
  return result;
};

try {
  env.useBrowserCache = true;
  env.useWasmCache = true;
  env.logLevel = 50;
  const localWasmPath = `${location.origin}/onnxruntime/`;
  env.backends.onnx.wasm.wasmPaths = localWasmPath;
  // kokoro-js bundles a separate Transformers.js runtime and exposes its environment.
  kokoroEnv.wasmPaths = localWasmPath;
  console.info('Local ONNX WASM paths:', env.backends.onnx.wasm.wasmPaths, kokoroEnv.wasmPaths);
  if (!navigator.serviceWorker.controller) {
    await navigator.serviceWorker.register('./audio-cache-sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    location.reload();
    throw new Error('reloading once to cache the local test page in a Service Worker');
  }

  const memoryBefore = performance.memory?.usedJSHeapSize ?? null;
  log('LOADING_KOKORO');
  const ttsStart = performance.now();
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'wasm' });
  const ttsLoadedMs = performance.now() - ttsStart;
  const ttsStartInference = performance.now();
  const generated = await tts.generate('The competition starts at nine o’clock. The athlete follows the referee’s commands.', { voice: 'af_heart' });
  const ttsInferenceMs = performance.now() - ttsStartInference;
  log('LOADING_WHISPER');
  let ptBrVoiceResult;
  try {
    const ptAudio = await tts.generate('Bom dia. A competição começa às nove horas.', { voice: 'pf_dora' });
    ptBrVoiceResult = { status: 'GENERATED', samples: ptAudio.audio.length, sampleRate: ptAudio.sampling_rate };
  } catch (error) {
    ptBrVoiceResult = { status: 'UNSUPPORTED_BY_KOKORO_JS', reason: error instanceof Error ? error.message : String(error) };
  }

  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath = `${location.origin}/models/`;
  const wavResponse = await fetch(sampleUrl);
  if (!wavResponse.ok) throw new Error(`Portuguese audio fixture HTTP ${wavResponse.status}`);
  const asrStartInference = performance.now();
  const transcribed = await transcribeLocalAudio(await wavResponse.blob());
  const asrTotalMs = performance.now() - asrStartInference;

  log(navigator.onLine ? 'ONLINE_PRELOAD_PASS' : 'OFFLINE_INFERENCE_PASS', {
    origin: location.origin,
    serviceWorkerControlled: Boolean(navigator.serviceWorker.controller),
    tts: { model: 'Kokoro 82M ONNX q8', loadMs: Number(ttsLoadedMs.toFixed(0)), inferenceMs: Number(ttsInferenceMs.toFixed(0)), samples: generated.audio.length, sampleRate: generated.sampling_rate, voice: 'af_heart (English)', ptBrVoice: ptBrVoiceResult },
    asr: { model: 'Whisper Tiny multilingual ONNX q8', modelSource: '/models/whisper-tiny (RENATE local package)', integration: 'src/localSpeech.js · transcribeLocalAudio', remoteModelAccessDisabled: env.allowRemoteModels === false, totalMs: Number(asrTotalMs.toFixed(0)), text: transcribed, expectedTermsFound: [{ term: 'competição', found: transcribed.toLocaleLowerCase('pt-BR').includes('competição') }, { term: 'nove / 9', found: /\bnove\b|\b9\b/i.test(transcribed) }, { term: 'árbitro', found: transcribed.toLocaleLowerCase('pt-BR').includes('árbitro') }] },
    heapDeltaBytes: memoryBefore === null ? null : Math.max(0, (performance.memory?.usedJSHeapSize ?? memoryBefore) - memoryBefore),
  });
} catch (error) {
  if (error instanceof Error && error.message.startsWith('reloading once')) log('RELOADING_FOR_SERVICE_WORKER');
  else log('FAIL', { error: error.stack || String(error) });
}
