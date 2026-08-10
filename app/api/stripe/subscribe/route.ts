import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  isSubscriptionPlanId,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
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
import { getTrialDaysForPlan, planAllowsNoCardTrial } from "@/lib/subscription/trial";
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

async function createNoCardTrialSubscription(
  stripe: Stripe,
  params: {
    customerId: string;
    priceId: string;
    userId: string;
    planId: SubscriptionPlanId;
    trialDays: number;
    promotionCodeId: string | null;
  },
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    trial_period_days: params.trialDays,
    trial_settings: {
      end_behavior: {
        missing_payment_method: "cancel",
      },
    },
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],
    },
    expand: ["default_payment_method"],
    metadata: {
      userId: params.userId,
      planId: params.planId,
      trialMode: "no_card",
    },
    ...(params.promotionCodeId
      ? { discounts: [{ promotion_code: params.promotionCodeId }] }
      : {}),
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

  const planId = body.planId;
  const priceId = getStripePriceIdForPlan(planId);

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
    const trialDays = getTrialDaysForPlan(planId);
    const noCardTrial = trialEligible && planAllowsNoCardTrial(planId);

    // Club/Elite true no-cost trial: create trialing sub without collecting a card.
    if (noCardTrial) {
      const existingNoCard = (
        await stripe.subscriptions.list({
          customer: customerId,
          status: "trialing",
          limit: 20,
          expand: ["data.default_payment_method"],
        })
      ).data.find((candidate) => {
        const sameUser = candidate.metadata.userId === user.id;
        const isNoCard = candidate.metadata.trialMode === "no_card";
        const clubOrElite =
          candidate.metadata.planId === "club" || candidate.metadata.planId === "elite";
        return sameUser && isNoCard && clubOrElite;
      });

      if (existingNoCard) {
        const itemId = existingNoCard.items.data[0]?.id;
        const currentPriceId = existingNoCard.items.data[0]?.price.id;
        let subscription = existingNoCard;

        if (itemId && currentPriceId !== priceId) {
          subscription = await stripe.subscriptions.update(existingNoCard.id, {
            items: [{ id: itemId, price: priceId }],
            proration_behavior: "none",
            metadata: {
              ...existingNoCard.metadata,
              userId: user.id,
              planId,
              trialMode: "no_card",
            },
            expand: ["default_payment_method"],
          });
        }

        await upsertSubscriptionFromStripe(admin, user.id, subscription);
        return NextResponse.json({ complete: true, subscriptionId: subscription.id });
      }

      const subscription = await createNoCardTrialSubscription(stripe, {
        customerId,
        priceId,
        userId: user.id,
        planId,
        trialDays,
        promotionCodeId,
      });

      await upsertSubscriptionFromStripe(admin, user.id, subscription);
      return NextResponse.json({ complete: true, subscriptionId: subscription.id });
    }

    // League Pro (and any card-required path): reuse open same-price subs on retry.
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
      expand: [
        "data.latest_invoice.confirmation_secret",
        "data.pending_setup_intent",
        "data.default_payment_method",
      ],
    });

    const reusableSubscription = existingSubscriptions.data.find((candidate) => {
      const samePrice = candidate.items.data.some((item) => item.price.id === priceId);
      if (!samePrice) {
        return false;
      }

      if (candidate.status === "incomplete" || candidate.status === "incomplete_expired") {
        return candidate.status === "incomplete";
      }

      if (candidate.status === "trialing" || candidate.status === "active") {
        return subscriptionRequiresPaymentMethodConfirmation(candidate);
      }

      return false;
    });

    const subscription =
      reusableSubscription ??
      (await stripe.subscriptions.create({
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
        expand: [
          "latest_invoice.confirmation_secret",
          "pending_setup_intent",
          "default_payment_method",
        ],
        metadata: {
          userId: user.id,
          planId,
          trialMode: trialEligible ? "card_required" : "none",
        },
        ...(trialEligible ? { trial_period_days: trialDays } : {}),
        ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
      }));

    return buildSubscribePaymentResponse(stripe, admin, user.id, customerId, subscription);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
