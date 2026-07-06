// Minimale service worker: alleen genoeg voor PWA-installeerbaarheid.
// Geen offline caching — de app is bewust online-only (data leeft in D1).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
