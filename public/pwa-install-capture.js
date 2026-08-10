/**
 * Runs before React.
 *
 * Always preventDefault() on beforeinstallprompt so we can call prompt() from
 * our Install button. On Android tablets with “Desktop site” on, Chrome removes
 * “Add to Home screen” from the ⋮ menu — the in-app button is the reliable path.
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

      // Android needs the SW to control this page before Install appears.
      if (!navigator.serviceWorker.controller) {
        var reloaded = false;
        try {
          reloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        } catch (e) {
          reloaded = false;
        }

        if (reloaded) return;

        navigator.serviceWorker.addEventListener("controllerchange", function onControl() {
          navigator.serviceWorker.removeEventListener("controllerchange", onControl);
          try {
            if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
            sessionStorage.setItem(RELOAD_KEY, "1");
          } catch (e) {
            // If storage is blocked, skip forced reload to avoid a loop.
            return;
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
