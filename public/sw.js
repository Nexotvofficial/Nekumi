/* Nekutton service worker compatibility file.
 * Intentionally does not intercept requests or delete browser caches.
 * This keeps any legacy registration from destroying unrelated site caches.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
