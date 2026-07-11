import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/database.types";
import type { PaymentMethodType } from "@/types/wallet";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";

function mapStripePaymentMethodType(type: string): PaymentMethodType {
  if (type === "card" || type === "us_bank_account" || type === "link") {
    return type;
  }

  return "card";
}

function resolveDefaultPaymentMethodId(
  customer: Stripe.Customer,
  subscriptions: Stripe.Subscription[],
): string | null {
  const activeSubscription = subscriptions.find((subscription) =>
    isActiveSubscriptionStatus(subscription.status),
  );

  const subscriptionDefault = activeSubscription?.default_payment_method;

  if (typeof subscriptionDefault === "string") {
    return subscriptionDefault;
  }

  if (subscriptionDefault && typeof subscriptionDefault === "object") {
    return subscriptionDefault.id;
  }

  const customerDefault = customer.invoice_settings?.default_payment_method;

  if (typeof customerDefault === "string") {
    return customerDefault;
  }

  if (customerDefault && typeof customerDefault === "object") {
    return customerDefault.id;
  }

  return null;
}

function isMissingActiveColumnError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message?.toLowerCase().includes("is_active"));
}

export async function syncPaymentMethodsForCustomer(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  stripeCustomerId: string,
) {
  const customer = await stripe.customers.retrieve(stripeCustomerId);

  if (customer.deleted) {
    return;
  }

  const [paymentMethods, subscriptions] = await Promise.all([
    stripe.paymentMethods.list({
      customer: stripeCustomerId,
      limit: 10,
    }),
    stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 5,
    }),
  ]);

  let defaultPaymentMethodId = resolveDefaultPaymentMethodId(customer, subscriptions.data);

  if (!defaultPaymentMethodId && paymentMethods.data.length === 1) {
    defaultPaymentMethodId = paymentMethods.data[0]?.id ?? null;
  }

  const stripePaymentMethodIds = new Set<string>();

  for (const paymentMethod of paymentMethods.data) {
    stripePaymentMethodIds.add(paymentMethod.id);

    const card = paymentMethod.card;
    const bankAccount = paymentMethod.us_bank_account;

    const baseRow = {
      user_id: userId,
      stripe_payment_method_id: paymentMethod.id,
      stripe_customer_id: stripeCustomerId,
      type: mapStripePaymentMethodType(paymentMethod.type),
      brand: card?.brand ?? null,
      last4: card?.last4 ?? bankAccount?.last4 ?? null,
      exp_month: card?.exp_month ?? null,
      exp_year: card?.exp_year ?? null,
      is_default: paymentMethod.id === defaultPaymentMethodId,
    };

    let { error } = await admin.from("payment_methods").upsert(
      {
        ...baseRow,
        is_active: true,
      },
      { onConflict: "stripe_payment_method_id" },
    );

    if (error && isMissingActiveColumnError(error)) {
      ({ error } = await admin.from("payment_methods").upsert(baseRow, {
        onConflict: "stripe_payment_method_id",
      }));
    }

    if (error) {
      throw error;
    }
  }

  if (defaultPaymentMethodId) {
    let defaultUpdateError = (
      await admin
        .from("payment_methods")
        .update({ is_default: false, is_active: true })
        .eq("user_id", userId)
        .neq("stripe_payment_method_id", defaultPaymentMethodId)
    ).error;

    if (defaultUpdateError && isMissingActiveColumnError(defaultUpdateError)) {
      defaultUpdateError = (
        await admin
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId)
          .neq("stripe_payment_method_id", defaultPaymentMethodId)
      ).error;
    }

    if (defaultUpdateError) {
      throw defaultUpdateError;
    }

    let activeDefaultError = (
      await admin
        .from("payment_methods")
        .update({ is_default: true, is_active: true })
        .eq("user_id", userId)
        .eq("stripe_payment_method_id", defaultPaymentMethodId)
    ).error;

    if (activeDefaultError && isMissingActiveColumnError(activeDefaultError)) {
      activeDefaultError = (
        await admin
          .from("payment_methods")
          .update({ is_default: true })
          .eq("user_id", userId)
          .eq("stripe_payment_method_id", defaultPaymentMethodId)
      ).error;
    }

    if (activeDefaultError) {
      throw activeDefaultError;
    }
  }

  const { data: existingRows, error: existingError } = await admin
    .from("payment_methods")
    .select("stripe_payment_method_id")
    .eq("user_id", userId);

  if (existingError) {
    throw existingError;
  }

  const removedPaymentMethodIds = (existingRows ?? [])
    .map((row) => row.stripe_payment_method_id)
    .filter((paymentMethodId) => !stripePaymentMethodIds.has(paymentMethodId));

  if (removedPaymentMethodIds.length > 0) {
    let deactivateError = (
      await admin
        .from("payment_methods")
        .update({ is_active: false, is_default: false })
        .eq("user_id", userId)
        .in("stripe_payment_method_id", removedPaymentMethodIds)
    ).error;

    if (deactivateError && isMissingActiveColumnError(deactivateError)) {
      deactivateError = (
        await admin
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId)
          .in("stripe_payment_method_id", removedPaymentMethodIds)
      ).error;
    }

    if (deactivateError) {
      throw deactivateError;
    }
  }
}
