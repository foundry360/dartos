import type Stripe from "stripe";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";

export function subscriptionHasDefaultPaymentMethod(
  subscription: Stripe.Subscription,
): boolean {
  const defaultPaymentMethod = subscription.default_payment_method;

  if (typeof defaultPaymentMethod === "string" && defaultPaymentMethod) {
    return true;
  }

  return Boolean(defaultPaymentMethod && typeof defaultPaymentMethod === "object");
}

export function subscriptionRequiresPaymentMethodConfirmation(
  subscription: Stripe.Subscription,
): boolean {
  if (subscription.pending_setup_intent) {
    return true;
  }

  if (!isActiveSubscriptionStatus(subscription.status)) {
    return true;
  }

  return !subscriptionHasDefaultPaymentMethod(subscription);
}

export async function resolveSubscriptionPaymentConfirmation(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<{ clientSecret: string; type: "payment" | "setup" } | null> {
  const pendingSetupIntent = subscription.pending_setup_intent;

  if (pendingSetupIntent) {
    const setupIntent =
      typeof pendingSetupIntent === "string"
        ? await stripe.setupIntents.retrieve(pendingSetupIntent)
        : pendingSetupIntent;

    if (setupIntent.client_secret) {
      return { clientSecret: setupIntent.client_secret, type: "setup" };
    }
  }

  const invoice = subscription.latest_invoice;
  const invoiceObject = invoice && typeof invoice !== "string" ? invoice : null;
  const confirmationSecret = invoiceObject?.confirmation_secret?.client_secret;

  if (confirmationSecret) {
    return { clientSecret: confirmationSecret, type: "payment" };
  }

  const legacyPaymentIntent = (
    invoiceObject as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent | string | null;
    } | null
  )?.payment_intent;
  const paymentIntentObject =
    legacyPaymentIntent && typeof legacyPaymentIntent !== "string"
      ? legacyPaymentIntent
      : null;

  if (paymentIntentObject?.client_secret) {
    return { clientSecret: paymentIntentObject.client_secret, type: "payment" };
  }

  return null;
}

export async function ensureSubscriptionPaymentSetupIntent(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  customerId: string,
  userId: string,
): Promise<Stripe.SetupIntent> {
  const existing = await resolveSubscriptionPaymentConfirmation(stripe, subscription);

  if (existing?.type === "setup") {
    const setupIntentId = subscription.pending_setup_intent;

    if (typeof setupIntentId === "string") {
      return stripe.setupIntents.retrieve(setupIntentId);
    }

    if (setupIntentId && typeof setupIntentId === "object") {
      return setupIntentId;
    }
  }

  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: {
      userId,
      subscriptionId: subscription.id,
    },
  });
}
