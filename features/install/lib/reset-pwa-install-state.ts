/**
 * Clears service workers + Cache Storage so Chrome can re-evaluate installability.
 * Does not clear cookies / auth. Caller should reload afterward.
 */
export async function resetPwaInstallState(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  try {
    sessionStorage.removeItem("vectoros.sw.controller-reload");
    sessionStorage.removeItem("vectoros.android-install-banner.dismissed");
    sessionStorage.removeItem("vectoros.android-install-modal.dismissed");
  } catch {
    // ignore
  }

  if (window.__vectorPwa) {
    window.__vectorPwa.deferredPrompt = null;
    window.__vectorPwa.firedAt = null;
  }
}
