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
  promptInstall: () => Promise<BeforeInstallPromptOutcome | "unavailable">;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEventLike | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsManualInstallSteps, setNeedsManualInstallSteps] = useState(false);

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

    return () => {
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
      promptInstall,
    }),
    [deferredPrompt, isInstalled, needsManualInstallSteps, promptInstall],
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
