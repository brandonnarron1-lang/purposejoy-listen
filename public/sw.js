// PurposeJoy Listen — minimal service worker for offline shell + background audio support
const CACHE_VERSION = 'pj-v3';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const SHELL_ASSETS = [
  '/',
  '/listen',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => { /* shell prefetch is best-effort */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache audio streams — they need range requests and live network
  if (url.pathname.startsWith('/api/stream/')) {
    return;
  }

  // Network-first for API, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(SHELL_CACHE)
            .then((c) => c.put(event.request, clone))
            .catch(() => {});
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static shell
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
