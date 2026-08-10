/* Minimal PWA service worker for Chrome Android installability (WebAPK). */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

// Android Chrome requires a fetch handler; respondWith keeps the worker "controlling".
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
