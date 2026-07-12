import { NextResponse } from "next/server";
import { getSubscriptionPlan, isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { isStripeConfigured } from "@/lib/stripe/env";
import {
  buildAppliedSubscriptionCoupon,
  getPromotionCodeValidationError,
  lookupStripePromotionCode,
} from "@/lib/stripe/promotion-code";
import { getStripeClient } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

interface ValidatePromotionCodeBody {
  planId?: string;
  couponCode?: string | null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const supabase = await createClient();

  if (!stripe || !supabase) {
    return NextResponse.json({ error: "Billing services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: ValidatePromotionCodeBody;

  try {
    body = (await request.json()) as ValidatePromotionCodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isSubscriptionPlanId(body.planId)) {
    return NextResponse.json({ error: "A valid plan is required." }, { status: 400 });
  }

  const couponCode = body.couponCode?.trim();

  if (!couponCode) {
    return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });
  }

  try {
    const promotionCode = await lookupStripePromotionCode(stripe, couponCode);

    if (!promotionCode) {
      return NextResponse.json({ error: "That coupon code is not valid." }, { status: 400 });
    }

    const validationError = getPromotionCodeValidationError(promotionCode);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const plan = getSubscriptionPlan(body.planId);
    const coupon = buildAppliedSubscriptionCoupon(plan.priceLabel, promotionCode);

    if (!coupon) {
      return NextResponse.json({ error: "That coupon code is not valid." }, { status: 400 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to validate coupon code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
