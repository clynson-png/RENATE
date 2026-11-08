export function createAtlasSearchClient() {
  const worker = new Worker(new URL('./atlasSearch.worker.js', import.meta.url), { type: 'module' });
  let nextId = 1;
  const pending = new Map();
  worker.onmessage = ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.type === 'error') request.reject(new Error(data.error));
    else request.resolve(data);
  };
  function request(type, payload = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  }
  return {
    initialize: () => request('init'),
    search: (payload) => request('search', payload),
    evaluate: (cases) => request('evaluate', { cases }),
    evaluatePresentation: (cases) => request('evaluatePresentation', { cases }),
    close: () => worker.terminate(),
  };
}
