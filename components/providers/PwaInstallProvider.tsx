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

    const syncController = () => {
      if (cancelled || !("serviceWorker" in navigator)) {
        return;
      }
      // Android installability requires the SW to control this document — not
      // merely that an activated worker exists in the registration.
      setIsServiceWorkerReady(Boolean(navigator.serviceWorker.controller));
    };

    syncController();
    navigator.serviceWorker?.addEventListener("controllerchange", syncController);

    // SW is registered in pwa-install-capture.js; keep a light fallback here.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(() => syncController())
        .catch(() => {
          if (!cancelled) setIsServiceWorkerReady(false);
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
      window.removeEventListener("appinstalled", onAppInstalled);
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
