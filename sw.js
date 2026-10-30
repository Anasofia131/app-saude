// Funciona também com o Modo de Bloqueio do iPhone (onde a cache não existe)
const CACHE = 'saude-v3';
const FILES = ['./', './index.html', './scanner.js', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
const hasCache = typeof caches !== 'undefined';

self.addEventListener('install', e => {
  self.skipWaiting();
  if (hasCache) e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    if (hasCache) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      } catch {}
    }
    await self.clients.claim();
  })());
});

// Rede primeiro; cache só se estiver sem internet e se a cache existir
self.addEventListener('fetch', e => {
  if (!hasCache) return;
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      try { const c = await caches.open(CACHE); c.put(e.request, r.clone()); } catch {}
      return r;
    } catch (err) {
      try { const m = await caches.match(e.request); if (m) return m; } catch {}
      throw err;
    }
  })());
});
