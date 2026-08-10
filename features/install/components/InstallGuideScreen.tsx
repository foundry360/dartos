"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthBrandLogo } from "@/features/auth/components/AuthBrandLogo";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  isAndroidDevice,
  isAppleMobileDevice,
  isRunningAsInstalledApp,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import { LOGIN_PATH } from "@/lib/auth/routes";
import "@/features/install/install-guide.css";

type BrowserKind = "chrome" | "samsung" | "other";

function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") {
    return "other";
  }
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) {
    return "samsung";
  }
  if (/Chrome|CriOS|EdgA|Edg\//i.test(ua) && !/SamsungBrowser/i.test(ua)) {
    return "chrome";
  }
  return "other";
}

export function InstallGuideScreen() {
  const { isInstalled, isInstallAvailable, isServiceWorkerReady, promptInstall } =
    usePwaInstall();
  const [android, setAndroid] = useState(false);
  const [apple, setApple] = useState(false);
  const [browser, setBrowser] = useState<BrowserKind>("other");
  const [standalone, setStandalone] = useState(false);
  const [relatedCount, setRelatedCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAndroid(isAndroidDevice());
    setApple(isAppleMobileDevice());
    setBrowser(detectBrowser());
    setStandalone(isRunningAsInstalledApp());

    const nav = navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    };
    if (typeof nav.getInstalledRelatedApps === "function") {
      void nav.getInstalledRelatedApps().then((apps) => {
        setRelatedCount(apps.length);
      }).catch(() => {
        setRelatedCount(null);
      });
    }
  }, []);

  const handleInstallTap = async () => {
    setBusy(true);
    setMessage(null);

    try {
      if (isInstallAvailable) {
        const outcome = await promptInstall();
        if (outcome === "accepted") {
          setMessage(`${APP_NAME} is installing. Check your Home Screen / app drawer.`);
          return;
        }
        if (outcome === "dismissed") {
          setMessage("Install was cancelled.");
          return;
        }
      }

      // Engagement can unlock beforeinstallprompt — wait briefly after the tap.
      const latePrompt = await new Promise<boolean>((resolve) => {
        let done = false;
        const finish = (value: boolean) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          window.removeEventListener("beforeinstallprompt", onPrompt);
          resolve(value);
        };
        const onPrompt = () => finish(true);
        const timer = window.setTimeout(() => finish(false), 2500);
        window.addEventListener("beforeinstallprompt", onPrompt, { once: true });
      });

      if (latePrompt || isInstallAvailable) {
        const outcome = await promptInstall();
        if (outcome === "accepted") {
          setMessage(`${APP_NAME} is installing. Check your Home Screen / app drawer.`);
          return;
        }
      }

      setMessage(
        android
          ? "Chrome did not open an install dialog. Use the exact menu steps below — Install app is inside Add to Home screen."
          : "Use the steps below for your device.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <AuthBrandLogo />
      <h1 className="auth-screen__title">Install {APP_NAME}</h1>
      <p className="auth-screen__lede install-guide__lede">
        On many Android tablets, Chrome hides Install until you open{" "}
        <strong>Add to Home screen</strong> first.
      </p>

      {standalone || isInstalled ? (
        <p className="auth-screen__message">
          You’re already in the installed app (or Chrome thinks you are). If you don’t see an
          icon, open <strong>chrome://webapks</strong> in Chrome, remove any {APP_NAME} /
          vectordarts entry, clear site data, and try again.
        </p>
      ) : (
        <>
          <button
            type="button"
            className="auth-screen__cta"
            disabled={busy}
            onClick={() => void handleInstallTap()}
          >
            {busy ? "Checking…" : isInstallAvailable ? `Install ${APP_NAME}` : "Try install now"}
          </button>

          <div className="install-guide__status" aria-live="polite">
            <p>
              Service worker:{" "}
              <strong>{isServiceWorkerReady ? "ready" : "not ready yet"}</strong>
            </p>
            <p>
              Chrome install prompt:{" "}
              <strong>{isInstallAvailable ? "available" : "not offered yet"}</strong>
            </p>
            {relatedCount !== null ? (
              <p>
                Related installed apps: <strong>{relatedCount}</strong>
                {relatedCount > 0
                  ? " — Chrome may hide Install until you remove the old one (chrome://webapks)."
                  : null}
              </p>
            ) : null}
          </div>

          {message ? <p className="auth-screen__message">{message}</p> : null}

          {android ? (
            <ol className="install-guide__steps">
              {browser === "samsung" ? (
                <>
                  <li>
                    In <strong>Samsung Internet</strong>, tap the menu (☰ or ⋮)
                  </li>
                  <li>
                    Tap <strong>Add page to</strong> → <strong>Home screen</strong>
                  </li>
                  <li>
                    Tap <strong>Add</strong>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Stay in the <strong>Chrome</strong> app (not Incognito, Desktop site off)
                  </li>
                  <li>
                    Tap <strong>⋮</strong> (top right)
                  </li>
                  <li>
                    Tap <strong>Add to Home screen</strong>
                    <span className="install-guide__note">
                      {" "}
                      (this may be the only install-related item — that is normal)
                    </span>
                  </li>
                  <li>
                    On the next sheet, tap <strong>Install app</strong> (not “Create shortcut”
                    if both appear)
                  </li>
                  <li>
                    Tap <strong>Install</strong>
                  </li>
                  <li>
                    Open the new <strong>{APP_NAME}</strong> icon from your Home Screen / app
                    drawer
                  </li>
                </>
              )}
            </ol>
          ) : null}

          {apple ? (
            <ol className="install-guide__steps">
              <li>
                Open this site in <strong>Safari</strong>
              </li>
              <li>
                Tap <strong>Share</strong>
              </li>
              <li>
                Tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong>
              </li>
            </ol>
          ) : null}

          {!android && !apple ? (
            <ol className="install-guide__steps">
              <li>
                In Chrome/Edge, open the menu <strong>⋮</strong>
              </li>
              <li>
                Choose <strong>Install {APP_NAME}</strong> / <strong>Install page as app</strong>
              </li>
            </ol>
          ) : null}

          <p className="install-guide__ghost">
            Still nothing? In Chrome open <strong>chrome://webapks</strong> and delete any old
            VectorOS / play.vectordarts.app entry, then Settings → Site settings → clear data for
            this site, reload, and try again.
          </p>
        </>
      )}

      <p className="auth-screen__footer">
        <Link href={LOGIN_PATH} className="auth-screen__footer-link">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
