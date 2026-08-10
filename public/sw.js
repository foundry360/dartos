/* Minimal PWA service worker for Chrome Android installability (WebAPK). */
const PRECACHE = "vectoros-precache-v3";
const PRECACHE_URLS = [
  "/login",
  "/login?pwa=vectoros-v3",
  "/install",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (e) {
            // Ignore individual precache failures — do not block install.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Android Chrome requires a fetch handler; prefer precache for navigations.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(request);
        return network;
      } catch (error) {
        const cached = await caches.match(request, { ignoreSearch: false });
        if (cached) {
          return cached;
        }
        const fallback = await caches.match("/login");
        if (fallback) {
          return fallback;
        }
        throw error;
      }
    })(),
  );
});
