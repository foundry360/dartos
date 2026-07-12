import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  fetchBillingCustomerForUser,
  fetchSubscriptionForUser,
} from "@/lib/supabase/queries/wallet";
import { resolveStripeCustomerName } from "@/lib/stripe/customer-name";
import { upsertSubscriptionFromStripe } from "@/lib/stripe/sync-subscription";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";
import type { Database } from "@/lib/supabase/database.types";
import type { BillingCustomer, WalletSubscription } from "@/types/wallet";

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

async function ensureBillingCustomerRecord(
  admin: SupabaseClient<Database>,
  userId: string,
  stripeCustomerId: string,
): Promise<BillingCustomer> {
  const existing = await fetchBillingCustomerForUser(admin, userId);

  if (existing) {
    if (existing.stripeCustomerId !== stripeCustomerId) {
      throw new SubscriptionManagementError("Subscription billing details are out of sync.", 400);
    }

    return existing;
  }

  const { error } = await admin.from("billing_customers").insert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
  });

  if (error) {
    throw error;
  }

  const created = await fetchBillingCustomerForUser(admin, userId);

  if (!created) {
    throw new SubscriptionManagementError("Billing customer not found.", 404);
  }

  return created;
}

async function syncStripeCustomerProfile(
  stripe: Stripe,
  customer: BillingCustomer,
  user: User,
  customerName?: string | null,
) {
  const name = resolveStripeCustomerName(user, customerName);

  await stripe.customers.update(customer.stripeCustomerId, {
    email: user.email ?? undefined,
    ...(name ? { name } : {}),
  });
}

export async function retrieveOwnedStripeSubscription(
  stripe: Stripe,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const subscriptionCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  if (!subscriptionCustomerId) {
    throw new SubscriptionManagementError(
      "This subscription is not linked to a billing customer.",
      400,
    );
  }

  if (subscriptionCustomerId !== stripeCustomerId) {
    throw new SubscriptionManagementError("Subscription not found.", 404);
  }

  return subscription;
}

export async function cancelSubscriptionAtPeriodEnd(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  user: User,
  subscription: WalletSubscription,
) {
  const customer = await ensureBillingCustomerRecord(
    admin,
    userId,
    subscription.stripeCustomerId,
  );

  await syncStripeCustomerProfile(stripe, customer, user);

  const stripeSubscription = await retrieveOwnedStripeSubscription(
    stripe,
    customer.stripeCustomerId,
    subscription.stripeSubscriptionId,
  );

  if (!isActiveSubscriptionStatus(stripeSubscription.status)) {
    throw new SubscriptionManagementError("This subscription can no longer be canceled.", 400);
  }

  if (stripeSubscription.cancel_at_period_end) {
    await upsertSubscriptionFromStripe(admin, userId, stripeSubscription);
    return stripeSubscription;
  }

  const updated = await stripe.subscriptions.update(stripeSubscription.id, {
    cancel_at_period_end: true,
  });

  await upsertSubscriptionFromStripe(admin, userId, updated);

  return updated;
}

export async function resumeSubscription(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  user: User,
  subscription: WalletSubscription,
) {
  const customer = await ensureBillingCustomerRecord(
    admin,
    userId,
    subscription.stripeCustomerId,
  );

  await syncStripeCustomerProfile(stripe, customer, user);

  const stripeSubscription = await retrieveOwnedStripeSubscription(
    stripe,
    customer.stripeCustomerId,
    subscription.stripeSubscriptionId,
  );

  if (!stripeSubscription.cancel_at_period_end) {
    await upsertSubscriptionFromStripe(admin, userId, stripeSubscription);
    return stripeSubscription;
  }

  const updated = await stripe.subscriptions.update(stripeSubscription.id, {
    cancel_at_period_end: false,
  });

  await upsertSubscriptionFromStripe(admin, userId, updated);

  return updated;
}
