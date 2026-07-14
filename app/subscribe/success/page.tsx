"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthBrandLogo } from "@/features/auth/components/AuthBrandLogo";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { SubscribeOnboardingLoading } from "@/features/onboarding/components/SubscribeOnboardingFrame";
import { InstallAppPanel } from "@/features/install/components/InstallAppPanel";
import { usePwaInstall } from "@/components/providers/PwaInstallProvider";
import { APP_NAME } from "@/lib/theme";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { waitForSubscriptionActive } from "@/lib/subscription/wait-for-active";

function SubscribeSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const subscriptionId = searchParams.get("subscription_id");
  const { isInstalled } = usePwaInstall();
  const [ready, setReady] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [showInstallStep, setShowInstallStep] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncAndPoll = async () => {
      const { active } = await waitForSubscriptionActive(
        {
          subscriptionId,
          sessionId,
        },
        {
          maxAttempts: 30,
          intervalMs: 1500,
        },
      );

      if (!cancelled && active) {
        setSubscriptionActive(true);
      }
    };

    void syncAndPoll();

    return () => {
      cancelled = true;
    };
  }, [sessionId, subscriptionId]);

  useEffect(() => {
    if (subscriptionActive && !isInstalled) {
      setShowInstallStep(true);
    }
  }, [subscriptionActive, isInstalled]);

  const continueToApp = async () => {
    setContinueError(null);
    setContinuing(true);

    try {
      const { active, error } = await waitForSubscriptionActive(
        {
          subscriptionId,
          sessionId,
        },
        {
          maxAttempts: 10,
          intervalMs: 1000,
        },
      );

      if (!active) {
        setContinueError(error ?? "Your subscription is still being confirmed.");
        return;
      }

      window.location.assign(APP_HOME_PATH);
    } finally {
      setContinuing(false);
    }
  };

  if (!ready) {
    return <SubscribeOnboardingLoading />;
  }

  const onInstallFlowDone = () => {
    void continueToApp();
  };

  return (
    <AuthShell wide>
      <AuthBrandLogo />

      <h1 className="auth-screen__title auth-screen__title--solo auth-screen__title--spaced">
        {showInstallStep && subscriptionActive && !isInstalled
          ? `Install ${APP_NAME}`
          : "You're all set."}
      </h1>

      <div className="auth-screen__card onboarding-success-screen__card">
        {!subscriptionActive ? (
          <>
            <p className="onboarding-screen__status">
              Your subscription is being confirmed. This usually takes just a few seconds.
            </p>
            {continueError ? <p className="auth-screen__error">{continueError}</p> : null}
            <button type="button" className="auth-screen__cta" disabled>
              Confirming subscription…
            </button>
          </>
        ) : showInstallStep && !isInstalled ? (
          <>
            <p className="onboarding-screen__status onboarding-screen__status--start">
              Your subscription is active. Add {APP_NAME} to your Home Screen for the best
              scoring experience.
            </p>
            {continueError ? <p className="auth-screen__error">{continueError}</p> : null}
            <InstallAppPanel
              showSkip
              skipLabel={continuing ? "Opening app…" : "Not now"}
              onSkip={() => {
                if (!continuing) {
                  void continueToApp();
                }
              }}
              onInstalled={onInstallFlowDone}
            />
          </>
        ) : (
          <>
            <p className="onboarding-screen__status">Your subscription is active.</p>
            {continueError ? <p className="auth-screen__error">{continueError}</p> : null}
            <button
              type="button"
              className="auth-screen__cta"
              disabled={continuing}
              onClick={() => void continueToApp()}
            >
              {continuing ? "Opening app…" : "Continue to app"}
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <SubscribeSuccessContent />
    </Suspense>
  );
}
