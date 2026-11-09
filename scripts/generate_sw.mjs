import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const outputDir = path.join(root, 'dist');
const extensions = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.png', '.jpg', '.webp', '.pdf', '.json', '.jsonl', '.webmanifest', '.woff2', '.onnx', '.bin', '.wasm', '.txt', '.md']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const assets = walk(outputDir)
  .filter((file) => path.basename(file) !== 'sw.js' && !file.endsWith('.map') && extensions.has(path.extname(file)))
  .map((file) => path.relative(outputDir, file).replaceAll(path.sep, '/'))
  .sort();
const precacheEntries = assets.map((asset) => ({
  url: `./${asset}`,
  sha256: createHash('sha256').update(fs.readFileSync(path.join(outputDir, asset))).digest('hex'),
  bytes: fs.statSync(path.join(outputDir, asset)).size,
}));
const signature = createHash('sha256')
  .update(precacheEntries.map(({ url, sha256 }) => `${url}:${sha256}`).join('\n'))
  .digest('hex').slice(0, 16);

const serviceWorker = `/* RENATE local static PWA cache; generated from this package. */
const CACHE_PREFIX = 'renate-static-';
const CACHE_NAME = CACHE_PREFIX + '${signature}';
const PRECACHE = ${JSON.stringify(precacheEntries)};
const COMPLETE_KEY = './__renate_precache_complete__';

async function notifyClients(type, detail = {}) {
  const windows = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of windows) client.postMessage({ source: 'renate-service-worker', type, ...detail });
}

async function digestMatches(response, expected) {
  if (!response?.ok) return false;
  const bytes = await response.clone().arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const actual = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  return actual === expected;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    let completed = 0;
    await notifyClients('PRECACHE_STARTED', { total: PRECACHE.length, bytes: PRECACHE.reduce((sum, entry) => sum + entry.bytes, 0) });
    try {
      for (const entry of PRECACHE) {
        const cached = await cache.match(entry.url);
        if (!await digestMatches(cached, entry.sha256)) {
          if (cached) await cache.delete(entry.url);
          const response = await fetch(new Request(entry.url, { cache: 'reload' }));
          if (!await digestMatches(response, entry.sha256)) throw new Error('Arquivo ausente, incompleto ou com hash divergente: ' + entry.url);
          await cache.put(entry.url, response);
        }
        completed += 1;
        await notifyClients('PRECACHE_PROGRESS', { completed, total: PRECACHE.length, current: entry.url });
      }
      await cache.put(COMPLETE_KEY, new Response(JSON.stringify({ cache: CACHE_NAME, assets: PRECACHE.length, verified: true }), { headers: { 'Content-Type': 'application/json' } }));
      await notifyClients('PRECACHE_READY', { completed, total: PRECACHE.length });
    } catch (error) {
      await notifyClients('PRECACHE_FAILED', { completed, total: PRECACHE.length, message: String(error?.message || error) });
      throw error;
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CHECK_PRECACHE') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(COMPLETE_KEY);
      let complete = false;
      try {
        const marker = await response?.json();
        complete = marker?.cache === CACHE_NAME && marker?.assets === PRECACHE.length && marker?.verified === true;
      } catch {}
      event.source?.postMessage({ source: 'renate-service-worker', type: complete ? 'PRECACHE_READY' : 'PRECACHE_FAILED', completed: complete ? PRECACHE.length : 0, total: PRECACHE.length, message: complete ? '' : 'O pacote offline ainda não foi verificado por completo.' });
    })());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && new URL(request.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const shell = await caches.match(new URL('./index.html', self.registration.scope).href);
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
`;

fs.writeFileSync(path.join(outputDir, 'sw.js'), serviceWorker);
console.log(JSON.stringify({ service_worker: 'dist/sw.js', cache_version: signature, precache_entries: precacheEntries.length, precache_bytes: precacheEntries.reduce((sum, asset) => sum + asset.bytes, 0) }, null, 2));
