"use client";

import { loadStripe, type Stripe, type StripeCardCvcElement, type StripeCardExpiryElement, type StripeCardNumberElement, type StripeElements } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe/env";

const STRIPE_ELEMENT_STYLE = {
  base: {
    color: "#f4f4f5",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: "14px",
    lineHeight: "20px",
    fontSmoothing: "antialiased",
    "::placeholder": {
      color: "#71717a",
    },
  },
  invalid: {
    color: "#fca5a5",
  },
};

interface CustomStripePaymentFormProps {
  planId: string;
  couponCode?: string | null;
  dueTodayLabel: string;
  disabled?: boolean;
  onBack: () => void;
}

function CardBrandMarks() {
  return (
    <div className="onboarding-payment-screen__card-brands" aria-hidden>
      <span>VISA</span>
      <span>MC</span>
    </div>
  );
}

export function CustomStripePaymentForm({
  planId,
  couponCode,
  dueTodayLabel,
  disabled = false,
  onBack,
}: CustomStripePaymentFormProps) {
  const router = useRouter();
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardExpiryRef = useRef<HTMLDivElement>(null);
  const cardCvcRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const cardNumberElementRef = useRef<StripeCardNumberElement | null>(null);
  const cardExpiryElementRef = useRef<StripeCardExpiryElement | null>(null);
  const cardCvcElementRef = useRef<StripeCardCvcElement | null>(null);

  const [nameOnCard, setNameOnCard] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const clearMountTargets = () => {
      for (const target of [cardNumberRef, cardExpiryRef, cardCvcRef]) {
        if (target.current) {
          target.current.innerHTML = "";
        }
      }
    };

    const mountElements = async () => {
      if (!STRIPE_PUBLISHABLE_KEY || !cardNumberRef.current || !cardExpiryRef.current || !cardCvcRef.current) {
        setError("Stripe is not configured.");
        return;
      }

      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);

      if (!stripe || cancelled) {
        return;
      }

      clearMountTargets();

      stripeRef.current = stripe;
      const elements = stripe.elements();
      elementsRef.current = elements;

      const cardNumber = elements.create("cardNumber", {
        style: STRIPE_ELEMENT_STYLE,
        disableLink: true,
      });
      const cardExpiry = elements.create("cardExpiry", { style: STRIPE_ELEMENT_STYLE });
      const cardCvc = elements.create("cardCvc", { style: STRIPE_ELEMENT_STYLE });

      cardNumberElementRef.current = cardNumber;
      cardExpiryElementRef.current = cardExpiry;
      cardCvcElementRef.current = cardCvc;

      cardNumber.mount(cardNumberRef.current);
      cardExpiry.mount(cardExpiryRef.current);
      cardCvc.mount(cardCvcRef.current);

      if (!cancelled) {
        setElementsReady(true);
      }
    };

    void mountElements();

    return () => {
      cancelled = true;
      setElementsReady(false);
      cardNumberElementRef.current?.destroy();
      cardExpiryElementRef.current?.destroy();
      cardCvcElementRef.current?.destroy();
      cardNumberElementRef.current = null;
      cardExpiryElementRef.current = null;
      cardCvcElementRef.current = null;
      elementsRef.current = null;
      stripeRef.current = null;
      clearMountTargets();
    };
  }, []);

  const handlePay = async () => {
    const stripe = stripeRef.current;
    const cardNumber = cardNumberElementRef.current;

    if (!stripe || !cardNumber || submitting || disabled) {
      return;
    }

    if (!nameOnCard.trim()) {
      setError("Enter the name on your card.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          couponCode: couponCode ?? null,
        }),
      });

      const payload = (await response.json()) as {
        clientSecret?: string;
        confirmationType?: "payment" | "setup";
        complete?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start subscription.");
      }

      if (payload.complete) {
        router.push("/subscribe/success");
        router.refresh();
        return;
      }

      if (!payload.clientSecret) {
        throw new Error("Unable to confirm payment.");
      }

      const billingDetails = {
        name: nameOnCard.trim(),
        address: {
          postal_code: postalCode.trim() || undefined,
        },
      };

      if (payload.confirmationType === "setup") {
        const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
          payload.clientSecret,
          {
            payment_method: {
              card: cardNumber,
              billing_details: billingDetails,
            },
          },
        );

        if (confirmError) {
          throw new Error(confirmError.message ?? "Payment could not be completed.");
        }

        if (setupIntent?.status === "succeeded" || setupIntent?.status === "processing") {
          router.push("/subscribe/success");
          router.refresh();
          return;
        }

        throw new Error("Payment could not be completed.");
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        payload.clientSecret,
        {
          payment_method: {
            card: cardNumber,
            billing_details: billingDetails,
          },
        },
      );

      if (confirmError) {
        throw new Error(confirmError.message ?? "Payment could not be completed.");
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
        router.push("/subscribe/success");
        router.refresh();
        return;
      }

      throw new Error("Payment could not be completed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputDisabled = disabled || submitting;
  const payDisabled = disabled || submitting || !elementsReady;

  return (
    <>
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
              value={nameOnCard}
              onChange={(event) => {
                setNameOnCard(event.target.value);
                setError(null);
              }}
              disabled={inputDisabled}
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
            <div
              id="payment-card"
              ref={cardNumberRef}
              className="onboarding-payment-screen__stripe-element"
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
              <div
                id="payment-exp"
                ref={cardExpiryRef}
                className="onboarding-payment-screen__stripe-element onboarding-payment-screen__stripe-element--flush"
              />
            </div>
          </div>

          <div className="auth-screen__field">
            <label className="auth-screen__label" htmlFor="payment-cvc">
              CVC
            </label>
            <div className="auth-screen__field-shell">
              <div
                id="payment-cvc"
                ref={cardCvcRef}
                className="onboarding-payment-screen__stripe-element onboarding-payment-screen__stripe-element--flush"
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
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
                setError(null);
              }}
              disabled={inputDisabled}
            />
          </div>
        </div>
      </div>

      {error ? <p className="auth-screen__error">{error}</p> : null}

      <div className="onboarding-payment-screen__actions">
        <button
          type="button"
          className="onboarding-payment-screen__back"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="auth-screen__cta onboarding-payment-screen__cta"
          disabled={payDisabled}
          onClick={() => void handlePay()}
        >
          {submitting ? "Please wait..." : `Pay ${dueTodayLabel}`}
        </button>
      </div>
    </>
  );
}
