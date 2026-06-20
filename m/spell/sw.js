const cacheName = 'spell-fbf779c87342e280c8c02dba7ea679dc';
const appShellFiles = [
  './app.js',
  './index.html',
  './lexicon.txt',
  './spell-icon-1020.png',
  './spell.png',
  './src/GameRand.js',
  './src/LetterReplenisher.js',
  './src/MADocument.js',
  './src/MAStorage.js',
  './src/SpellGame.js',
  './src/SpellGameRules.js',
  './src/Utilities.js',
  './src/pwa.js',
  './styles.css',
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
