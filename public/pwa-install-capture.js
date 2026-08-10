/**
 * Registers the minimal service worker used for PWA installability.
 * No custom install UI — Chrome/Edge handle install when the browser supports it.
 */
(function () {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(function (registration) {
      if (registration.update) {
        registration.update().catch(function () {});
      }
    })
    .catch(function () {});
})();
