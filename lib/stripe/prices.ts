import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

const STRIPE_PRICE_CLUB = process.env.STRIPE_PRICE_CLUB?.trim() || "";
const STRIPE_PRICE_ELITE = process.env.STRIPE_PRICE_ELITE?.trim() || "";
const STRIPE_PRICE_LEAGUE_PRO = process.env.STRIPE_PRICE_LEAGUE_PRO?.trim() || "";

export function getStripePriceIdForPlan(planId: SubscriptionPlanId): string | null {
  if (planId === "club") {
    return STRIPE_PRICE_CLUB || null;
  }

  if (planId === "elite") {
    return STRIPE_PRICE_ELITE || null;
  }

  if (planId === "league_pro") {
    return STRIPE_PRICE_LEAGUE_PRO || null;
  }

  return null;
}

/** Club + Elite prices keep general checkout ready; League Pro is required to sell that tier. */
export function isStripeBillingConfigured(): boolean {
  return Boolean(STRIPE_PRICE_CLUB && STRIPE_PRICE_ELITE);
}

export function isLeagueProPriceConfigured(): boolean {
  return Boolean(STRIPE_PRICE_LEAGUE_PRO);
}
