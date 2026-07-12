import { getSafeNextPath, SUBSCRIBE_CONFIRM_PATH, SUBSCRIBE_PATH, SUBSCRIBE_PAYMENT_PATH, SUBSCRIBE_SUCCESS_PATH } from "@/lib/auth/routes";
import {
  applySubscriptionCoupon,
  normalizeCouponCode,
} from "@/features/onboarding/lib/subscription-coupons";
import { isSubscriptionPlanId, type SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

export {
  getFirstChargeLabel,
  getSubscriptionRenewalLabel,
  resolveSubscribeDueTodayLabel,
} from "@/lib/subscription/trial";

export function buildSubscribeConfirmPath(
  plan: SubscriptionPlanId,
  coupon?: string | null,
): string {
  const params = new URLSearchParams({ plan });
  const normalizedCoupon = coupon?.trim().toUpperCase();

  if (normalizedCoupon) {
    params.set("coupon", normalizedCoupon);
  }

  return `${SUBSCRIBE_CONFIRM_PATH}?${params.toString()}`;
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

export function buildSubscribeSuccessPath(subscriptionId?: string | null): string {
  if (!subscriptionId) {
    return SUBSCRIBE_SUCCESS_PATH;
  }

  const params = new URLSearchParams({ subscription_id: subscriptionId });
  return `${SUBSCRIBE_SUCCESS_PATH}?${params.toString()}`;
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

