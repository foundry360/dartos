/**
 * Capture beforeinstallprompt as early as possible.
 * React hydrates after the boot splash; Chrome only fires this event once per
 * page load, so a late listener permanently misses it on slow tablets.
 */
(function () {
  if (typeof window === "undefined") return;

  window.__vectorPwa = window.__vectorPwa || {
    deferredPrompt: null,
    firedAt: null,
  };

  window.addEventListener("beforeinstallprompt", function (event) {
    // Stash for the React install UI. preventDefault keeps the event usable
    // with prompt(); Chrome’s ⋮ Install entry is driven by installability,
    // not by this cancelation.
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
})();
