const cacheName = 'wolfer-v1';
const appShellFiles = [
  './index.html',
  './style.css',
  './ZzFX.js',
  './Utilities.js',
  './Events.js',
  './Runloop.js',
  './PCEImage.js',
  './Images.js',
  './GameGenerator.js',
  './GameGenerator_Grammar.js',
  './GameGenerator_Number1stGrade.js',
  './GameGenerator_Number3rdGrade.js',
  './GameGenerator_Phonics.js',
  './GameGenerator_SpanishNouns.js',
  './GameGenerator_SpanishVerbs.js',
  './GameGenerator_Word.js',
  './GameGenerators.js',
  './GameState.js',
  './GameEngine.js',
  './GridViewProducer.js',
  './AnimationController.js',
  './TroggleController.js',
  './main.js',
  './pwa.js',
  './classic-munchers-1668.png',
  './classic-munchers.png',
  './wolfer-1110.png',
  './wolfer-1665.png',
  './wolfer.png',
  './wolfer.html',
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
