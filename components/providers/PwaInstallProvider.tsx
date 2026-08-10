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
  needsIosAddToHomeScreenInstructions,
  supportsNativeInstallPrompt,
  type BeforeInstallPromptEventLike,
  type BeforeInstallPromptOutcome,
} from "@/features/install/lib/pwa-install";

interface PwaInstallContextValue {
  isInstalled: boolean;
  isInstallAvailable: boolean;
  needsManualInstallSteps: boolean;
  /** True once a service worker is active (required for Android Chrome install). */
  isServiceWorkerReady: boolean;
  promptInstall: () => Promise<BeforeInstallPromptOutcome | "unavailable">;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

const SW_URL = "/sw.js";

function registrationIsReady(registration: ServiceWorkerRegistration | undefined): boolean {
  if (!registration) {
    return false;
  }

  return Boolean(
    registration.active?.state === "activated" || navigator.serviceWorker.controller,
  );
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEventLike | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsManualInstallSteps, setNeedsManualInstallSteps] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsInstalled(isAppInstalled());
      setNeedsManualInstallSteps(needsIosAddToHomeScreenInstructions());
    };

    sync();

    const mediaStandalone = window.matchMedia("(display-mode: standalone)");
    const mediaFullscreen = window.matchMedia("(display-mode: fullscreen)");
    const onDisplayModeChange = () => sync();

    mediaStandalone.addEventListener("change", onDisplayModeChange);
    mediaFullscreen.addEventListener("change", onDisplayModeChange);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);

    const onBeforeInstallPrompt = (event: Event) => {
      if (!supportsNativeInstallPrompt()) {
        return;
      }

      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEventLike);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setNeedsManualInstallSteps(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    let cancelled = false;
    let pollId = 0;

    const markReadyFromRegistrations = async () => {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      const ready = registrations.some((registration) => registrationIsReady(registration));
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
        const existing = await navigator.serviceWorker.getRegistrations();
        const hasStuckWorker = existing.some(
          (registration) => Boolean(registration.installing) && !registration.active,
        );

        // Tablets often keep the old Workbox SW stuck in "installing" forever.
        // Clear every registration once so the minimal /sw.js can activate.
        if (hasStuckWorker || existing.length > 1) {
          await Promise.all(existing.map((registration) => registration.unregister().catch(() => undefined)));
        }

        let registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
        await registration.update().catch(() => undefined);

        const waitForActivated = async (reg: ServiceWorkerRegistration) => {
          const worker = reg.installing || reg.waiting || reg.active;
          if (!worker) {
            return;
          }
          if (worker.state === "activated") {
            return;
          }

          await new Promise<void>((resolve) => {
            const onStateChange = () => {
              if (worker.state === "activated" || worker.state === "redundant") {
                worker.removeEventListener("statechange", onStateChange);
                resolve();
              }
            };
            worker.addEventListener("statechange", onStateChange);
            window.setTimeout(() => {
              worker.removeEventListener("statechange", onStateChange);
              resolve();
            }, 5000);
          });
        };

        await waitForActivated(registration);

        if (!(await markReadyFromRegistrations())) {
          // Last resort: wipe and register clean.
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg) => reg.unregister().catch(() => undefined)));
          registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
          await waitForActivated(registration);
          await markReadyFromRegistrations();
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
    }, 1500);

    navigator.serviceWorker?.addEventListener("controllerchange", () => {
      void markReadyFromRegistrations();
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      mediaStandalone.removeEventListener("change", onDisplayModeChange);
      mediaFullscreen.removeEventListener("change", onDisplayModeChange);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<BeforeInstallPromptOutcome | "unavailable"> => {
    if (!deferredPrompt) {
      return "unavailable";
    }

    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
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
      promptInstall,
    }),
    [deferredPrompt, isInstalled, isServiceWorkerReady, needsManualInstallSteps, promptInstall],
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
