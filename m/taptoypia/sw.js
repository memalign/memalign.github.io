const cacheName = 'taptoypia-defb5053c355ebeef8de205f81982a26';
const appShellFiles = [
  './game.css',
  './index.html',
  './song.mp3',
  './src/AppOrchestrator.js',
  './src/Camera.js',
  './src/Cell.js',
  './src/GameCharacter.js',
  './src/GameEngine.js',
  './src/GameState.js',
  './src/GlobeRenderer.js',
  './src/Grid.js',
  './src/Images.js',
  './src/Inventory.js',
  './src/MADocument.js',
  './src/MAStorage.js',
  './src/MapProjection.js',
  './src/PCEImage.js',
  './src/Reproduction.js',
  './src/SoundEffects.js',
  './src/ThreeMapRenderer.js',
  './src/Tuning.js',
  './src/UIManager.js',
  './src/Utilities.js',
  './src/main.js',
  './src/pwa.js',
  './taptoypia-icon-1024.png',
  './taptoypia.png',
  './vendor/three/three.core.min.js',
  './vendor/three/three.module.min.js',
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
