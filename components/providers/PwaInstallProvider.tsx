"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isAppInstalled,
  isAndroidDevice,
  needsIosAddToHomeScreenInstructions,
  type BeforeInstallPromptEventLike,
  type BeforeInstallPromptOutcome,
} from "@/features/install/lib/pwa-install";

interface PwaInstallContextValue {
  isInstalled: boolean;
  isInstallAvailable: boolean;
  needsManualInstallSteps: boolean;
  /** True once a service worker is active (required for Android Chrome install). */
  isServiceWorkerReady: boolean;
  /** When beforeinstallprompt last fired (ms since epoch), for diagnostics. */
  installPromptFiredAt: number | null;
  promptInstall: () => Promise<BeforeInstallPromptOutcome | "unavailable">;
}

type VectorPwaGlobal = {
  deferredPrompt: BeforeInstallPromptEventLike | null;
  firedAt: number | null;
};

declare global {
  interface Window {
    __vectorPwa?: VectorPwaGlobal;
  }
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

const SW_URL = "/sw.js";

function readCapturedPrompt(): {
  prompt: BeforeInstallPromptEventLike | null;
  firedAt: number | null;
} {
  if (typeof window === "undefined") {
    return { prompt: null, firedAt: null };
  }
  const bag = window.__vectorPwa;
  return {
    prompt: bag?.deferredPrompt ?? null,
    firedAt: bag?.firedAt ?? null,
  };
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEventLike | null>(
    null,
  );
  const [installPromptFiredAt, setInstallPromptFiredAt] = useState<number | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsManualInstallSteps, setNeedsManualInstallSteps] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsInstalled(isAppInstalled());
      setNeedsManualInstallSteps(needsIosAddToHomeScreenInstructions());
    };

    sync();

    // Pick up a prompt captured by public/pwa-install-capture.js before React.
    const captured = readCapturedPrompt();
    if (captured.prompt) {
      setDeferredPrompt(captured.prompt);
      setInstallPromptFiredAt(captured.firedAt);
    }

    const mediaStandalone = window.matchMedia("(display-mode: standalone)");
    const mediaFullscreen = window.matchMedia("(display-mode: fullscreen)");
    const onDisplayModeChange = () => sync();

    mediaStandalone.addEventListener("change", onDisplayModeChange);
    mediaFullscreen.addEventListener("change", onDisplayModeChange);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);

    const onCapturedPrompt = () => {
      const next = readCapturedPrompt();
      setDeferredPrompt(next.prompt);
      setInstallPromptFiredAt(next.firedAt);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallPromptFiredAt(null);
      setIsInstalled(true);
      setNeedsManualInstallSteps(false);
    };

    window.addEventListener("vectorpwa:beforeinstallprompt", onCapturedPrompt);
    window.addEventListener("vectorpwa:appinstalled", onAppInstalled);
    window.addEventListener("appinstalled", onAppInstalled);

    let cancelled = false;
    let pollId = 0;

    const markReadyFromRegistrations = async () => {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      const ready = registrations.some(
        (registration) =>
          registration.active?.state === "activated" ||
          Boolean(navigator.serviceWorker.controller),
      );
      if (!cancelled) {
        setIsServiceWorkerReady(ready);
      }
      return ready;
    };

    const ensureServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        return;
      }

      try {
        // Register only. Do not unregister existing workers on every load —
        // that was resetting installability on tablets mid-session.
        const registration = await navigator.serviceWorker.register(SW_URL, {
          scope: "/",
          updateViaCache: "none",
        });

        // If a legacy worker is stuck installing with no active worker, clear once.
        if (registration.installing && !registration.active) {
          const stuck = registration.installing;
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(() => resolve(), 4000);
            const onStateChange = () => {
              if (stuck.state === "activated" || stuck.state === "redundant") {
                window.clearTimeout(timer);
                stuck.removeEventListener("statechange", onStateChange);
                resolve();
              }
            };
            stuck.addEventListener("statechange", onStateChange);
          });

          if (!registration.active && registration.installing) {
            await registration.unregister().catch(() => undefined);
            await navigator.serviceWorker.register(SW_URL, {
              scope: "/",
              updateViaCache: "none",
            });
          }
        }

        await registration.update().catch(() => undefined);
        await markReadyFromRegistrations();

        // After SW is controlling, Android often needs a reload before BIP.
        // Don't force-reload; just wait — early capture script will catch BIP.
        if (isAndroidDevice() && !navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
              void markReadyFromRegistrations();
            },
            { once: true },
          );
        }
      } catch {
        if (!cancelled) {
          setIsServiceWorkerReady(false);
        }
      }
    };

    void ensureServiceWorker();
    pollId = window.setInterval(() => {
      void markReadyFromRegistrations();
      const next = readCapturedPrompt();
      if (next.prompt) {
        setDeferredPrompt((current) => current ?? next.prompt);
        setInstallPromptFiredAt((current) => current ?? next.firedAt);
      }
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      mediaStandalone.removeEventListener("change", onDisplayModeChange);
      mediaFullscreen.removeEventListener("change", onDisplayModeChange);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("vectorpwa:beforeinstallprompt", onCapturedPrompt);
      window.removeEventListener("vectorpwa:appinstalled", onAppInstalled);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
    // deferredPrompt intentionally omitted from deps — poll only seeds initial capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only PWA bootstrap
  }, []);

  const promptInstall = useCallback(async (): Promise<BeforeInstallPromptOutcome | "unavailable"> => {
    const fromState = deferredPrompt;
    const fromWindow = readCapturedPrompt().prompt;
    const promptEvent = fromState ?? fromWindow;

    if (!promptEvent) {
      return "unavailable";
    }

    setDeferredPrompt(null);
    if (window.__vectorPwa) {
      window.__vectorPwa.deferredPrompt = null;
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      } else {
        // Allow retry on a future navigation; event is one-shot.
        setInstallPromptFiredAt(null);
      }
      return outcome;
    } catch {
      return "unavailable";
    }
  }, [deferredPrompt]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      isInstalled,
      isInstallAvailable: Boolean(deferredPrompt) && !isInstalled,
      needsManualInstallSteps: needsManualInstallSteps && !isInstalled,
      isServiceWorkerReady,
      installPromptFiredAt,
      promptInstall,
    }),
    [
      deferredPrompt,
      installPromptFiredAt,
      isInstalled,
      isServiceWorkerReady,
      needsManualInstallSteps,
      promptInstall,
    ],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): PwaInstallContextValue {
  const context = useContext(PwaInstallContext);

  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }

  return context;
}
