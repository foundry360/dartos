"use client";

import { useState, type ReactNode } from "react";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  getDesktopChromiumInstallSteps,
  getInstallPlatformLabel,
  getIosAddToHomeScreenSteps,
  supportsNativeInstallPrompt,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface InstallAppPanelProps {
  className?: string;
}

function renderInstallStepText(step: string): ReactNode {
  const parts = step.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function InstallStepsList({ steps }: { steps: string[] }) {
  return (
    <ol className="install-app-panel__steps">
      {steps.map((step, index) => (
        <li key={`${index}-${step}`}>
          <span className="install-app-panel__step-index" aria-hidden>
            {index + 1}.
          </span>
          <span className="install-app-panel__step-text">{renderInstallStepText(step)}</span>
        </li>
      ))}
    </ol>
  );
}

export function InstallAppPanel({ className }: InstallAppPanelProps) {
  const { isInstalled, isInstallAvailable, needsManualInstallSteps, promptInstall } =
    usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
      </div>
    );
  }

  const handleNativeInstall = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const outcome = await promptInstall();

      if (outcome === "dismissed") {
        setMessage("Install was cancelled. You can try again anytime.");
      }
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

        <InstallStepsList steps={getIosAddToHomeScreenSteps()} />
      </div>
    );
  }

  if (isInstallAvailable) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          Install {APP_NAME} as an app, then keep it handy on your {platform}.
        </p>

        {message ? <p className="auth-screen__message">{message}</p> : null}

        <button
          type="button"
          className="auth-screen__cta install-app-panel__cta-solo"
          disabled={busy}
          onClick={() => void handleNativeInstall()}
        >
          {busy ? "Opening installer…" : `Install ${APP_NAME}`}
        </button>

        <p className="install-app-panel__hint">Or install from Chrome’s menu:</p>
        <InstallStepsList steps={desktopSteps} />
      </div>
    );
  }

  if (canUseNativePrompt) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          Install {APP_NAME} as an app on your {platform}, then add it to your Dock or Desktop.
        </p>

        <InstallStepsList steps={desktopSteps} />
      </div>
    );
  }

  return (
    <div className={cn("install-app-panel", className)}>
      <p className="install-app-panel__lede">
        Open this site in Chrome or Edge to install {APP_NAME}.
      </p>
    </div>
  );
}
