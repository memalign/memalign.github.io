const cacheName = 'taptoypia-9b26a08baf37bb2ee4b300d94811bd69';
const appShellFiles = [
  './game.css',
  './index.html',
  './song.mp3',
  './sounds/book_close.mp3',
  './sounds/gem_collect.mp3',
  './sounds/pencil_eraser.mp3',
  './sounds/pottery_clang.mp3',
  './sounds/steel_drums_chime_quick.mp3',
  './sounds/vibraphone_defeated.mp3',
  './sounds/vibraphone_level_complete.mp3',
  './sounds/xylophone_inn.mp3',
  './sounds/xylophone_mystery.mp3',
  './src/AppOrchestrator.js',
  './src/Camera.js',
  './src/Cell.js',
  './src/DebugCheats.js',
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
  './src/SettlerArrivalSequence.js',
  './src/SoundEffects.js',
  './src/SpriteLibrary.js',
  './src/StartupLandingSequence.js',
  './src/ThreeMapRenderer.js',
  './src/Tuning.js',
  './src/UIManager.js',
  './src/Utilities.js',
  './src/ZzFX.js',
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
