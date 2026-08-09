"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { signOut } from "@/features/auth/lib/auth-actions";
import {
  PlanFeatureList,
  SubscribeOnboardingFrame,
  SubscribeOnboardingLoading,
} from "@/features/onboarding/components/SubscribeOnboardingFrame";
import {
  buildSubscribeConfirmPath,
  getPlanFromSearchParams,
} from "@/features/onboarding/lib/onboarding-path";
import { fetchAccountKind, isPlayerAccountKind } from "@/lib/auth/account-kind";
import { PLAYER_HOME_PATH } from "@/lib/auth/routes";
import { requestCheckoutReminderEmailSchedule } from "@/lib/email/request-checkout-reminder-schedule";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";
import {
  getSubscriptionPlan,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

function ChoosePlanScreenForm({ preview }: { preview?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const planFromUrl = getPlanFromSearchParams(searchParams);
  const [hideLeaguePro, setHideLeaguePro] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId | null>(
    planFromUrl === "league_pro" ? null : planFromUrl,
  );
  const [submitting, setSubmitting] = useState(false);

  const availablePlans = useMemo(
    () =>
      hideLeaguePro
        ? SUBSCRIPTION_PLANS.filter((plan) => plan.id !== "league_pro")
        : SUBSCRIPTION_PLANS,
    [hideLeaguePro],
  );

  const selectedPlan = selectedPlanId ? getSubscriptionPlan(selectedPlanId) : null;

  useEffect(() => {
    if (preview || !user) {
      setHideLeaguePro(false);
      return;
    }

    requestCheckoutReminderEmailSchedule();

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void fetchAccountKind(supabase, user.id).then((kind) => {
      setHideLeaguePro(isPlayerAccountKind(kind));
    });
  }, [preview, user]);

  useEffect(() => {
    if (!planFromUrl) {
      return;
    }

    if (hideLeaguePro && planFromUrl === "league_pro") {
      setSelectedPlanId("elite");
      return;
    }

    setSelectedPlanId(planFromUrl);
  }, [hideLeaguePro, planFromUrl]);

  useEffect(() => {
    if (hideLeaguePro && selectedPlanId === "league_pro") {
      setSelectedPlanId("elite");
    }
  }, [hideLeaguePro, selectedPlanId]);

  const handleContinue = () => {
    if (!selectedPlanId) {
      return;
    }

    setSubmitting(true);
    router.push(buildSubscribeConfirmPath(selectedPlanId));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login?mode=sign-up");
    router.refresh();
  };

  const handleBack = async () => {
    // League players upgrading from /player should return to the app, not sign out.
    const supabase = createClient();
    if (supabase && user) {
      const kind = await fetchAccountKind(supabase, user.id);
      if (isPlayerAccountKind(kind)) {
        router.push(PLAYER_HOME_PATH);
        return;
      }
    } else if (hideLeaguePro) {
      router.push(PLAYER_HOME_PATH);
      return;
    }

    await handleSignOut();
  };

  if (!preview && authLoading) {
    return <SubscribeOnboardingLoading />;
  }

  if (!preview && !user) {
    return (
      <AuthShell wide>
        <p className="onboarding-screen__status">Redirecting to sign in…</p>
      </AuthShell>
    );
  }

  const accountEmail = preview ? "you@example.com" : user?.email ?? "";

  return (
    <SubscribeOnboardingFrame
      title="Confirm your plan."
      step="plan"
      accountEmail={accountEmail}
      preview={preview}
      onSignOut={() => void handleSignOut()}
    >
      <div className="auth-screen__card onboarding-plan-screen__card">
        <div className="onboarding-plan-screen__plans" role="radiogroup" aria-label="Subscription plan">
          {availablePlans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;

            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={cn(
                  "onboarding-plan-option",
                  isSelected && "onboarding-plan-option--selected",
                )}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <div className="onboarding-plan-option__left">
                  <span className="onboarding-plan-option__radio" aria-hidden />
                  <div>
                    <p className="onboarding-plan-option__name">{plan.name}</p>
                    <p className="onboarding-plan-option__meta">{plan.billingMeta}</p>
                  </div>
                </div>
                <div className="onboarding-plan-option__price">
                  <strong>{plan.priceLabel}</strong>
                  <span>{plan.intervalLabel}</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="onboarding-plan-screen__trial-note">
          New members get a {SUBSCRIPTION_TRIAL_DAYS}-day free trial. Cancel anytime.
        </p>

        {selectedPlan ? (
          <PlanFeatureList features={selectedPlan.features} />
        ) : (
          <p className="onboarding-plan-screen__select-hint">Select a plan to continue.</p>
        )}

        <div className="onboarding-payment-screen__actions">
          <button
            type="button"
            className="onboarding-payment-screen__back"
            onClick={() => void handleBack()}
          >
            {hideLeaguePro ? "Back to app" : "Back"}
          </button>
          <button
            type="button"
            className="auth-screen__cta onboarding-payment-screen__cta"
            disabled={submitting || !selectedPlanId}
            onClick={handleContinue}
          >
            {submitting ? "Please wait..." : "Continue"}
          </button>
        </div>
      </div>
    </SubscribeOnboardingFrame>
  );
}

export function ChoosePlanScreen() {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <ChoosePlanScreenForm />
    </Suspense>
  );
}

export function ChoosePlanScreenPreview() {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <ChoosePlanScreenForm preview />
    </Suspense>
  );
}
