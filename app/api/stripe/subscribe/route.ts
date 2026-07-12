import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/billing-customer";
import { resolveStripeCustomerName } from "@/lib/stripe/customer-name";
import { isStripeConfigured } from "@/lib/stripe/env";
import { findStripePromotionCodeId } from "@/lib/stripe/promotion-code";
import { getStripePriceIdForPlan, isStripeBillingConfigured } from "@/lib/stripe/prices";
import { getStripeClient } from "@/lib/stripe/server";
import {
  ensureSubscriptionPaymentSetupIntent,
  resolveSubscriptionPaymentConfirmation,
  subscriptionRequiresPaymentMethodConfirmation,
} from "@/lib/stripe/subscription-payment";
import { syncPaymentMethodsForCustomer } from "@/lib/stripe/sync-payment-method";
import { upsertSubscriptionFromStripe } from "@/lib/stripe/sync-subscription";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";
import { userIsTrialEligible } from "@/lib/subscription/trial-eligibility";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface SubscribeRequestBody {
  planId?: string;
  couponCode?: string | null;
  customerName?: string | null;
}

async function buildSubscribePaymentResponse(
  stripe: Stripe,
  admin: NonNullable<Awaited<ReturnType<typeof createAdminClient>>>,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription,
) {
  if (!subscriptionRequiresPaymentMethodConfirmation(subscription)) {
    await upsertSubscriptionFromStripe(admin, userId, subscription);
    await syncPaymentMethodsForCustomer(stripe, admin, userId, customerId);

    return NextResponse.json({ complete: true, subscriptionId: subscription.id });
  }

  let payment = await resolveSubscriptionPaymentConfirmation(stripe, subscription);

  if (!payment && isActiveSubscriptionStatus(subscription.status)) {
    const setupIntent = await ensureSubscriptionPaymentSetupIntent(
      stripe,
      subscription,
      customerId,
      userId,
    );

    if (setupIntent.client_secret) {
      payment = { clientSecret: setupIntent.client_secret, type: "setup" };
    }
  }

  if (!payment) {
    return NextResponse.json({ error: "Unable to start subscription payment." }, { status: 500 });
  }

  return NextResponse.json({
    clientSecret: payment.clientSecret,
    confirmationType: payment.type,
    subscriptionId: subscription.id,
  });
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

    if (body.couponCode?.trim() && !promotionCodeId) {
      return NextResponse.json({ error: "That coupon code is not valid." }, { status: 400 });
    }

    const trialEligible = await userIsTrialEligible(admin, user.id);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
      expand: ["latest_invoice.confirmation_secret", "pending_setup_intent", "default_payment_method"],
      metadata: {
        userId: user.id,
        planId: body.planId,
      },
      ...(trialEligible ? { trial_period_days: SUBSCRIPTION_TRIAL_DAYS } : {}),
      ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
    });

    return buildSubscribePaymentResponse(stripe, admin, user.id, customerId, subscription);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
