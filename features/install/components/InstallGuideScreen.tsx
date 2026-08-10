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
import { resetPwaInstallState } from "@/features/install/lib/reset-pwa-install-state";
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
  const [resetting, setResetting] = useState(false);
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
        setMessage("Install was cancelled. Tap Install again when ready.");
        return;
      }

      setMessage(
        android
          ? isServiceWorkerReady
            ? "Chrome has not offered an install dialog yet. Tap “Reset install state”, then also open chrome://webapks and delete any VectorOS row."
            : "Service worker is not controlling this page yet. Wait a few seconds for a reload, then try again."
          : "Use the steps below for your device.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setMessage("Clearing service workers and caches…");
    try {
      await resetPwaInstallState();
      window.location.href = "/install?fresh=1";
    } catch {
      setMessage("Reset failed. Clear site data in Chrome Settings, then reload.");
      setResetting(false);
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
          <strong>Do not look for Add to Home screen in the ⋮ menu</strong>
          <p className="install-guide__callout-body">
            On this tablet Chrome may never show that item. Use the green Install button below when
            status says the install prompt fired. If it never fires, reset install state and delete
            ghost apps at chrome://webapks.
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
          ? "Install prompt is ready — tap Install below now."
          : null}
        {verdict === "ghost-install"
          ? "Chrome reports a related installed app. That blocks a new install. Remove it at chrome://webapks, then Reset."
          : null}
        {verdict === "installable-waiting"
          ? "Service worker is ready. Stay on this page. When Install turns green-ready, tap it. If it never does, Reset below."
          : null}
        {verdict === "already-installed"
          ? "Chrome thinks VectorOS is already installed (or you’re inside the installed app)."
          : null}
        {verdict === "sw-loading" ? "Still registering the service worker…" : null}
      </div>

      {standalone || isInstalled ? (
        <p className="auth-screen__message">
          Open <strong>chrome://webapks</strong>, delete any VectorOS / play.vectordarts.app row,
          then tap Reset install state below.
        </p>
      ) : (
        <button
          type="button"
          className="auth-screen__cta"
          disabled={busy || resetting}
          onClick={() => void handleInstallTap()}
        >
          {busy
            ? "Opening Chrome install…"
            : isInstallAvailable
              ? `Install ${APP_NAME}`
              : "Try install now"}
        </button>
      )}

      <button
        type="button"
        className="install-guide__reset"
        disabled={resetting || busy}
        onClick={() => void handleReset()}
      >
        {resetting ? "Resetting…" : "Reset install state"}
      </button>

      {message ? <p className="auth-screen__message">{message}</p> : null}

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
            ? " — this alone can block install"
            : null}
        </p>
      </div>

      <button type="button" className="install-guide__copy" onClick={() => void handleCopy()}>
        {copied ? "Copied" : "Copy diagnostics for support"}
      </button>

      {android ? (
        <ol className="install-guide__steps">
          <li>
            Open <strong>chrome://webapks</strong> → delete every VectorOS / vectordarts /
            play.vectordarts.app row
          </li>
          <li>
            Tap <strong>Reset install state</strong> above (clears service workers + caches)
          </li>
          <li>
            Wait until status shows <strong>beforeinstallprompt: fired</strong>, then tap{" "}
            <strong>Install {APP_NAME}</strong>
          </li>
          <li>
            Confirm Chrome’s Install sheet. Open the new icon from Home Screen / app drawer
          </li>
          <li>
            Still blocked: Chrome Settings → Site settings → play.vectordarts.app → Clear &amp;
            reset, then repeat from step 1
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

      <p className="auth-screen__footer">
        <Link href={LOGIN_PATH} className="auth-screen__footer-link">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
