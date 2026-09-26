// Service Worker - Kill Switch
// This SW immediately unregisters itself and clears all caches
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear ALL caches
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      ),
      // Unregister this service worker
      self.registration.unregister(),
    ]).then(() => {
      // Force all clients to reload clean
      return self.clients.matchAll({ includeUncontrolled: true });
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  );
});