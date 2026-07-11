"use client";

import { useEffect, useState } from "react";

export function useStripeCheckoutReady() {
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/stripe/checkout");
        const payload = (await response.json()) as { configured?: boolean };

        if (!cancelled) {
          setStripeReady(Boolean(payload.configured));
        }
      } catch {
        if (!cancelled) {
          setStripeReady(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    stripeReady: stripeReady === true,
    stripeReadyKnown: stripeReady !== null,
  };
}
