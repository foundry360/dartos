import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import {
  APP_HOME_PATH,
  getSafeNextPath,
  LEAGUE_MANAGEMENT_PATH,
  SUBSCRIBE_PATH,
} from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import {
  getUserActiveSubscriptionPlan,
  isSubscriptionEnforcementEnabled,
  userHasActiveSubscription,
} from "@/lib/subscription/access";

export function getPostAuthFallbackPath(): string {
  return isSubscriptionEnforcementEnabled() ? SUBSCRIBE_PATH : APP_HOME_PATH;
}

/** Sync destination when the user/plan is not known yet (e.g. sign-up email link). */
export function getPostAuthDestination(
  next: string | null | undefined,
): string {
  return getSafeNextPath(next, getPostAuthFallbackPath());
}

export function getLandingPathForPlan(
  plan: SubscriptionPlanId | null | undefined,
): string {
  if (plan === "league_pro") {
    return LEAGUE_MANAGEMENT_PATH;
  }

  return APP_HOME_PATH;
}

/** Default in-app landing after auth for an authenticated user. */
export async function getDefaultAppLandingPath(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  if (isSubscriptionEnforcementEnabled()) {
    const active = await userHasActiveSubscription(supabase, userId);

    if (!active) {
      return SUBSCRIBE_PATH;
    }
  }

  const plan = await getUserActiveSubscriptionPlan(supabase, userId);
  return getLandingPathForPlan(plan);
}

/** Prefer a safe `next` path; otherwise land by subscription plan. */
export async function resolvePostAuthDestination(
  supabase: SupabaseClient<Database>,
  userId: string,
  next: string | null | undefined,
): Promise<string> {
  const fallback = await getDefaultAppLandingPath(supabase, userId);
  return getSafeNextPath(next, fallback);
}
