"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { SubscribeOnboardingLoading } from "@/features/onboarding/components/SubscribeOnboardingFrame";
import { APP_HOME_PATH } from "@/lib/auth/routes";

function SubscribeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [ready, setReady] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(!sessionId);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!sessionId || subscriptionActive) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      attempts += 1;

      try {
        const response = await fetch("/api/subscription/status");
        const data = (await response.json()) as { active?: boolean };

        if (cancelled) {
          return;
        }

        if (data.active) {
          setSubscriptionActive(true);
          return;
        }
      } catch {
        // Keep polling until attempts are exhausted.
      }

      if (!cancelled && attempts < maxAttempts) {
        window.setTimeout(poll, 1500);
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId, subscriptionActive]);

  const continueToApp = () => {
    router.push(APP_HOME_PATH);
    router.refresh();
  };

  if (!ready) {
    return <SubscribeOnboardingLoading />;
  }

  return (
    <AuthShell wide>
      <div className="auth-screen__brand-row">
        <span className="auth-screen__bullseye" aria-hidden />
        <span className="auth-screen__wordmark">DartScorer</span>
      </div>

      <h1 className="auth-screen__title auth-screen__title--solo auth-screen__title--spaced">
        You&apos;re all set.
      </h1>

      <div className="auth-screen__card onboarding-plan-screen__card">
        <p className="onboarding-screen__status">
          {sessionId && !subscriptionActive
            ? "Your subscription is being confirmed. This usually takes just a few seconds."
            : "Your subscription is active."}
        </p>

        <button
          type="button"
          className="auth-screen__cta"
          disabled={!subscriptionActive}
          onClick={continueToApp}
        >
          {subscriptionActive ? "Continue to app" : "Confirming subscription…"}
        </button>
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
