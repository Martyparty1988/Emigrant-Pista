const CACHE_NAME = 'pista-v5-' + Date.now();
const ASSETS = [
  '/', '/index.html', '/app.js', '/three.min.js', '/manifest.json',
  '/icons/icon-180x180.png', '/icons/icon-192x192.png',
  '/icons/icon-256x256.png', '/icons/icon-384x384.png', '/icons/icon-512x512.png'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
