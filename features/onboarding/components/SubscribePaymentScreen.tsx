"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { signOut } from "@/features/auth/lib/auth-actions";
import {
  SubscribeOnboardingFrame,
  SubscribeOnboardingLoading,
} from "@/features/onboarding/components/SubscribeOnboardingFrame";
import {
  buildSubscribeConfirmPath,
  buildSubscribePaymentPath,
  buildSubscribePath,
  getAppliedCouponFromPlan,
  getCouponFromSearchParams,
  getPlanFromSearchParams,
} from "@/features/onboarding/lib/onboarding-path";
import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { useStripeCheckoutReady } from "@/features/onboarding/hooks/useStripeCheckoutReady";
import { CouponCodeField } from "@/features/onboarding/components/CouponCodeField";
import {
  applySubscriptionCoupon,
  type AppliedSubscriptionCoupon,
} from "@/features/onboarding/lib/subscription-coupons";

function CardBrandMarks() {
  return (
    <div className="onboarding-payment-screen__card-brands" aria-hidden>
      <span>VISA</span>
      <span>MC</span>
    </div>
  );
}

function SubscribePaymentScreenForm({
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedSubscriptionCoupon | null>(null);

  const { stripeReady, stripeReadyKnown } = useStripeCheckoutReady();
  const selectedPlan = planId ? getSubscriptionPlan(planId) : null;
  const dueTodayLabel = appliedCoupon?.finalPriceLabel ?? selectedPlan?.priceLabel ?? "";

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    setAppliedCoupon(getAppliedCouponFromPlan(selectedPlan.priceLabel, couponFromUrl));
  }, [couponFromUrl, selectedPlan]);

  useEffect(() => {
    if (preview || planId) {
      return;
    }

    router.replace(buildSubscribePath());
  }, [planId, preview, router]);

  const handleContinue = async () => {
    setMessage(null);
    setSubmitting(true);

    try {
      if (stripeReady) {
        if (!planId) {
          setMessage("Choose a plan before paying.");
          return;
        }

        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            couponCode: appliedCoupon?.code ?? null,
          }),
        });

        const payload = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !payload.url) {
          setMessage(payload.error ?? "Unable to start Stripe Checkout.");
          return;
        }

        window.location.assign(payload.url);
        return;
      }

      router.push(APP_HOME_PATH);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login?mode=sign-up");
    router.refresh();
  };

  const handleApplyCoupon = (code: string) => {
    if (!selectedPlan) {
      return "Choose a plan first.";
    }

    const coupon = applySubscriptionCoupon(selectedPlan.priceLabel, code);
    if (!coupon) {
      setAppliedCoupon(null);
      return "That coupon code is not valid.";
    }

    setAppliedCoupon(coupon);

    if (planId) {
      router.replace(buildSubscribePaymentPath(planId, coupon.code));
    }

    return null;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);

    if (!planId) {
      return;
    }

    router.replace(buildSubscribePaymentPath(planId));
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

  if (!selectedPlan) {
    return <SubscribeOnboardingLoading />;
  }

  const accountEmail = preview ? "you@example.com" : user?.email ?? "";

  return (
    <SubscribeOnboardingFrame
      title="Add your payment."
      step="payment"
      accountEmail={accountEmail}
      preview={preview}
      onSignOut={() => void handleSignOut()}
    >
      <div className="auth-screen__card onboarding-payment-screen__card">
        {!stripeReadyKnown ? (
          <p className="onboarding-payment-screen__stripe-copy">Loading payment options…</p>
        ) : stripeReady ? (
          <p className="onboarding-payment-screen__stripe-copy">
            Payment is completed securely on Stripe. Your card details are never stored in DartScorer.
          </p>
        ) : (
          <div className="onboarding-payment-screen__fields">
          <div className="auth-screen__field">
            <label className="auth-screen__label" htmlFor="payment-name">
              Name on card
            </label>
            <div className="auth-screen__field-shell">
              <svg
                className="auth-screen__field-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
              </svg>
              <input
                id="payment-name"
                className="auth-screen__input"
                type="text"
                placeholder="Name on card"
                autoComplete="cc-name"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="auth-screen__field">
            <label className="auth-screen__label" htmlFor="payment-card">
              Card number
            </label>
            <div className="auth-screen__field-shell">
              <svg
                className="auth-screen__field-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <input
                id="payment-card"
                className="auth-screen__input"
                type="text"
                placeholder="1234 5678 9012 3456"
                autoComplete="cc-number"
                inputMode="numeric"
                disabled={submitting}
              />
              <CardBrandMarks />
            </div>
          </div>

          <div className="onboarding-payment-screen__field-row">
            <div className="auth-screen__field">
              <label className="auth-screen__label" htmlFor="payment-exp">
                Expires
              </label>
              <div className="auth-screen__field-shell">
                <input
                  id="payment-exp"
                  className="auth-screen__input auth-screen__input--flush"
                  type="text"
                  placeholder="MM / YY"
                  autoComplete="cc-exp"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="auth-screen__field">
              <label className="auth-screen__label" htmlFor="payment-cvc">
                CVC
              </label>
              <div className="auth-screen__field-shell">
                <input
                  id="payment-cvc"
                  className="auth-screen__input auth-screen__input--flush"
                  type="text"
                  placeholder="123"
                  autoComplete="cc-csc"
                  disabled={submitting}
                />
                <svg
                  className="onboarding-payment-screen__lock-icon"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="auth-screen__field">
            <label className="auth-screen__label" htmlFor="payment-zip">
              Zip code
            </label>
            <div className="auth-screen__field-shell">
              <svg
                className="auth-screen__field-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
                <circle cx="12" cy="9.5" r="2.3" />
              </svg>
              <input
                id="payment-zip"
                className="auth-screen__input"
                type="text"
                placeholder="32068"
                autoComplete="postal-code"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
        )}

        <CouponCodeField
          disabled={submitting || !stripeReadyKnown}
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
          <span className="onboarding-payment-summary__key">Total due today</span>
          <span className="onboarding-payment-summary__value">{dueTodayLabel}</span>
        </div>

        {message ? <p className="auth-screen__message">{message}</p> : null}

        <div className="onboarding-payment-screen__actions">
          <button
            type="button"
            className="onboarding-payment-screen__back"
            disabled={submitting}
            onClick={() => planId && router.push(buildSubscribeConfirmPath(planId))}
          >
            Back
          </button>
          <button
            type="button"
            className="auth-screen__cta onboarding-payment-screen__cta"
            disabled={submitting || !stripeReadyKnown}
            onClick={() => void handleContinue()}
          >
            {submitting
              ? "Please wait..."
              : stripeReady
                ? `Pay ${dueTodayLabel}`
                : "Continue to app"}
          </button>
        </div>

        <p className="onboarding-payment-screen__lock-note">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Secured with 256-bit encryption
        </p>
      </div>
    </SubscribeOnboardingFrame>
  );
}

export function SubscribePaymentScreen() {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <SubscribePaymentScreenForm />
    </Suspense>
  );
}

export function SubscribePaymentScreenPreview({ plan = "elite" }: { plan?: SubscriptionPlanId }) {
  return (
    <Suspense fallback={<SubscribeOnboardingLoading />}>
      <SubscribePaymentScreenForm preview previewPlan={plan} />
    </Suspense>
  );
}
