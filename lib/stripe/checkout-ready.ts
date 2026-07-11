import { isStripeBillingConfigured } from "@/lib/stripe/prices";
import { isStripeConfigured } from "@/lib/stripe/env";

export function isStripeCheckoutReady(): boolean {
  return isStripeConfigured() && isStripeBillingConfigured();
}
