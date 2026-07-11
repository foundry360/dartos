import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

const STRIPE_PRICE_CLUB = process.env.STRIPE_PRICE_CLUB?.trim() || "";
const STRIPE_PRICE_ELITE = process.env.STRIPE_PRICE_ELITE?.trim() || "";

export function getStripePriceIdForPlan(planId: SubscriptionPlanId): string | null {
  if (planId === "club") {
    return STRIPE_PRICE_CLUB || null;
  }

  if (planId === "elite") {
    return STRIPE_PRICE_ELITE || null;
  }

  return null;
}

export function isStripeBillingConfigured(): boolean {
  return Boolean(STRIPE_PRICE_CLUB && STRIPE_PRICE_ELITE);
}
