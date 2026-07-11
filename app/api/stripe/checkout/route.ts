import { NextResponse } from "next/server";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/billing-customer";
import { isStripeConfigured } from "@/lib/stripe/env";
import { findStripePromotionCodeId } from "@/lib/stripe/promotion-code";
import { getStripePriceIdForPlan, isStripeBillingConfigured } from "@/lib/stripe/prices";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface CheckoutRequestBody {
  planId?: string;
  couponCode?: string | null;
  embedded?: boolean;
}

function getOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
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

  let body: CheckoutRequestBody;

  try {
    body = (await request.json()) as CheckoutRequestBody;
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
    const customerId = await getOrCreateStripeCustomerId(stripe, admin, user.id, user.email);
    const origin = getOrigin(request);
    const cancelUrl = new URL("/subscribe/payment", origin);
    cancelUrl.searchParams.set("plan", body.planId);

    if (body.couponCode) {
      cancelUrl.searchParams.set("coupon", body.couponCode.trim().toUpperCase());
    }

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
        planId: body.planId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: body.planId,
        },
      },
    };

    if (body.embedded) {
      Object.assign(sessionParams, {
        ui_mode: "embedded_page" as const,
        return_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      });
    } else {
      sessionParams.success_url = `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;
      sessionParams.cancel_url = cancelUrl.toString();
    }

    const promotionCodeId = body.couponCode
      ? await findStripePromotionCodeId(stripe, body.couponCode)
      : null;

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (body.embedded) {
      if (!session.client_secret) {
        return NextResponse.json({ error: "Unable to load embedded checkout." }, { status: 500 });
      }

      return NextResponse.json({ clientSecret: session.client_secret });
    }

    if (!session.url) {
      return NextResponse.json({ error: "Unable to start Stripe Checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured() && isStripeBillingConfigured(),
    successPath: APP_HOME_PATH,
  });
}
