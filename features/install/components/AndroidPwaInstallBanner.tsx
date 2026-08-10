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

async function openAndroidShareSheet(): Promise<"shared" | "unsupported" | "cancelled"> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }

  try {
    await navigator.share({
      title: APP_NAME,
      text: `Add ${APP_NAME} to your Home Screen`,
      url: `${window.location.origin}/login`,
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    return "unsupported";
  }
}

/**
 * Android tablets often hide Chrome’s ⋮ install entry and never fire
 * beforeinstallprompt. Primary path: open the share sheet so the user can tap
 * Add to Home screen there.
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
      // 1) Native PWA prompt when Chrome offers it.
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

      // 2) Share sheet — on Android Chrome this usually includes Add to Home screen.
      const shareResult = await openAndroidShareSheet();
      if (shareResult === "shared") {
        setMessage(
          `In the share sheet, tap **Add to Home screen** or **Install ${APP_NAME}**.`,
        );
        setShowSteps(true);
        return;
      }
      if (shareResult === "cancelled") {
        setMessage("Share cancelled. Tap Add to Home Screen again when you’re ready.");
        return;
      }

      // 3) Manual steps if share isn’t available.
      setShowSteps(true);
      setMessage(
        isServiceWorkerReady
          ? "This browser did not open an install dialog. Follow the steps below."
          : "Follow the steps below to add VectorOS to your Home Screen.",
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
              ? "Chrome is ready — tap to install the full-screen app."
              : "Tap Add to Home Screen, then choose Add to Home screen in the share sheet."}
          </p>
        </div>
        <div className="android-pwa-install-banner__actions">
          <button
            type="button"
            className="android-pwa-install-banner__cta"
            disabled={busy}
            onClick={() => void handleInstall()}
          >
            {busy ? "Opening…" : isInstallAvailable ? "Install" : "Add to Home Screen"}
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

      {message ? (
        <p className="android-pwa-install-banner__message">{renderStep(message)}</p>
      ) : null}

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
