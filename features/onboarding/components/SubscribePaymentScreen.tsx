"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { signOut } from "@/features/auth/lib/auth-actions";
import { CustomStripePaymentForm } from "@/features/onboarding/components/CustomStripePaymentForm";
import {
  SubscribeOnboardingFrame,
  SubscribeOnboardingLoading,
} from "@/features/onboarding/components/SubscribeOnboardingFrame";
import {
  buildSubscribeConfirmPath,
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
import type { AppliedSubscriptionCoupon } from "@/features/onboarding/lib/subscription-coupons";

function PreviewPaymentFields({
  submitting,
  onBack,
  onContinue,
}: {
  submitting: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="onboarding-payment-screen__fields">
        <div className="auth-screen__field">
          <label className="auth-screen__label" htmlFor="payment-name">
            Name on card
          </label>
          <div className="auth-screen__field-shell">
            <input
              id="payment-name"
              className="auth-screen__input auth-screen__input--flush"
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
            <input
              id="payment-card"
              className="auth-screen__input auth-screen__input--flush"
              type="text"
              placeholder="1234 5678 9012 3456"
              autoComplete="cc-number"
              inputMode="numeric"
              disabled={submitting}
            />
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
            </div>
          </div>
        </div>

        <div className="auth-screen__field">
          <label className="auth-screen__label" htmlFor="payment-zip">
            Zip code
          </label>
          <div className="auth-screen__field-shell">
            <input
              id="payment-zip"
              className="auth-screen__input auth-screen__input--flush"
              type="text"
              placeholder="32068"
              autoComplete="postal-code"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      <div className="onboarding-payment-screen__actions">
        <button
          type="button"
          className="onboarding-payment-screen__back"
          disabled={submitting}
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="auth-screen__cta onboarding-payment-screen__cta"
          disabled={submitting}
          onClick={onContinue}
        >
          {submitting ? "Please wait..." : "Continue to app"}
        </button>
      </div>
    </>
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

  const handlePreviewContinue = () => {
    setSubmitting(true);
    router.push(APP_HOME_PATH);
    router.refresh();
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
  const backToConfirm = () => router.push(buildSubscribeConfirmPath(planId, appliedCoupon?.code));

  return (
    <SubscribeOnboardingFrame
      title="Add your payment."
      step="payment"
      accountEmail={accountEmail}
      preview={preview}
      onSignOut={() => void handleSignOut()}
    >
      <div className="auth-screen__card onboarding-payment-screen__card">
        {appliedCoupon ? (
          <div className="onboarding-payment-summary__row">
            <span className="onboarding-payment-summary__key">Coupon</span>
            <span className="onboarding-payment-summary__value">{appliedCoupon.code}</span>
          </div>
        ) : null}

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

        {!stripeReadyKnown ? (
          <p className="onboarding-payment-screen__stripe-copy">Loading payment options…</p>
        ) : stripeReady && !preview ? (
          <CustomStripePaymentForm
            planId={planId}
            couponCode={appliedCoupon?.code ?? couponFromUrl}
            dueTodayLabel={dueTodayLabel}
            onBack={backToConfirm}
          />
        ) : (
          <PreviewPaymentFields
            submitting={submitting}
            onBack={backToConfirm}
            onContinue={handlePreviewContinue}
          />
        )}

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
