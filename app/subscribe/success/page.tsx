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
  const subscriptionId = searchParams.get("subscription_id");
  const [ready, setReady] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const syncAndPoll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts += 1;

        try {
          await fetch("/api/subscription/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscriptionId,
              sessionId,
            }),
          });

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

        await new Promise((resolve) => {
          window.setTimeout(resolve, 1500);
        });
      }
    };

    void syncAndPoll();

    return () => {
      cancelled = true;
    };
  }, [sessionId, subscriptionId]);

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

      <div className="auth-screen__card onboarding-success-screen__card">
        <p className="onboarding-screen__status">
          {subscriptionActive
            ? "Your subscription is active."
            : "Your subscription is being confirmed. This usually takes just a few seconds."}
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
