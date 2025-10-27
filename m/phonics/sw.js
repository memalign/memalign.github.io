const cacheName = 'phonics-v1';
const appShellFiles = [
  './index.html',
  './card-style.css',
  './style.css',
  './data.js',
  './script.js',
  './pwa.js',
  './cards-1000.png',
  './cards-4000.png',
  './cards-icon-4000.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(appShellFiles);
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
