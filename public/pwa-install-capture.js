/**
 * Runs before React.
 *
 * Always preventDefault() on beforeinstallprompt so we can call prompt() from
 * our Install button. Android also requires a controlling service worker before
 * Chrome will fire that event — so we register + force controller reloads.
 */
(function () {
  if (typeof window === "undefined") return;

  window.__vectorPwa = window.__vectorPwa || {
    deferredPrompt: null,
    firedAt: null,
    swError: null,
    swState: null,
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

  if (!("serviceWorker" in navigator)) {
    window.__vectorPwa.swError = "serviceWorker unsupported";
    return;
  }

  var RELOAD_KEY = "vectoros.sw.controller-reload";

  function setSwState(registration) {
    window.__vectorPwa.swState = {
      controller: navigator.serviceWorker.controller
        ? navigator.serviceWorker.controller.scriptURL
        : null,
      active: registration && registration.active ? registration.active.state : null,
      waiting: registration && registration.waiting ? registration.waiting.state : null,
      installing: registration && registration.installing ? registration.installing.state : null,
    };
    window.dispatchEvent(new Event("vectorpwa:swstate"));
  }

  function readReloadCount() {
    try {
      return parseInt(sessionStorage.getItem(RELOAD_KEY) || "0", 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function bumpAndReload() {
    var reloads = readReloadCount();
    if (reloads >= 2) {
      window.__vectorPwa.swError = "registered but not controlling after reload";
      return false;
    }
    try {
      sessionStorage.setItem(RELOAD_KEY, String(reloads + 1));
    } catch (e) {
      return false;
    }
    window.location.reload();
    return true;
  }

  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(function (registration) {
      setSwState(registration);
      if (registration.update) {
        registration.update().catch(function () {});
      }

      ["installing", "waiting", "active"].forEach(function (key) {
        var worker = registration[key];
        if (worker) {
          worker.addEventListener("statechange", function () {
            setSwState(registration);
          });
        }
      });

      if (navigator.serviceWorker.controller) {
        try {
          sessionStorage.removeItem(RELOAD_KEY);
        } catch (e) {}
        setSwState(registration);
        return;
      }

      var reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", function onControl() {
        if (reloading) return;
        reloading = true;
        navigator.serviceWorker.removeEventListener("controllerchange", onControl);
        bumpAndReload();
      });

      navigator.serviceWorker.ready.then(function () {
        setSwState(registration);
        if (!navigator.serviceWorker.controller && !reloading) {
          reloading = true;
          bumpAndReload();
        }
      });
    })
    .catch(function (error) {
      window.__vectorPwa.swError =
        error && error.message ? error.message : "service worker registration failed";
      window.dispatchEvent(new Event("vectorpwa:swstate"));
    });
})();
