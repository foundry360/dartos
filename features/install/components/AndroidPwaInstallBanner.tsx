"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  getAndroidInstallSteps,
  isAndroidDevice,
  isRunningAsInstalledApp,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import "@/features/install/android-pwa-install-banner.css";

const DISMISS_KEY = "vectoros.android-install-banner.dismissed";

function renderStep(step: string) {
  const parts = step.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

/**
 * Android tablets often hide Chrome’s ⋮ install entry. When Chrome fires
 * beforeinstallprompt, this banner can install without using the browser menu.
 */
export function AndroidPwaInstallBanner() {
  const { isInstalled, isInstallAvailable, isServiceWorkerReady, promptInstall } =
    usePwaInstall();
  const [android, setAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const isAndroid = isAndroidDevice();
    setAndroid(isAndroid);
    if (!isAndroid || isRunningAsInstalledApp()) {
      setDismissed(true);
      return;
    }

    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!android || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    setBusy(true);
    setMessage(null);

    try {
      if (isInstallAvailable) {
        const outcome = await promptInstall();
        if (outcome === "accepted") {
          setDismissed(true);
          return;
        }
        if (outcome === "dismissed") {
          setMessage("Install was cancelled. You can try again anytime.");
          return;
        }
      }

      setShowSteps(true);
      setMessage(
        isServiceWorkerReady
          ? "Chrome did not open an install dialog. Use the steps below (or Share → Add to Home screen)."
          : "Still preparing install on this device. Wait a few seconds, then try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <div className="android-pwa-install-banner" role="region" aria-label={`Install ${APP_NAME}`}>
      <div className="android-pwa-install-banner__row">
        <div className="android-pwa-install-banner__copy">
          <p className="android-pwa-install-banner__title">Install {APP_NAME}</p>
          <p className="android-pwa-install-banner__text">
            {isInstallAvailable
              ? "Chrome is ready — install for the full-screen app."
              : isServiceWorkerReady
                ? "Add this site to your Home Screen for the full-screen app."
                : "Preparing install… keep this page open a few seconds."}
          </p>
        </div>
        <div className="android-pwa-install-banner__actions">
          <button
            type="button"
            className="android-pwa-install-banner__cta"
            disabled={busy}
            onClick={() => void handleInstall()}
          >
            {busy ? "Working…" : isInstallAvailable ? "Install" : "How to install"}
          </button>
          <button
            type="button"
            className="android-pwa-install-banner__dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
          >
            Not now
          </button>
        </div>
      </div>

      {message ? <p className="android-pwa-install-banner__message">{message}</p> : null}

      {showSteps ? (
        <ol className="android-pwa-install-banner__steps">
          {getAndroidInstallSteps().map((step, index) => (
            <li key={`${index}-${step}`}>
              <span aria-hidden>{index + 1}. </span>
              {renderStep(step)}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
