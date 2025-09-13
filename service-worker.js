// Simple cache-first service worker with navigation fallback
const CACHE = 'diabetes-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // For navigation requests, serve index.html from cache (SPA-style)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch {
        return new Response('<h1>Offline</h1><p>Please reconnect.</p>', { headers: {'Content-Type':'text/html'}});
      }
    })());
    return;
  }

  // Cache-first for same-origin GET
  if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return new Response('', { status: 503, statusText: 'Offline'});
      }
    })());
  }
});
