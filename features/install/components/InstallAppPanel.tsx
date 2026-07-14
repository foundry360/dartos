"use client";

import { useState } from "react";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  getDesktopChromiumInstallSteps,
  getInstallPlatformLabel,
  getIosAddToHomeScreenSteps,
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
    const iosSteps = getIosAddToHomeScreenSteps();

    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          Add {APP_NAME} to your {platform} Home Screen for full-screen scoring.
        </p>

        <ol className="install-app-panel__steps">
          {iosSteps.map((step, index) => (
            <li key={step}>
              <span className="install-app-panel__step-index" aria-hidden>
                {index + 1}.
              </span>
              <span className="install-app-panel__step-text">{step}</span>
            </li>
          ))}
        </ol>

        {message ? <p className="auth-screen__message">{message}</p> : null}

        <div className="onboarding-payment-screen__actions install-app-panel__actions install-app-panel__actions--spaced">
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
              onInstalled?.();
            }}
          >
            Already installed
          </button>
        </div>
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
            Already installed
          </button>
        )}
      </div>
    </div>
  );
}
