"use client";

import { Suspense, useEffect, useState } from "react";
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
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";
import {
  getSubscriptionPlan,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import { cn } from "@/utils/cn";

function ChoosePlanScreenForm({ preview }: { preview?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const planFromUrl = preview ? null : getPlanFromSearchParams(searchParams);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("elite");
  const [submitting, setSubmitting] = useState(false);

  const selectedPlan = getSubscriptionPlan(selectedPlanId);

  useEffect(() => {
    if (preview || !planFromUrl) {
      return;
    }

    router.replace(buildSubscribeConfirmPath(planFromUrl));
  }, [planFromUrl, preview, router]);

  const handleContinue = () => {
    setSubmitting(true);
    router.push(buildSubscribeConfirmPath(selectedPlanId));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login?mode=sign-up");
    router.refresh();
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

  if (!preview && planFromUrl) {
    return <SubscribeOnboardingLoading />;
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
          {SUBSCRIPTION_PLANS.map((plan) => {
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

        <PlanFeatureList features={selectedPlan.features} />

        <div className="onboarding-payment-screen__actions">
          <button
            type="button"
            className="onboarding-payment-screen__back"
            onClick={() => void handleSignOut()}
          >
            Back
          </button>
          <button
            type="button"
            className="auth-screen__cta onboarding-payment-screen__cta"
            disabled={submitting}
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
