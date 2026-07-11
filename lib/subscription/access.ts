import type { SupabaseClient } from "@supabase/supabase-js";
import { SUBSCRIBE_PATH } from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import { isStripeCheckoutReady } from "@/lib/stripe/checkout-ready";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due"]);

export function isSubscriptionEnforcementEnabled(): boolean {
  return isStripeCheckoutReady();
}

export function isSubscribeFlowPath(pathname: string): boolean {
  return pathname === SUBSCRIBE_PATH || pathname.startsWith(`${SUBSCRIBE_PATH}/`);
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

  return (data ?? []).some((row) => ACTIVE_SUBSCRIPTION_STATUSES.has(row.status));
}
