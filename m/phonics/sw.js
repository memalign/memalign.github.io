const cacheName = 'phonics-1cfc8c5170b28e336a71b05750c73155';
const appShellFiles = [
  './card-style.css',
  './cards-1000.png',
  './cards-4000.png',
  './cards-icon-4000.png',
  './data.js',
  './index.html',
  './pwa.js',
  './script.js',
  './style.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(appShellFiles);
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== cacheName) {
        await caches.delete(key);
      }
    }
  })());
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    if (r) { return r; }
    return fetch(e.request);
  })());
});
