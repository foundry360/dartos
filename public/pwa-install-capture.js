/**
 * Runs before React. Registers the service worker immediately and captures
 * beforeinstallprompt (Chrome fires it only once per page load).
 *
 * Android Chrome will not offer Install until a service worker *controls* the
 * page. After the first activation we reload once so the controller is attached.
 */
(function () {
  if (typeof window === "undefined") return;

  window.__vectorPwa = window.__vectorPwa || {
    deferredPrompt: null,
    firedAt: null,
  };

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__vectorPwa.deferredPrompt = event;
    window.__vectorPwa.firedAt = Date.now();
    window.dispatchEvent(new Event("vectorpwa:beforeinstallprompt"));
  });

  window.addEventListener("appinstalled", function () {
    window.__vectorPwa.deferredPrompt = null;
    window.__vectorPwa.firedAt = null;
    window.dispatchEvent(new Event("vectorpwa:appinstalled"));
  });

  if (!("serviceWorker" in navigator)) return;

  var RELOAD_KEY = "vectoros.sw.controller-reload";

  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(function (registration) {
      if (registration.update) {
        registration.update().catch(function () {});
      }

      // First visit: SW activates but does not control this tab until reload.
      if (!navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener("controllerchange", function () {
          try {
            if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
            sessionStorage.setItem(RELOAD_KEY, "1");
          } catch (e) {
            // sessionStorage blocked — still attempt one reload
          }
          window.location.reload();
        });
      } else {
        try {
          sessionStorage.removeItem(RELOAD_KEY);
        } catch (e) {}
      }
    })
    .catch(function () {});
})();
