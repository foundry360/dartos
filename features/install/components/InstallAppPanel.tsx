"use client";

import { useState } from "react";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  getDesktopChromiumInstallSteps,
  getInstallPlatformLabel,
  getNativeInstallUnavailableMessage,
  supportsNativeInstallPrompt,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface InstallAppPanelProps {
  className?: string;
  /** Show “Not now” / secondary continue actions. */
  showSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  /** Called after a successful native install or when the user confirms they added to Home Screen. */
  onInstalled?: () => void;
  /** Compact layout for Settings. */
  variant?: "onboarding" | "settings";
}

export function InstallAppPanel({
  className,
  showSkip = false,
  skipLabel = "Not now",
  onSkip,
  onInstalled,
  variant = "onboarding",
}: InstallAppPanelProps) {
  const { isInstalled, isInstallAvailable, needsManualInstallSteps, promptInstall } =
    usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDesktopSteps, setShowDesktopSteps] = useState(false);
  const platform = getInstallPlatformLabel();
  const desktopSteps = getDesktopChromiumInstallSteps();
  const canUseNativePrompt = supportsNativeInstallPrompt();

  if (isInstalled) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          {APP_NAME} is installed on this device. Open it from your Dock, Applications folder,
          home screen, or Start menu for the full-screen experience.
        </p>
        {showSkip ? (
          <div className="onboarding-payment-screen__actions onboarding-payment-screen__actions--solo">
            <button type="button" className="auth-screen__cta" onClick={onInstalled ?? onSkip}>
              Continue to app
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const handleNativeInstall = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const outcome = await promptInstall();

      if (outcome === "accepted") {
        onInstalled?.();
        return;
      }

      if (outcome === "dismissed") {
        setMessage("Install was cancelled. You can try again anytime from Settings.");
        return;
      }

      setShowDesktopSteps(true);
      setMessage(getNativeInstallUnavailableMessage());
    } finally {
      setBusy(false);
    }
  };

  if (needsManualInstallSteps) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          Add {APP_NAME} to your {platform} Home Screen for full-screen scoring.
        </p>

        <ol className="install-app-panel__steps">
          <li>
            Tap the <strong>Share</strong> button
            {platform === "iPad" ? " in Safari’s toolbar" : " at the bottom of Safari"}
          </li>
          <li>
            Scroll and tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong>, then open {APP_NAME} from your Home Screen
          </li>
        </ol>

        {message ? <p className="auth-screen__message">{message}</p> : null}

        <div className="onboarding-payment-screen__actions install-app-panel__actions">
          {showSkip ? (
            <button
              type="button"
              className="onboarding-payment-screen__back install-app-panel__action"
              onClick={onSkip}
              disabled={busy}
            >
              {skipLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={cn(
              "auth-screen__cta onboarding-payment-screen__cta install-app-panel__action",
              !showSkip && "install-app-panel__cta-solo",
            )}
            onClick={() => {
              setMessage("Once it’s on your Home Screen, open it from there.");
              onInstalled?.();
            }}
          >
            I’ve installed it
          </button>
        </div>

        {variant === "settings" ? (
          <p className="install-app-panel__hint">
            Tip: On iPhone and iPad, install from Safari — Chrome can’t add the app there.
          </p>
        ) : null}
      </div>
    );
  }

  const showManualDesktopHelp =
    canUseNativePrompt && (variant === "settings" || showDesktopSteps) && !isInstallAvailable;

  return (
    <div className={cn("install-app-panel", className)}>
      <p className="install-app-panel__lede">
        Install {APP_NAME} for quicker access and a full-screen scoring experience.
      </p>

      {variant === "onboarding" && !isInstallAvailable ? (
        <p className="install-app-panel__hint">
          Prefer to continue in the browser? Tap Not now — you can install later from Settings →
          Install app.
        </p>
      ) : null}

      {showManualDesktopHelp ? (
        <>
          <p className="install-app-panel__hint">Install with Chrome’s built-in installer:</p>
          <ol className="install-app-panel__steps">
            {desktopSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </>
      ) : null}

      {message ? <p className="auth-screen__message">{message}</p> : null}

      <div className="onboarding-payment-screen__actions install-app-panel__actions">
        {showSkip ? (
          <button
            type="button"
            className="onboarding-payment-screen__back install-app-panel__action"
            onClick={onSkip}
            disabled={busy}
          >
            {skipLabel}
          </button>
        ) : null}
        {isInstallAvailable ? (
          <button
            type="button"
            className={cn(
              "auth-screen__cta onboarding-payment-screen__cta install-app-panel__action",
              !showSkip && "install-app-panel__cta-solo",
            )}
            disabled={busy}
            onClick={() => void handleNativeInstall()}
          >
            {busy ? "Opening installer…" : `Install ${APP_NAME}`}
          </button>
        ) : showSkip ? (
          <button
            type="button"
            className="auth-screen__cta onboarding-payment-screen__cta install-app-panel__action"
            disabled={busy}
            onClick={() => void handleNativeInstall()}
          >
            {busy ? "Opening installer…" : `Install ${APP_NAME}`}
          </button>
        ) : (
          <button
            type="button"
            className="auth-screen__cta install-app-panel__cta-solo"
            onClick={() => {
              setShowDesktopSteps(true);
              setMessage(`After installing, open ${APP_NAME} from Applications or the Dock.`);
            }}
          >
            I’ve installed it
          </button>
        )}
      </div>
    </div>
  );
}
