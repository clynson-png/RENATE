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
const signature = createHash('sha256')
  .update(assets.map((asset) => `${asset}:${createHash('sha256').update(fs.readFileSync(path.join(outputDir, asset))).digest('hex')}`).join('\n'))
  .digest('hex').slice(0, 16);

const serviceWorker = `/* RENATE local static PWA cache; generated from this package. */
const CACHE_PREFIX = 'renate-static-';
const CACHE_NAME = CACHE_PREFIX + '${signature}';
const PRECACHE = ${JSON.stringify(assets.map((asset) => `./${asset}`))};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
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
console.log(JSON.stringify({ service_worker: 'dist/sw.js', cache_version: signature, precache_entries: assets.length, precache_bytes: assets.reduce((sum, asset) => sum + fs.statSync(path.join(outputDir, asset)).size, 0) }, null, 2));
