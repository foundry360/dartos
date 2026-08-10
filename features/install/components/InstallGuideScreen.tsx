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
            !/Mobile/i.test(navigator.userAgent) &&
            window.innerWidth >= 1000)),
    );

    // Best-effort Incognito signal (not perfect).
    void (async () => {
      try {
        if ("storage" in navigator && "estimate" in navigator.storage) {
          // no reliable API; try FileSystem trick where available
        }
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
      // Prefer the prompt captured before React (window.__vectorPwa), not just React state.
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
          ? isServiceWorkerReady
            ? "Chrome has not offered an install dialog on this tab yet. Use ⋮ → Add to Home screen → Install app. If that is missing, open chrome://webapks and remove any old VectorOS entry, then clear site data and reload."
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
      : isServiceWorkerReady
        ? "installable-waiting"
        : "sw-loading";

  return (
    <AuthShell>
      <AuthBrandLogo />
      <h1 className="auth-screen__title">Install {APP_NAME}</h1>
      <p className="auth-screen__lede install-guide__lede">
        Desktop Chrome can show Install with just the manifest. Android Chrome also needs a
        controlling service worker. If the status below says the service worker is not ready,
        that is why tablet Install is missing while desktop works.
      </p>

      <div
        className={
          verdict === "prompt-ready" || verdict === "installable-waiting"
            ? "install-guide__verdict install-guide__verdict--ok"
            : verdict === "already-installed"
              ? "install-guide__verdict install-guide__verdict--warn"
              : "install-guide__verdict"
        }
      >
        {verdict === "prompt-ready"
          ? "This browser has offered an install prompt — tap Install below."
          : null}
        {verdict === "installable-waiting"
          ? "Service worker is ready. Chrome may still need ~30s on-page + one tap before it offers Install (engagement rules)."
          : null}
        {verdict === "already-installed"
          ? "Chrome thinks VectorOS is already installed (or you’re in the installed app)."
          : null}
        {verdict === "sw-loading"
          ? "Still registering the service worker…"
          : null}
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
          {secondsOnPage < 30 ? " (Chrome often waits until 30s)" : " (engagement time met)"}
        </p>
        <p>
          Desktop site likely: <strong>{desktopSiteLikely ? "yes — turn it off" : "no"}</strong>
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
                <strong>First:</strong> open <strong>chrome://webapks</strong> and delete any old
                VectorOS / vectordarts entry
              </li>
              <li>
                Use the <strong>Chrome</strong> app in a normal tab (not Incognito)
              </li>
              <li>
                Turn <strong>Desktop site</strong> off, reload, stay on this page 30+ seconds, tap
                once anywhere
              </li>
              {browser === "samsung" ? (
                <>
                  <li>
                    Samsung Internet: menu → <strong>Add page to</strong> →{" "}
                    <strong>Home screen</strong>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Chrome menu <strong>⋮</strong> → <strong>Add to Home screen</strong>
                  </li>
                  <li>
                    On the next sheet tap <strong>Install app</strong> (not Create shortcut)
                  </li>
                </>
              )}
              <li>
                Open the new <strong>{APP_NAME}</strong> icon from Home Screen / app drawer
              </li>
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
