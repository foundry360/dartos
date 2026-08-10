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
  type BeforeInstallPromptEventLike,
  type BeforeInstallPromptOutcome,
} from "@/features/install/lib/pwa-install";

interface PwaInstallContextValue {
  isInstalled: boolean;
  isInstallAvailable: boolean;
  needsManualInstallSteps: boolean;
  /** True only when a service worker controls this page (required on Android). */
  isServiceWorkerReady: boolean;
  installPromptFiredAt: number | null;
  serviceWorkerError: string | null;
  serviceWorkerDetail: string | null;
  promptInstall: () => Promise<BeforeInstallPromptOutcome | "unavailable">;
}

type VectorPwaGlobal = {
  deferredPrompt: BeforeInstallPromptEventLike | null;
  firedAt: number | null;
  swError?: string | null;
  swState?: {
    controller: string | null;
    active: string | null;
    waiting: string | null;
    installing: string | null;
  } | null;
};

declare global {
  interface Window {
    __vectorPwa?: VectorPwaGlobal;
  }
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

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
  const [serviceWorkerError, setServiceWorkerError] = useState<string | null>(null);
  const [serviceWorkerDetail, setServiceWorkerDetail] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setIsInstalled(isAppInstalled());
      setNeedsManualInstallSteps(needsIosAddToHomeScreenInstructions());
    };

    sync();

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

    // Backup listener — capture script should get it first, but Android timing varies.
    const onNativePrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEventLike;
      promptEvent.preventDefault();
      if (window.__vectorPwa) {
        window.__vectorPwa.deferredPrompt = promptEvent;
        window.__vectorPwa.firedAt = Date.now();
      }
      setDeferredPrompt(promptEvent);
      setInstallPromptFiredAt(Date.now());
    };

    const syncSwMeta = () => {
      const bag = window.__vectorPwa;
      setServiceWorkerError(bag?.swError ?? null);
      const state = bag?.swState;
      if (!state) {
        setServiceWorkerDetail(null);
        return;
      }
      setServiceWorkerDetail(
        `active=${state.active ?? "none"}; waiting=${state.waiting ?? "none"}; installing=${state.installing ?? "none"}`,
      );
    };

    window.addEventListener("vectorpwa:beforeinstallprompt", onCapturedPrompt);
    window.addEventListener("vectorpwa:appinstalled", onAppInstalled);
    window.addEventListener("vectorpwa:swstate", syncSwMeta);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("beforeinstallprompt", onNativePrompt);

    let cancelled = false;
    let pollId = 0;

    const syncController = () => {
      if (cancelled || !("serviceWorker" in navigator)) {
        return;
      }
      // Android installability requires the SW to control this document — not
      // merely that an activated worker exists in the registration.
      setIsServiceWorkerReady(Boolean(navigator.serviceWorker.controller));
      syncSwMeta();
    };

    syncController();
    navigator.serviceWorker?.addEventListener("controllerchange", syncController);

    // SW is registered in pwa-install-capture.js; keep a light fallback here.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(() => syncController())
        .catch((error: unknown) => {
          if (!cancelled) {
            setIsServiceWorkerReady(false);
            setServiceWorkerError(
              error instanceof Error ? error.message : "service worker registration failed",
            );
          }
        });
    }

    pollId = window.setInterval(() => {
      syncController();
      const next = readCapturedPrompt();
      if (next.prompt) {
        setDeferredPrompt((current) => current ?? next.prompt);
        setInstallPromptFiredAt((current) => current ?? next.firedAt);
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      mediaStandalone.removeEventListener("change", onDisplayModeChange);
      mediaFullscreen.removeEventListener("change", onDisplayModeChange);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("vectorpwa:beforeinstallprompt", onCapturedPrompt);
      window.removeEventListener("vectorpwa:appinstalled", onAppInstalled);
      window.removeEventListener("vectorpwa:swstate", syncSwMeta);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("beforeinstallprompt", onNativePrompt);
      navigator.serviceWorker?.removeEventListener("controllerchange", syncController);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<BeforeInstallPromptOutcome | "unavailable"> => {
    const promptEvent = deferredPrompt ?? readCapturedPrompt().prompt;

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
      isInstallAvailable: !isInstalled && Boolean(deferredPrompt),
      needsManualInstallSteps: needsManualInstallSteps && !isInstalled,
      isServiceWorkerReady,
      installPromptFiredAt,
      serviceWorkerError,
      serviceWorkerDetail,
      promptInstall,
    }),
    [
      deferredPrompt,
      installPromptFiredAt,
      isInstalled,
      isServiceWorkerReady,
      needsManualInstallSteps,
      promptInstall,
      serviceWorkerDetail,
      serviceWorkerError,
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
