const cacheName = 'catch-a4b70c920e60df7bc10c25498de2e634';
const appShellFiles = [
  './SoundEffects.js',
  './catch-icon-1023.png',
  './catch.png',
  './game.js',
  './happysquirrel.mp3',
  './img/backgrounds.png',
  './img/tile_0109.png',
  './img/tile_0111.png',
  './img/tile_0113.png',
  './img/tile_0116.png',
  './img/tile_0117.png',
  './img/tile_0118.png',
  './img/tile_0183.png',
  './img/tile_0212.png',
  './img/tile_0234.png',
  './img/tile_0294.png',
  './img/tile_0295.png',
  './img/tile_0296.png',
  './img/tile_0376.png',
  './img/tile_0377.png',
  './img/tile_0378.png',
  './img/tile_0379.png',
  './img/tile_0446.png',
  './img/tile_0675_purple.png',
  './index.html',
  './madsquirrel.mp3',
  './nutcatch2.mp3',
  './nutmiss.mp3',
  './pwa.js',
  './rocksound.mp3',
  './song.mp3',
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
