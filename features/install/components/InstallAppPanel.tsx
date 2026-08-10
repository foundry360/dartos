"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import {
  getDesktopChromiumInstallSteps,
  getInstalledAppLaunchSteps,
  getInstallPlatformLabel,
  getIosAddToHomeScreenSteps,
  isAndroidDevice,
  isAppleMobileDevice,
  isRunningAsInstalledApp,
  supportsNativeInstallPrompt,
} from "@/features/install/lib/pwa-install";
import { APP_NAME } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface InstallAppPanelProps {
  className?: string;
  /**
   * Player install menu: always teach Share → Add to Home Screen on iPhone/iPad,
   * instead of the “open from Home Screen” launch tips.
   */
  preferIosInstallGuide?: boolean;
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

function IosInstallGuide({
  className,
  alreadyInstalled,
}: {
  className?: string;
  alreadyInstalled?: boolean;
}) {
  const platform = getInstallPlatformLabel();

  return (
    <div className={cn("install-app-panel", className)}>
      {alreadyInstalled ? (
        <p className="install-app-panel__lede">
          You’re already using the installed {APP_NAME} app. To add it again (or help
          someone else install it on an {platform}), use Safari and follow these steps:
        </p>
      ) : (
        <p className="install-app-panel__lede">
          Install {APP_NAME} on your {platform} by adding it to your Home Screen.
          Follow every step below — once it’s installed, open it from the Home Screen
          icon for the full-screen app experience.
        </p>
      )}

      <InstallStepsList steps={getIosAddToHomeScreenSteps()} />

      <p className="install-app-panel__hint">
        Tip: After you tap Add, look for the {APP_NAME} icon on your Home Screen
        (swipe left/right between pages if you don’t see it right away).
      </p>
    </div>
  );
}

export function InstallAppPanel({
  className,
  preferIosInstallGuide = false,
}: InstallAppPanelProps) {
  const { isInstalled, isInstallAvailable, needsManualInstallSteps, promptInstall } =
    usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appleMobile, setAppleMobile] = useState(() =>
    typeof window !== "undefined" ? isAppleMobileDevice() : false,
  );
  const [androidDevice, setAndroidDevice] = useState(() =>
    typeof window !== "undefined" ? isAndroidDevice() : false,
  );
  const [runningInstalled, setRunningInstalled] = useState(() =>
    typeof window !== "undefined" ? isRunningAsInstalledApp() : false,
  );
  const platform = getInstallPlatformLabel();
  const installSteps = getDesktopChromiumInstallSteps();
  const canUseNativePrompt = supportsNativeInstallPrompt();

  useEffect(() => {
    setAppleMobile(isAppleMobileDevice());
    setAndroidDevice(isAndroidDevice());
    setRunningInstalled(isRunningAsInstalledApp());
  }, []);

  // Player Install app: iPhone/iPad always get Share → Add to Home Screen.
  // Android must use Chrome install / Add to Home screen steps instead.
  if (preferIosInstallGuide && appleMobile) {
    return (
      <IosInstallGuide className={className} alreadyInstalled={runningInstalled} />
    );
  }

  // Any iPhone/iPad browser session should get the Share guide, not launch tips.
  if (appleMobile && !runningInstalled) {
    return <IosInstallGuide className={className} />;
  }

  if (isInstalled) {
    const launchSteps = getInstalledAppLaunchSteps();

    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          {runningInstalled
            ? `You’re using the installed ${APP_NAME} app on your ${platform}.`
            : `${APP_NAME} is installed on your ${platform}. Open it from here for the full-screen experience:`}
        </p>

        {runningInstalled ? (
          <p className="install-app-panel__hint">To open it again later:</p>
        ) : null}

        <InstallStepsList steps={launchSteps} />
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
    return <IosInstallGuide className={className} />;
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

        <p className="install-app-panel__hint">
          {androidDevice
            ? "Or install from Chrome’s menu (look for Install app / Add to Home screen):"
            : "Or install from Chrome’s menu:"}
        </p>
        <InstallStepsList steps={installSteps} />
      </div>
    );
  }

  if (canUseNativePrompt || androidDevice) {
    return (
      <div className={cn("install-app-panel", className)}>
        <p className="install-app-panel__lede">
          {androidDevice
            ? `Install ${APP_NAME} on your Android phone by adding it to your Home Screen.`
            : `Install ${APP_NAME} as an app on your ${platform}, then add it to your Dock or Desktop.`}
        </p>

        <InstallStepsList steps={installSteps} />
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
