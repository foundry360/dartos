import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { fetchSubscriptionForUser } from "@/lib/supabase/queries/wallet";
import { upsertSubscriptionFromStripe } from "@/lib/stripe/sync-subscription";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";
import type { Database } from "@/lib/supabase/database.types";
import type { WalletSubscription } from "@/types/wallet";

export class SubscriptionManagementError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SubscriptionManagementError";
    this.status = status;
  }
}

export async function fetchManageableSubscription(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<WalletSubscription> {
  const subscription = await fetchSubscriptionForUser(admin, userId);

  if (!subscription) {
    throw new SubscriptionManagementError("No subscription found.", 404);
  }

  if (!isActiveSubscriptionStatus(subscription.status)) {
    throw new SubscriptionManagementError("This subscription can no longer be managed.", 400);
  }

  return subscription;
}

export async function cancelSubscriptionAtPeriodEnd(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  subscription: WalletSubscription,
) {
  if (subscription.cancelAtPeriodEnd) {
    return subscription;
  }

  const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await upsertSubscriptionFromStripe(admin, userId, updated);

  return updated;
}

export async function resumeSubscription(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  subscription: WalletSubscription,
) {
  if (!subscription.cancelAtPeriodEnd) {
    return subscription;
  }

  const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await upsertSubscriptionFromStripe(admin, userId, updated);

  return updated;
}
