let recognizerPromise;

async function getRecognizer() {
  if (!recognizerPromise) recognizerPromise = (async () => {
    const { env, pipeline } = await import('@huggingface/transformers');
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = `${location.origin}/models/`;
    env.useBrowserCache = true;
    env.useWasmCache = true;
    env.backends.onnx.wasm.wasmPaths = `${location.origin}/onnxruntime/`;
    return pipeline('automatic-speech-recognition', 'whisper-tiny', { dtype: 'q8', device: 'wasm', local_files_only: true });
  })().catch((error) => { recognizerPromise = null; throw error; });
  return recognizerPromise;
}

function resampleTo16k(channel, sampleRate) {
  const targetLength = Math.floor(channel.length * 16_000 / sampleRate);
  const pcm = new Float32Array(targetLength);
  const ratio = sampleRate / 16_000;
  for (let index = 0; index < targetLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, channel.length - 1);
    const fraction = position - left;
    pcm[index] = channel[left] * (1 - fraction) + channel[right] * fraction;
  }
  return pcm;
}

function mixAudioChannels(audio) {
  const mono = new Float32Array(audio.length);
  for (let channel = 0; channel < audio.numberOfChannels; channel += 1) {
    const samples = audio.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) mono[index] += samples[index] / audio.numberOfChannels;
  }
  return mono;
}

export async function transcribeLocalAudio(blob) {
  if (!(blob instanceof Blob) || blob.size === 0) throw new Error('Áudio vazio.');
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > 90) throw new Error('Gravação acima de 90 segundos.');
    const mono = mixAudioChannels(decoded);
    const pcm = resampleTo16k(mono, decoded.sampleRate);
    const asr = await getRecognizer();
    const result = await asr(pcm, { sampling_rate: 16_000, language: 'portuguese', task: 'transcribe' });
    return String(result.text ?? '').trim();
  } finally { await context.close(); }
}
