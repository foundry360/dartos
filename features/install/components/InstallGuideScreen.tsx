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

type BrowserKind = "chrome" | "samsung" | "firefox" | "other";

function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") {
    return "other";
  }
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) {
    return "samsung";
  }
  if (/Firefox|FxiOS/i.test(ua)) {
    return "firefox";
  }
  if (/Chrome|CriOS|EdgA|Edg\//i.test(ua) && !/SamsungBrowser/i.test(ua)) {
    return "chrome";
  }
  return "other";
}

export function InstallGuideScreen() {
  const {
    isInstalled,
    isInstallAvailable,
    isServiceWorkerReady,
    installPromptFiredAt,
    promptInstall,
  } = usePwaInstall();
  const [android, setAndroid] = useState(false);
  const [apple, setApple] = useState(false);
  const [browser, setBrowser] = useState<BrowserKind>("other");
  const [standalone, setStandalone] = useState(false);
  const [relatedCount, setRelatedCount] = useState<number | null>(null);
  const [desktopSiteLikely, setDesktopSiteLikely] = useState(false);
  const [incognitoLikely, setIncognitoLikely] = useState(false);
  const [secondsOnPage, setSecondsOnPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAndroid(isAndroidDevice());
    setApple(isAppleMobileDevice());
    setBrowser(detectBrowser());
    setStandalone(isRunningAsInstalledApp());

    // Tablets with "Desktop site" often report non-mobile UA client hints.
    const mobileHint = (
      navigator as Navigator & { userAgentData?: { mobile?: boolean } }
    ).userAgentData?.mobile;
    setDesktopSiteLikely(
      isAndroidDevice() &&
        (mobileHint === false ||
          (/Android/i.test(navigator.userAgent) &&
            !/Mobile/i.test(navigator.userAgent))),
    );

    void (async () => {
      try {
        const fs = (
          window as Window & {
            webkitRequestFileSystem?: (
              type: number,
              size: number,
              success: () => void,
              error: () => void,
            ) => void;
          }
        ).webkitRequestFileSystem;
        if (typeof fs === "function") {
          fs(
            0,
            1,
            () => setIncognitoLikely(false),
            () => setIncognitoLikely(true),
          );
        }
      } catch {
        // ignore
      }
    })();

    const nav = navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    };
    if (typeof nav.getInstalledRelatedApps === "function") {
      void nav
        .getInstalledRelatedApps()
        .then((apps) => setRelatedCount(apps.length))
        .catch(() => setRelatedCount(null));
    }
  }, []);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setSecondsOnPage(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleInstallTap = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        setMessage(`${APP_NAME} is installing. Check your Home Screen / app drawer.`);
        return;
      }
      if (outcome === "dismissed") {
        setMessage("Install was cancelled.");
        return;
      }

      setMessage(
        android
          ? desktopSiteLikely
            ? "No in-page prompt yet. On this tablet Chrome is in Desktop site mode — “Add to Home screen” is removed from the ⋮ menu. Look in the address bar for the Install icon (monitor / download), or turn Desktop site OFF and reload."
            : isServiceWorkerReady
              ? "No in-page prompt yet. Look in the address bar (not ⋮) for an Install icon, or turn Desktop site off in ⋮ and reload."
              : "Service worker is not controlling this page yet. Wait for a reload, then try again."
          : "Use the steps below for your device.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verdict = standalone || isInstalled
    ? "already-installed"
    : isInstallAvailable
      ? "prompt-ready"
      : desktopSiteLikely
        ? "desktop-site"
        : isServiceWorkerReady
          ? "installable-waiting"
          : "sw-loading";

  return (
    <AuthShell>
      <AuthBrandLogo />
      <h1 className="auth-screen__title">Install {APP_NAME}</h1>

      {android ? (
        <div className="install-guide__verdict install-guide__verdict--warn">
          <strong>Why the three-dot menu has no Add to Home screen on this tablet</strong>
          <p className="install-guide__callout-body">
            Android tablet Chrome with <strong>Desktop site</strong> on (often the default)
            removes that menu item. Install is either our button below, or an icon in the{" "}
            <strong>address bar</strong> — not under the three-dot menu.
          </p>
        </div>
      ) : (
        <p className="auth-screen__lede install-guide__lede">
          Use the steps for your device. Desktop Chrome and Android Chrome use different install
          UIs.
        </p>
      )}

      <div
        className={
          verdict === "prompt-ready"
            ? "install-guide__verdict install-guide__verdict--ok"
            : verdict === "already-installed" || verdict === "desktop-site"
              ? "install-guide__verdict install-guide__verdict--warn"
              : "install-guide__verdict"
        }
      >
        {verdict === "prompt-ready"
          ? "Install prompt is ready — tap the Install button below. You do not need the ⋮ menu."
          : null}
        {verdict === "desktop-site"
          ? "This tab looks like Desktop site mode. Turn it OFF (Chrome ⋮ → uncheck Desktop site), reload, then tap Install — or tap the Install icon in the address bar."
          : null}
        {verdict === "installable-waiting"
          ? "Service worker is ready. Stay on this page, then tap Install below. If that fails, check the address bar for an Install icon."
          : null}
        {verdict === "already-installed"
          ? "Chrome thinks VectorOS is already installed (or you’re in the installed app)."
          : null}
        {verdict === "sw-loading" ? "Still registering the service worker…" : null}
      </div>

      <div className="install-guide__status" aria-live="polite">
        <p>
          Browser: <strong>{browser}</strong>
          {android ? " · Android" : null}
          {apple ? " · Apple" : null}
        </p>
        <p>
          Service worker controlling page:{" "}
          <strong>{isServiceWorkerReady ? "yes" : "no — Android will not offer Install yet"}</strong>
        </p>
        <p>
          beforeinstallprompt:{" "}
          <strong>
            {isInstallAvailable || installPromptFiredAt
              ? `fired${installPromptFiredAt ? ` @ ${new Date(installPromptFiredAt).toLocaleTimeString()}` : ""}`
              : "not fired yet"}
          </strong>
        </p>
        <p>
          Time on this page: <strong>{secondsOnPage}s</strong>
        </p>
        <p>
          Desktop site likely:{" "}
          <strong>{desktopSiteLikely ? "YES — this is why ⋮ has no Add to Home screen" : "no"}</strong>
        </p>
        <p>
          Incognito likely: <strong>{incognitoLikely ? "yes — use a normal tab" : "no / unknown"}</strong>
        </p>
        {relatedCount !== null ? (
          <p>
            Related installed apps: <strong>{relatedCount}</strong>
            {relatedCount > 0
              ? " — remove ghost installs at chrome://webapks"
              : null}
          </p>
        ) : null}
      </div>

      {standalone || isInstalled ? (
        <p className="auth-screen__message">
          Open <strong>chrome://webapks</strong>, delete any VectorOS / play.vectordarts.app row,
          then Chrome Settings → Site settings → clear data for this site, reload this page, and
          try again.
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

          {message ? <p className="auth-screen__message">{message}</p> : null}

          {android ? (
            <ol className="install-guide__steps">
              <li>
                <strong>Do this first:</strong> Chrome <strong>⋮</strong> → turn{" "}
                <strong>Desktop site</strong> <strong>OFF</strong> → reload this page
              </li>
              <li>
                Tap <strong>Install {APP_NAME}</strong> above (best path — ignores the missing menu item)
              </li>
              <li>
                If the button says nothing happened: look in the <strong>address bar</strong>{" "}
                (top) for an Install icon — computer / download — tap that. It is{" "}
                <strong>not</strong> under ⋮ when Desktop site is on
              </li>
              <li>
                Still stuck: open <strong>chrome://webapks</strong>, delete any VectorOS /
                vectordarts row, clear site data for play.vectordarts.app, reload
              </li>
              {browser === "samsung" ? (
                <li>
                  Or Samsung Internet: menu → <strong>Add page to</strong> →{" "}
                  <strong>Home screen</strong>
                </li>
              ) : null}
            </ol>
          ) : null}

          {apple ? (
            <ol className="install-guide__steps">
              <li>
                Open in <strong>Safari</strong> → Share → <strong>Add to Home Screen</strong>
              </li>
            </ol>
          ) : null}

          {!android && !apple ? (
            <ol className="install-guide__steps">
              <li>
                Chrome/Edge menu → <strong>Install {APP_NAME}</strong> / Install page as app
              </li>
            </ol>
          ) : null}
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
