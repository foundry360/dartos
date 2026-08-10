/**
 * Runs before React.
 *
 * Important: on Android, do NOT preventDefault() on beforeinstallprompt.
 * Calling preventDefault hides Chrome’s own Install UI. If React fails to
 * surface our custom button, the user sees no install option at all.
 */
(function () {
  if (typeof window === "undefined") return;

  var isAndroid = /Android/i.test(navigator.userAgent || "");

  window.__vectorPwa = window.__vectorPwa || {
    deferredPrompt: null,
    firedAt: null,
  };

  window.addEventListener("beforeinstallprompt", function (event) {
    // Desktop: stash for custom UI. Android: let Chrome show native Install.
    if (!isAndroid) {
      event.preventDefault();
    }
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
