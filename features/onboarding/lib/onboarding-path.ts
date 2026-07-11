import { getSafeNextPath, SUBSCRIBE_CONFIRM_PATH, SUBSCRIBE_PATH, SUBSCRIBE_PAYMENT_PATH } from "@/lib/auth/routes";
import {
  applySubscriptionCoupon,
  normalizeCouponCode,
} from "@/features/onboarding/lib/subscription-coupons";
import {
  getSubscriptionPlan,
  isSubscriptionPlanId,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";

export function buildSubscribeConfirmPath(plan: SubscriptionPlanId): string {
  return `${SUBSCRIBE_CONFIRM_PATH}?plan=${plan}`;
}

export function buildSubscribePaymentPath(
  plan: SubscriptionPlanId,
  coupon?: string | null,
): string {
  const params = new URLSearchParams({ plan });
  const normalizedCoupon = coupon?.trim().toUpperCase();

  if (normalizedCoupon) {
    params.set("coupon", normalizedCoupon);
  }

  return `${SUBSCRIBE_PAYMENT_PATH}?${params.toString()}`;
}

export function buildSubscribePath(plan?: string | null): string {
  if (isSubscriptionPlanId(plan)) {
    return buildSubscribeConfirmPath(plan);
  }

  return SUBSCRIBE_PATH;
}

export function getPlanFromSearchParams(
  searchParams: URLSearchParams | Pick<URLSearchParams, "get">,
): SubscriptionPlanId | null {
  const plan = searchParams.get("plan");
  return isSubscriptionPlanId(plan) ? plan : null;
}

export function getCouponFromSearchParams(
  searchParams: URLSearchParams | Pick<URLSearchParams, "get">,
): string | null {
  return normalizeCouponCode(searchParams.get("coupon"));
}

export function getAppliedCouponFromPlan(
  priceLabel: string,
  couponCode: string | null | undefined,
) {
  if (!couponCode) {
    return null;
  }

  return applySubscriptionCoupon(priceLabel, couponCode);
}

export function getSignUpNextPath(
  searchParams: URLSearchParams | Pick<URLSearchParams, "get">,
): string {
  const explicitNext = searchParams.get("next");
  const plan = getPlanFromSearchParams(searchParams);

  if (explicitNext) {
    return getSafeNextPath(explicitNext, buildSubscribePath(plan));
  }

  return buildSubscribePath(plan);
}

export function getSubscriptionRenewalLabel(planId: SubscriptionPlanId): string {
  const plan = getSubscriptionPlan(planId);
  const renewal = new Date();

  if (plan.intervalLabel.includes("year")) {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else {
    renewal.setMonth(renewal.getMonth() + 1);
  }

  return renewal.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
