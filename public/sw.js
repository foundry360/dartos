/* Minimal PWA service worker for Chrome Android installability (WebAPK).
 * A fetch listener is required; keep this file tiny so install never stalls.
 */
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

// No-op fetch handler is enough for Chrome's installability check.
self.addEventListener("fetch", () => {});
