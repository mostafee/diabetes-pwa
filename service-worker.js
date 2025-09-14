// Cache assets for offline
const CACHE = 'diabetes-pwa-v2-1';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil((async ()=>{ const c=await caches.open(CACHE); await c.addAll(ASSETS); self.skipWaiting(); })()); });
self.addEventListener('activate', e => { e.waitUntil((async ()=>{ const keys=await caches.keys(); await Promise.all(keys.map(k=> k!==CACHE ? caches.delete(k) : null)); self.clients.claim(); })()); });
self.addEventListener('fetch', e => {
  const req=e.request;
  if(req.mode==='navigate'){ e.respondWith((async ()=>{ const c=await caches.open(CACHE); const cached=await c.match('./index.html'); if(cached) return cached; try{ return await fetch(req);}catch{ return new Response('<h1>Offline</h1>',{headers:{'Content-Type':'text/html'}});} })()); return; }
  if(req.method==='GET' && new URL(req.url).origin===location.origin){ e.respondWith((async ()=>{ const c=await caches.open(CACHE); const cached=await c.match(req); if(cached) return cached; try{ const fresh=await fetch(req); c.put(req,fresh.clone()); return fresh; }catch{ return new Response('',{status:503,statusText:'Offline'});} })()); }
});