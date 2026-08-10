"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { signOut } from "@/features/auth/lib/auth-actions";
import { CouponCodeField } from "@/features/onboarding/components/CouponCodeField";
import {
  SubscribeOnboardingFrame,
  SubscribeOnboardingLoading,
} from "@/features/onboarding/components/SubscribeOnboardingFrame";
import { validateSubscriptionCoupon } from "@/features/onboarding/lib/validate-subscription-coupon";
import {
  applySubscriptionCoupon,
  type AppliedSubscriptionCoupon,
} from "@/features/onboarding/lib/subscription-coupons";
import {
  buildSubscribeConfirmPath,
  buildSubscribePaymentPath,
  buildSubscribeSuccessPath,
  getAppliedCouponFromPlan,
  getCouponFromSearchParams,
  getFirstChargeLabel,
  getPlanFromSearchParams,
  getSubscriptionRenewalLabel,
  resolveSubscribeDueTodayLabel,
} from "@/features/onboarding/lib/onboarding-path";
import { useTrialEligibility } from "@/features/onboarding/hooks/useTrialEligibility";
import { APP_NAME } from "@/lib/theme";
import { SUBSCRIBE_PATH } from "@/lib/auth/routes";
import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import { getSubscribeConfirmButtonLabel } from "@/lib/subscription/trial";

function ConfirmSubscriptionScreenForm({
  preview,
  previewPlan,
}: {
  preview?: boolean;
  previewPlan?: SubscriptionPlanId;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const planId = preview ? previewPlan ?? getPlanFromSearchParams(searchParams) : getPlanFromSearchParams(searchParams);
  const couponFromUrl = getCouponFromSearchParams(searchParams);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedSubscriptionCoupon | null>(null);
  const { trialEligible, trialDays, noCardTrial, loading: trialLoading } = useTrialEligibility(
    preview,
    planId,
  );

  const selectedPlan = planId ? getSubscriptionPlan(planId) : null;
  const dueTodayLabel = selectedPlan
    ? resolveSubscribeDueTodayLabel(selectedPlan.priceLabel, appliedCoupon, trialEligible)
    : "";

  useEffect(() => {
    if (!selectedPlan || !planId) {
      return;
    }

    if (!couponFromUrl) {
      setAppliedCoupon(null);
      return;
    }

    if (preview) {
      setAppliedCoupon(getAppliedCouponFromPlan(selectedPlan.priceLabel, couponFromUrl));
      return;
    }

    let cancelled = false;

    void validateSubscriptionCoupon(planId, couponFromUrl).then((result) => {
      if (cancelled) {
        return;
      }

      setAppliedCoupon("coupon" in result ? result.coupon : null);
    });

    return () => {
      cancelled = true;
    };
  }, [couponFromUrl, planId, preview, selectedPlan]);

  useEffect(() => {
    if (preview || planId) {
      return;
    }

    router.replace(SUBSCRIBE_PATH);
  }, [planId, preview, router]);

  const handleBack = () => {
    router.push(SUBSCRIBE_PATH);
  };

  const handleConfirm = async () => {
    if (!planId || !termsAccepted) {
      return;
    }

    setError(null);
    setSubmitting(true);

    if (preview) {
      if (noCardTrial) {
        router.push(buildSubscribeSuccessPath("preview_subscription"));
        return;
      }

      router.push(buildSubscribePaymentPath(planId, appliedCoupon?.code));
      return;
    }

    if (trialLoading) {
      setSubmitting(false);
      return;
    }

    if (!noCardTrial) {
      router.push(buildSubscribePaymentPath(planId, appliedCoupon?.code));
      return;
    }

    try {
      const response = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          couponCode: appliedCoupon?.code ?? null,
        }),
      });
      const payload = (await response.json()) as {
        complete?: boolean;
        subscriptionId?: string;
        error?: string;
      };

      if (!response.ok || !payload.complete || !payload.subscriptionId) {
        throw new Error(payload.error ?? "Unable to start your free trial.");
      }

      router.push(buildSubscribeSuccessPath(payload.subscriptionId));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start your free trial.");
      setSubmitting(false);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    if (!selectedPlan || !planId) {
      return "Choose a plan first.";
    }

    if (preview) {
      const coupon = applySubscriptionCoupon(selectedPlan.priceLabel, code);

      if (!coupon) {
        setAppliedCoupon(null);
        return "That coupon code is not valid.";
      }

      setAppliedCoupon(coupon);
      router.replace(buildSubscribeConfirmPath(planId, coupon.code));
      return null;
    }

    const result = await validateSubscriptionCoupon(planId, code);

    if ("error" in result) {
      setAppliedCoupon(null);
      return result.error;
    }

    setAppliedCoupon(result.coupon);
    router.replace(buildSubscribeConfirmPath(planId, result.coupon.code));

    return null;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);

    if (planId) {
      router.replace(buildSubscribeConfirmPath(planId));
    }
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

  if (!selectedPlan || !planId) {
    return <SubscribeOnboardingLoading />;
  }

  const accountEmail = preview ? "you@example.com" : user?.email ?? "";
  const renewalLabel = getSubscriptionRenewalLabel(planId, { trialEligible, trialDays });
  const firstChargeLabel = getFirstChargeLabel(trialEligible, trialDays);

  return (
    <SubscribeOnboardingFrame
      title="Confirm your plan."
      step="confirm"
      accountEmail={accountEmail}
      preview={preview}
      onSignOut={() => void handleSignOut()}
    >
      <div className="auth-screen__card onboarding-confirm-screen__card">
        <div className="onboarding-payment-summary">
          <div className="onboarding-payment-summary__row">
            <span className="onboarding-payment-summary__key">Plan</span>
            <span className="onboarding-payment-summary__value">{APP_NAME} {selectedPlan.name}</span>
          </div>
          <div className="onboarding-payment-summary__row">
            <span className="onboarding-payment-summary__key">Billing cycle</span>
            <span className="onboarding-payment-summary__value">{selectedPlan.billingMeta}</span>
          </div>
          {trialEligible ? (
            <div className="onboarding-payment-summary__row">
              <span className="onboarding-payment-summary__key">Free trial</span>
              <span className="onboarding-payment-summary__value">{trialDays} days</span>
            </div>
          ) : null}
          <div className="onboarding-payment-summary__row">
            <span className="onboarding-payment-summary__key">First charge</span>
            <span className="onboarding-payment-summary__value">{firstChargeLabel}</span>
          </div>
          <div className="onboarding-payment-summary__row">
            <span className="onboarding-payment-summary__key">
              {trialEligible ? "First billing date" : "Next renewal"}
            </span>
            <span className="onboarding-payment-summary__value">{renewalLabel}</span>
          </div>

          <CouponCodeField
            disabled={submitting}
            appliedCoupon={appliedCoupon}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
          />

          {appliedCoupon ? (
            <div className="onboarding-payment-summary__row">
              <span className="onboarding-payment-summary__key">Discount</span>
              <span className="onboarding-payment-summary__value onboarding-payment-summary__value--discount">
                −{appliedCoupon.discountLabel}
              </span>
            </div>
          ) : null}

          <div className="onboarding-payment-summary__row onboarding-payment-summary__row--total">
            <span className="onboarding-payment-summary__key">Due today</span>
            <span className="onboarding-payment-summary__value">{dueTodayLabel}</span>
          </div>
        </div>

        <label className="onboarding-confirm-screen__terms">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="onboarding-confirm-screen__terms-link">
              terms of service
            </Link>{" "}
            and understand this subscription renews automatically until cancelled.
            {noCardTrial
              ? " No payment method is required to start your trial; add a card anytime before it ends."
              : null}
          </span>
        </label>

        {error ? <p className="auth-screen__error">{error}</p> : null}

        <div className="onboarding-payment-screen__actions">
          <button
            type="button"
            className="onboarding-payment-screen__back"
            onClick={handleBack}
            disabled={submitting}
          >
            Back
          </button>
          <button
            type="button"
            className="auth-screen__cta onboarding-payment-screen__cta"
            disabled={submitting || trialLoading || !termsAccepted}
            onClick={() => void handleConfirm()}
          >
            {trialLoading
              ? "Please wait..."
              : getSubscribeConfirmButtonLabel(planId, trialEligible, submitting)}
          </button>
        </div>
      </div>
    </SubscribeOnboardingFrame>
  );
}

export function ConfirmSubscriptionScreen() {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <ConfirmSubscriptionScreenForm />
    </Suspense>
  );
}

export function ConfirmSubscriptionScreenPreview({ plan = "elite" }: { plan?: SubscriptionPlanId }) {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <ConfirmSubscriptionScreenForm preview previewPlan={plan} />
    </Suspense>
  );
}
