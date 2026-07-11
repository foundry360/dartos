import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/billing-customer";
import { resolveStripeCustomerName } from "@/lib/stripe/customer-name";
import { isStripeConfigured } from "@/lib/stripe/env";
import { findStripePromotionCodeId } from "@/lib/stripe/promotion-code";
import { getStripePriceIdForPlan, isStripeBillingConfigured } from "@/lib/stripe/prices";
import { getStripeClient } from "@/lib/stripe/server";
import { upsertSubscriptionFromStripe } from "@/lib/stripe/sync-subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface SubscribeRequestBody {
  planId?: string;
  couponCode?: string | null;
  customerName?: string | null;
}

function isActiveSubscriptionStatus(status: Stripe.Subscription.Status) {
  return status === "trialing" || status === "active" || status === "past_due";
}

function resolveSubscriptionClientSecret(subscription: Stripe.Subscription): {
  clientSecret: string;
  type: "payment" | "setup";
} | null {
  const pendingSetupIntent = subscription.pending_setup_intent;

  if (pendingSetupIntent) {
    const setupIntent =
      typeof pendingSetupIntent === "string" ? null : pendingSetupIntent;

    if (setupIntent?.client_secret) {
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

export async function POST(request: Request) {
  if (!isStripeConfigured() || !isStripeBillingConfigured()) {
    return NextResponse.json(
      { error: "Stripe billing is not configured on the server." },
      { status: 503 },
    );
  }

  const stripe = getStripeClient();
  const admin = createAdminClient();
  const supabase = await createClient();

  if (!stripe || !admin || !supabase) {
    return NextResponse.json({ error: "Billing services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: SubscribeRequestBody;

  try {
    body = (await request.json()) as SubscribeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isSubscriptionPlanId(body.planId)) {
    return NextResponse.json({ error: "A valid plan is required." }, { status: 400 });
  }

  const priceId = getStripePriceIdForPlan(body.planId);

  if (!priceId) {
    return NextResponse.json({ error: "Stripe price is not configured for this plan." }, { status: 503 });
  }

  try {
    const customerName = resolveStripeCustomerName(user, body.customerName);
    const customerId = await getOrCreateStripeCustomerId(
      stripe,
      admin,
      user.id,
      user.email,
      customerName,
    );
    const promotionCodeId = body.couponCode
      ? await findStripePromotionCodeId(stripe, body.couponCode)
      : null;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.confirmation_secret", "pending_setup_intent"],
      metadata: {
        userId: user.id,
        planId: body.planId,
      },
      ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
    });

    if (isActiveSubscriptionStatus(subscription.status)) {
      await upsertSubscriptionFromStripe(admin, user.id, subscription);
      return NextResponse.json({ complete: true, subscriptionId: subscription.id });
    }

    const payment = resolveSubscriptionClientSecret(subscription);

    if (!payment) {
      return NextResponse.json({ error: "Unable to start subscription payment." }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: payment.clientSecret,
      confirmationType: payment.type,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
