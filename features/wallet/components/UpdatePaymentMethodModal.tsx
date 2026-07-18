"use client";

import {
  loadStripe,
  type Stripe,
  type StripeCardCvcElement,
  type StripeCardExpiryElement,
  type StripeCardNumberElement,
  type StripeElements,
} from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { getWalletApiErrorMessage, postWalletApi } from "@/features/wallet/lib/wallet-api-error";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe/env";

const STRIPE_ELEMENT_STYLE = {
  base: {
    color: "#d4d4d8",
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

interface UpdatePaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function UpdatePaymentMethodModal({
  open,
  onClose,
  onSuccess,
}: UpdatePaymentMethodModalProps) {
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
    if (!open) {
      setNameOnCard("");
      setPostalCode("");
      setError(null);
      setSubmitting(false);
      setElementsReady(false);
      return;
    }

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
  }, [open]);

  const handleSubmit = async () => {
    const stripe = stripeRef.current;
    const cardNumber = cardNumberElementRef.current;

    if (!stripe || !cardNumber || submitting || !open) {
      return;
    }

    if (!nameOnCard.trim()) {
      setError("Enter the name on your card.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const setupPayload = await postWalletApi<{
        clientSecret?: string;
        setupIntentId?: string;
      }>("/api/stripe/payment-method/setup");

      if (!setupPayload.clientSecret || !setupPayload.setupIntentId) {
        throw new Error("Unable to start card update.");
      }

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupPayload.clientSecret,
        {
          payment_method: {
            card: cardNumber,
            billing_details: {
              name: nameOnCard.trim(),
              address: {
                postal_code: postalCode.trim() || undefined,
              },
            },
          },
        },
      );

      if (confirmError) {
        throw new Error(confirmError.message ?? "Card could not be updated.");
      }

      if (setupIntent?.status !== "succeeded" && setupIntent?.status !== "processing") {
        throw new Error("Card could not be updated.");
      }

      await postWalletApi<{ success?: boolean }>("/api/stripe/payment-method/complete", {
        setupIntentId: setupIntent?.id ?? setupPayload.setupIntentId,
      });

      await onSuccess();
      onClose();
    } catch (caught) {
      setError(getWalletApiErrorMessage(caught, "Card could not be updated."));
    } finally {
      setSubmitting(false);
    }
  };

  const inputDisabled = submitting;
  const saveDisabled = submitting || !elementsReady;

  return (
    <BottomSheet
      open={open}
      title="Add payment method"
      onClose={onClose}
      className="profile-edit-modal wallet-payment-modal"
    >
      <div className="profile-edit-modal__body">
        <p className="profile-edit-modal__intro">Enter your new card details.</p>

        <div className="onboarding-payment-screen__fields">
          <div className="auth-screen__field">
            <label className="auth-screen__label" htmlFor="wallet-payment-name">
              Name on card
            </label>
            <div className="auth-screen__field-shell">
              <input
                id="wallet-payment-name"
                className="auth-screen__input auth-screen__input--flush"
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
            <label className="auth-screen__label" htmlFor="wallet-payment-card">
              Card number
            </label>
            <div className="auth-screen__field-shell">
              <div
                id="wallet-payment-card"
                ref={cardNumberRef}
                className="onboarding-payment-screen__stripe-element"
              />
            </div>
          </div>

          <div className="onboarding-payment-screen__field-row">
            <div className="auth-screen__field">
              <label className="auth-screen__label" htmlFor="wallet-payment-exp">
                Expires
              </label>
              <div className="auth-screen__field-shell">
                <div
                  id="wallet-payment-exp"
                  ref={cardExpiryRef}
                  className="onboarding-payment-screen__stripe-element onboarding-payment-screen__stripe-element--flush"
                />
              </div>
            </div>

            <div className="auth-screen__field">
              <label className="auth-screen__label" htmlFor="wallet-payment-cvc">
                CVC
              </label>
              <div className="auth-screen__field-shell">
                <div
                  id="wallet-payment-cvc"
                  ref={cardCvcRef}
                  className="onboarding-payment-screen__stripe-element onboarding-payment-screen__stripe-element--flush"
                />
              </div>
            </div>
          </div>

          <div className="auth-screen__field">
            <label className="auth-screen__label" htmlFor="wallet-payment-zip">
              Zip code
            </label>
            <div className="auth-screen__field-shell">
              <input
                id="wallet-payment-zip"
                className="auth-screen__input auth-screen__input--flush"
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

        {error ? <p className="profile-edit-modal__error">{error}</p> : null}

        <div className="profile-edit-modal__actions">
          <TouchButton variant="secondary" size="lg" onClick={onClose} disabled={submitting}>
            Cancel
          </TouchButton>
          <TouchButton size="lg" disabled={saveDisabled} onClick={() => void handleSubmit()}>
            {submitting ? "Saving…" : "Add card"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
