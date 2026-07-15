import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSubscriptionPlanRank,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import { SUBSCRIBE_PATH } from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import { isStripeCheckoutReady } from "@/lib/stripe/checkout-ready";
import { getStripePriceIdForPlan } from "@/lib/stripe/prices";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";

export function isSubscriptionEnforcementEnabled(): boolean {
  return isStripeCheckoutReady();
}

export function isSubscribeFlowPath(pathname: string): boolean {
  return pathname === SUBSCRIBE_PATH || pathname.startsWith(`${SUBSCRIBE_PATH}/`);
}

export function resolveSubscriptionPlanId(
  planName: string | null | undefined,
  stripePriceId?: string | null,
): SubscriptionPlanId | null {
  const leagueProPriceId = getStripePriceIdForPlan("league_pro");
  const elitePriceId = getStripePriceIdForPlan("elite");
  const clubPriceId = getStripePriceIdForPlan("club");

  if (leagueProPriceId && stripePriceId && stripePriceId === leagueProPriceId) {
    return "league_pro";
  }

  if (elitePriceId && stripePriceId && stripePriceId === elitePriceId) {
    return "elite";
  }

  if (clubPriceId && stripePriceId && stripePriceId === clubPriceId) {
    return "club";
  }

  const normalized = planName?.trim().toLowerCase().replace(/_/g, " ");

  if (normalized === "league pro" || normalized === "leaguepro") {
    return "league_pro";
  }

  if (normalized === "elite") {
    return "elite";
  }

  if (normalized === "club") {
    return "club";
  }

  return null;
}

export async function userHasActiveSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId);

  if (error) {
    return false;
  }

  return (data ?? []).some((row) => isActiveSubscriptionStatus(row.status));
}

export async function getUserActiveSubscriptionPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SubscriptionPlanId | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, plan_name, stripe_price_id")
    .eq("user_id", userId);

  if (error) {
    return null;
  }

  const activeRows = (data ?? []).filter((row) => isActiveSubscriptionStatus(row.status));
  let highest: SubscriptionPlanId | null = null;

  for (const row of activeRows) {
    const planId = resolveSubscriptionPlanId(row.plan_name, row.stripe_price_id);
    if (!planId) {
      continue;
    }

    if (!highest || getSubscriptionPlanRank(planId) > getSubscriptionPlanRank(highest)) {
      highest = planId;
    }
  }

  return highest;
}

export async function userHasEliteSubscription(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const plan = await getUserActiveSubscriptionPlan(supabase, userId);
  return plan === "elite" || plan === "league_pro";
}

/** League play (compete in leagues) — Elite or League Pro when billing enforcement is on. */
export async function userCanAccessLeaguePlay(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  if (!isSubscriptionEnforcementEnabled()) {
    return true;
  }

  return userHasEliteSubscription(supabase, userId);
}

/** League management (venues/orgs/admin) — League Pro when billing enforcement is on. */
export async function userCanAccessLeagueManagement(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  if (!isSubscriptionEnforcementEnabled()) {
    return true;
  }

  return (await getUserActiveSubscriptionPlan(supabase, userId)) === "league_pro";
}
