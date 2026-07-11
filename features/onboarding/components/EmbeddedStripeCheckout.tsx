"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe/env";

interface StripeEmbeddedCheckout {
  mount: (element: string | HTMLElement) => void;
  destroy: () => void;
}

type StripeWithEmbeddedCheckout = Awaited<ReturnType<typeof loadStripe>> & {
  initEmbeddedCheckout: (options: {
    clientSecret: string;
  }) => Promise<StripeEmbeddedCheckout>;
};

interface EmbeddedStripeCheckoutProps {
  planId: string;
  couponCode?: string | null;
}

export function EmbeddedStripeCheckout({ planId, couponCode }: EmbeddedStripeCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const mountCheckout = async () => {
      if (!containerRef.current || !STRIPE_PUBLISHABLE_KEY) {
        setError("Stripe is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            couponCode: couponCode ?? null,
            embedded: true,
          }),
        });

        const payload = (await response.json()) as {
          clientSecret?: string;
          error?: string;
        };

        if (!response.ok || !payload.clientSecret) {
          throw new Error(payload.error ?? "Unable to load payment form.");
        }

        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);

        if (!stripe || cancelled || !containerRef.current) {
          return;
        }

        checkoutRef.current?.destroy();
        checkoutRef.current = await (
          stripe as StripeWithEmbeddedCheckout
        ).initEmbeddedCheckout({
          clientSecret: payload.clientSecret,
        });

        if (cancelled || !containerRef.current) {
          checkoutRef.current?.destroy();
          checkoutRef.current = null;
          return;
        }

        checkoutRef.current.mount(containerRef.current);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load payment form.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void mountCheckout();

    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [couponCode, planId]);

  return (
    <div className="onboarding-payment-screen__embedded">
      {loading ? (
        <p className="onboarding-payment-screen__stripe-copy">Loading secure payment form…</p>
      ) : null}
      {error ? <p className="auth-screen__error">{error}</p> : null}
      <div ref={containerRef} className="onboarding-payment-screen__embedded-checkout" />
    </div>
  );
}
