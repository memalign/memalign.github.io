const cacheName = 'memsky-947078ef5f4bdcbfed19f6e1099f9bd6';
const appShellFiles = [
  './index.html',
  './memsky-icon-1035.png',
  './memsky.png',
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
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    cache.put(e.request, response.clone());
    return response;
  })());
});
