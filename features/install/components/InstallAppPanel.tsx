"use client";

import { useState } from "react";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import { getInstallPlatformLabel } from "@/features/install/lib/pwa-install";
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
  const platform = getInstallPlatformLabel();

  if (isInstalled) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          {APP_NAME} is installed on this device. Open it from your home screen or Start menu for
          the full-screen experience.
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

      setMessage(
        "Install isn’t available in this browser right now. On Windows, open this site in Chrome or Edge over HTTPS, then try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (needsManualInstallSteps) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          Add {APP_NAME} to your {platform} Home Screen for a full-screen app experience.
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

        <div className="onboarding-payment-screen__actions">
          {showSkip ? (
            <button
              type="button"
              className="onboarding-payment-screen__back"
              onClick={onSkip}
              disabled={busy}
            >
              {skipLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={cn(
              "auth-screen__cta",
              showSkip && "onboarding-payment-screen__cta",
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
            Tip: Install only works from Safari on iPhone and iPad — not from Chrome.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("install-app-panel", className)}>
      <p className="install-app-panel__lede">
        Install {APP_NAME} on {platform} for quicker launch and a chrome-free scoring screen.
      </p>

      {message ? <p className="auth-screen__message">{message}</p> : null}

      <div className="onboarding-payment-screen__actions">
        {showSkip ? (
          <button
            type="button"
            className="onboarding-payment-screen__back"
            onClick={onSkip}
            disabled={busy}
          >
            {skipLabel}
          </button>
        ) : null}
        <button
          type="button"
          className={cn(
            "auth-screen__cta",
            showSkip && "onboarding-payment-screen__cta",
            !showSkip && "install-app-panel__cta-solo",
          )}
          disabled={busy || (!isInstallAvailable && variant === "settings")}
          onClick={() => void handleNativeInstall()}
        >
          {busy ? "Opening installer…" : `Install ${APP_NAME}`}
        </button>
      </div>

      {variant === "settings" && !isInstallAvailable ? (
        <p className="install-app-panel__hint">
          Use Chrome or Edge on Windows (production HTTPS). When install is ready, this button
          activates automatically.
        </p>
      ) : null}

      {variant === "onboarding" && !isInstallAvailable ? (
        <p className="install-app-panel__hint">
          If Install isn’t ready yet, tap Not now and install later from Settings → Install app.
        </p>
      ) : null}
    </div>
  );
}
