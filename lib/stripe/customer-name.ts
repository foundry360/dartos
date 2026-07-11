import type { User } from "@supabase/supabase-js";

export function resolveStripeCustomerName(
  user: User,
  billingName?: string | null,
): string | undefined {
  const fromBilling = billingName?.trim();

  if (fromBilling) {
    return fromBilling;
  }

  const fromProfile = user.user_metadata?.display_name;

  if (typeof fromProfile === "string" && fromProfile.trim()) {
    return fromProfile.trim();
  }

  return undefined;
}
