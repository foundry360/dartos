import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getSubscriptionPlan, isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";
import type { Database } from "@/lib/supabase/database.types";

const SUBSCRIPTION_SYNC_RETRY_DELAYS_MS = [0, 500, 1000, 1500, 2000, 3000];

function getSubscriptionInterval(
  interval: Stripe.Price.Recurring.Interval | undefined,
): "day" | "week" | "month" | "year" | null {
  if (interval === "day" || interval === "week" || interval === "month" || interval === "year") {
    return interval;
  }

  return null;
}

function resolvePlanName(planId: string | undefined, priceNickname: string | null | undefined): string {
  if (planId === "club" || planId === "elite") {
    return getSubscriptionPlan(planId).name;
  }

  return priceNickname || "Subscription";
}

export async function retrieveSubscriptionForSync(
  stripe: Stripe,
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  let subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice"],
  });

  for (const delay of SUBSCRIPTION_SYNC_RETRY_DELAYS_MS) {
    if (isActiveSubscriptionStatus(subscription.status) || subscription.status !== "incomplete") {
      return subscription;
    }

    if (delay > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }

    subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice"],
    });
  }

  return subscription;
}

export async function upsertSubscriptionFromStripe(
  admin: SupabaseClient<Database>,
  userId: string,
  subscription: Stripe.Subscription,
) {
  const item = subscription.items.data[0];
  const price = item?.price;
  const planId = subscription.metadata.planId;
  const amountCents = price?.unit_amount ?? 0;
  const currency = price?.currency ?? "usd";
  const interval = getSubscriptionInterval(price?.recurring?.interval);
  const periodStart =
    (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start ??
    (item as Stripe.SubscriptionItem & { current_period_start?: number } | undefined)
      ?.current_period_start;
  const periodEnd =
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ??
    (item as Stripe.SubscriptionItem & { current_period_end?: number } | undefined)?.current_period_end;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_price_id: price?.id ?? "unknown",
      plan_name: resolvePlanName(planId, price?.nickname),
      status: subscription.status,
      amount_cents: amountCents,
      currency,
      interval,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    throw error;
  }
}

export async function resolveUserIdForStripeCustomer(
  admin: SupabaseClient<Database>,
  stripeCustomerId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.user_id ?? null;
}
