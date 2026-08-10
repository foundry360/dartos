"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  isAndroidDevice,
  isRunningAsInstalledApp,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import "@/features/install/android-pwa-install-modal.css";

const DISMISS_KEY = "vectoros.android-install-modal.dismissed";

/**
 * When Chrome fires beforeinstallprompt, show a blocking install sheet.
 * On many Android tablets the ⋮ menu never lists Install — this is the path.
 */
export function AndroidPwaInstallModal() {
  const { isInstalled, isInstallAvailable, promptInstall } = usePwaInstall();
  const [android, setAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!android || isInstalled || dismissed || !isInstallAvailable) {
    return null;
  }

  const handleInstall = async () => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        setDismissed(true);
        return;
      }
      if (outcome === "dismissed") {
        setError("Install was cancelled. Tap Install again when ready.");
        return;
      }
      setError("Chrome did not open the install dialog. Open /install and tap Reset install state.");
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
    <div className="android-pwa-install-modal" role="dialog" aria-modal="true" aria-labelledby="android-pwa-install-title">
      <div className="android-pwa-install-modal__card">
        <p className="android-pwa-install-modal__eyebrow">Android install ready</p>
        <h2 id="android-pwa-install-title" className="android-pwa-install-modal__title">
          Install {APP_NAME}
        </h2>
        <p className="android-pwa-install-modal__text">
          Chrome on this tablet often hides Install from the ⋮ menu. Use this button — it is the
          same install Chrome would show in the address bar.
        </p>
        <button
          type="button"
          className="android-pwa-install-modal__cta"
          disabled={busy}
          onClick={() => void handleInstall()}
        >
          {busy ? "Opening Chrome install…" : `Install ${APP_NAME}`}
        </button>
        {error ? <p className="android-pwa-install-modal__error">{error}</p> : null}
        <div className="android-pwa-install-modal__footer">
          <Link href="/install" className="android-pwa-install-modal__link">
            Install help / reset
          </Link>
          <button type="button" className="android-pwa-install-modal__later" onClick={handleDismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
