"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [uaSnippet, setUaSnippet] = useState("");
  const [copied, setCopied] = useState(false);
  const [secondsOnPage, setSecondsOnPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAndroid(isAndroidDevice());
    setApple(isAppleMobileDevice());
    setBrowser(detectBrowser());
    setStandalone(isRunningAsInstalledApp());
    setUaSnippet(navigator.userAgent.slice(0, 160));

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

  const diagnostics = useMemo(() => {
    return [
      `app=${APP_NAME}`,
      `browser=${browser}`,
      `android=${android}`,
      `apple=${apple}`,
      `standalone=${standalone || isInstalled}`,
      `swControlling=${isServiceWorkerReady}`,
      `bip=${isInstallAvailable || installPromptFiredAt ? "fired" : "no"}`,
      `bipAt=${installPromptFiredAt ?? ""}`,
      `related=${relatedCount ?? "n/a"}`,
      `onPageSec=${secondsOnPage}`,
      `ua=${uaSnippet}`,
      `href=${typeof window !== "undefined" ? window.location.href : ""}`,
    ].join(" | ");
  }, [
    android,
    apple,
    browser,
    installPromptFiredAt,
    isInstallAvailable,
    isInstalled,
    isServiceWorkerReady,
    relatedCount,
    secondsOnPage,
    standalone,
    uaSnippet,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagnostics);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Could not copy — screenshot the status box instead.");
    }
  };

  const handleInstallTap = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        setMessage(`${APP_NAME} is installing. Check Home Screen / app drawer.`);
        return;
      }
      if (outcome === "dismissed") {
        setMessage("Install was cancelled.");
        return;
      }

      setMessage(
        android
          ? isServiceWorkerReady
            ? "Chrome did not open an install dialog. Most common cause on tablets: a ghost install still registered. Open chrome://webapks, delete VectorOS / vectordarts, then clear site data and reload. Also search the app drawer for VectorOS."
            : "Service worker is not controlling this page yet. Wait for a reload, then try again."
          : "Use the steps below for your device.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verdict = standalone || isInstalled
    ? "already-installed"
    : relatedCount && relatedCount > 0
      ? "ghost-install"
      : isInstallAvailable
        ? "prompt-ready"
        : isServiceWorkerReady
          ? "installable-waiting"
          : "sw-loading";

  return (
    <AuthShell>
      <AuthBrandLogo />
      <h1 className="auth-screen__title">Install {APP_NAME}</h1>

      {android ? (
        <div className="install-guide__verdict install-guide__verdict--warn">
          <strong>Ignore Desktop site — that was a bad guess for tablets</strong>
          <p className="install-guide__callout-body">
            If the three-dot menu has no install item for this site, Chrome usually already has a
            WebAPK registered (even if the home icon is gone), or the menu label changed to{" "}
            <strong>Install and create shortcut</strong> / <strong>Install app</strong> /{" "}
            <strong>Open VectorOS</strong>.
          </p>
        </div>
      ) : (
        <p className="auth-screen__lede install-guide__lede">
          Use the steps for your device.
        </p>
      )}

      <div
        className={
          verdict === "prompt-ready"
            ? "install-guide__verdict install-guide__verdict--ok"
            : verdict === "already-installed" || verdict === "ghost-install"
              ? "install-guide__verdict install-guide__verdict--warn"
              : "install-guide__verdict"
        }
      >
        {verdict === "prompt-ready"
          ? "Install prompt is ready — tap Install below. You do not need the browser menu."
          : null}
        {verdict === "ghost-install"
          ? "Chrome reports a related installed app. That hides Add to Home screen. Remove it at chrome://webapks, then reload."
          : null}
        {verdict === "installable-waiting"
          ? "Service worker is ready. Tap Install below. If nothing happens, clear ghost WebAPKs and site data."
          : null}
        {verdict === "already-installed"
          ? "Chrome thinks VectorOS is already installed (or you’re inside the installed app)."
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
          Related installed apps:{" "}
          <strong>{relatedCount === null ? "n/a" : relatedCount}</strong>
          {relatedCount && relatedCount > 0
            ? " — this alone can remove Add to Home screen"
            : null}
        </p>
      </div>

      <button type="button" className="install-guide__copy" onClick={() => void handleCopy()}>
        {copied ? "Copied" : "Copy diagnostics for support"}
      </button>

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
                Search the tablet <strong>app drawer</strong> for <strong>VectorOS</strong> /{" "}
                VectorDarts. If it’s there, long-press → Uninstall / App info → Uninstall
              </li>
              <li>
                In Chrome address bar type <strong>chrome://webapks</strong> → delete every
                VectorOS / vectordarts / play.vectordarts.app row
              </li>
              <li>
                Chrome Settings → Site settings → All sites → play.vectordarts.app → Clear &amp;
                reset → reload this page → tap Install above
              </li>
              <li>
                In ⋮ look for <strong>Install and create shortcut</strong>,{" "}
                <strong>Install app</strong>, or <strong>Open VectorOS</strong> (newer Chrome
                renamed “Add to Home screen”)
              </li>
              <li>
                Control test: open <strong>google.com</strong> → ⋮ — if that site also has no
                Add/Install/shortcut item, this is a Chrome/launcher tablet issue, not VectorOS
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
