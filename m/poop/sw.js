const cacheName = 'poop-c96c4bbf7de742654a672523114b88c3';
const appShellFiles = [
  './index.html',
  './poop.png',
  './pwa.js',
];

async function updateCache(request, response) {
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
}

function shouldUseNetworkFirst(request) {
  const url = new URL(request.url);
  return request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
}

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
  if (e.request.method !== 'GET') {
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (!cached) {
      return fetch(e.request);
    }

    if (!shouldUseNetworkFirst(e.request)) {
      return cached;
    }

    try {
      const response = await fetch(e.request);
      await updateCache(e.request, response);
      return response;
    } catch (error) {
      return cached;
    }
  })());
});
