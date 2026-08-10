"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  isAndroidDevice,
  isRunningAsInstalledApp,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import "@/features/install/android-pwa-install-banner.css";

const DISMISS_KEY = "vectoros.android-install-banner.dismissed";

/**
 * Points Android users at /install — Chrome’s menu install flow is two steps and
 * in-page prompts often never fire on tablets.
 */
export function AndroidPwaInstallBanner() {
  const { isInstalled, isInstallAvailable, promptInstall } = usePwaInstall();
  const [android, setAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

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
    if (!isInstallAvailable) {
      return;
    }
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        setDismissed(true);
      }
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
              ? "Chrome is ready — tap Install."
              : "Open install help to download the Android app (recommended on tablets)."}
          </p>
        </div>
        <div className="android-pwa-install-banner__actions">
          {isInstallAvailable ? (
            <button
              type="button"
              className="android-pwa-install-banner__cta"
              disabled={busy}
              onClick={() => void handleInstall()}
            >
              {busy ? "Opening…" : "Install"}
            </button>
          ) : null}
          <Link href="/install" className="android-pwa-install-banner__cta">
            {isInstallAvailable ? "Help" : "Install help"}
          </Link>
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
    </div>
  );
}
