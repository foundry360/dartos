import type { AppliedSubscriptionCoupon } from "@/features/onboarding/lib/subscription-coupons";
import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

interface ValidateSubscriptionCouponSuccess {
  coupon: AppliedSubscriptionCoupon;
}

interface ValidateSubscriptionCouponFailure {
  error: string;
}

export async function validateSubscriptionCoupon(
  planId: SubscriptionPlanId,
  rawCode: string,
): Promise<ValidateSubscriptionCouponSuccess | ValidateSubscriptionCouponFailure> {
  const response = await fetch("/api/stripe/promotion-code/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId,
      couponCode: rawCode,
    }),
  });

  const payload = (await response.json()) as {
    coupon?: AppliedSubscriptionCoupon;
    error?: string;
  };

  if (!response.ok || !payload.coupon) {
    return { error: payload.error ?? "That coupon code is not valid." };
  }

  return { coupon: payload.coupon };
}
