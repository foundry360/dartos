import type Stripe from "stripe";
import {
  formatPriceLabel,
  normalizeCouponCode,
  parsePriceLabel,
  type AppliedSubscriptionCoupon,
} from "@/features/onboarding/lib/subscription-coupons";

type PromotionCodeWithPromotion = Stripe.PromotionCode & {
  promotion?: {
    type?: string;
    coupon?: Stripe.Coupon | string | null;
  } | null;
};

function resolvePromotionCoupon(promotionCode: Stripe.PromotionCode): Stripe.Coupon | null {
  const promotion = (promotionCode as PromotionCodeWithPromotion).promotion;
  const coupon = promotion?.coupon;

  if (!coupon || typeof coupon === "string") {
    return null;
  }

  return coupon;
}

function formatDiscountLabel(coupon: Stripe.Coupon): string {
  if (coupon.percent_off) {
    return `${coupon.percent_off}% off`;
  }

  if (coupon.amount_off) {
    const amount = coupon.amount_off / 100;
    return amount % 1 === 0 ? `$${amount.toFixed(0)} off` : `$${amount.toFixed(2)} off`;
  }

  return "Discount applied";
}

function computeDiscountCents(originalCents: number, coupon: Stripe.Coupon): number {
  if (coupon.percent_off) {
    return Math.round(originalCents * (coupon.percent_off / 100));
  }

  if (coupon.amount_off) {
    return Math.min(coupon.amount_off, originalCents);
  }

  return 0;
}

function resolveCouponDescription(
  promotionCode: Stripe.PromotionCode,
  coupon: Stripe.Coupon,
): string {
  if (promotionCode.metadata?.description) {
    return promotionCode.metadata.description;
  }

  if (coupon.name) {
    return coupon.name;
  }

  if (coupon.percent_off === 100) {
    return "Free subscription";
  }

  if (coupon.duration === "once") {
    return "Discount on your first invoice";
  }

  return "Promotional discount";
}

export function buildAppliedSubscriptionCoupon(
  priceLabel: string,
  promotionCode: Stripe.PromotionCode,
): AppliedSubscriptionCoupon | null {
  const coupon = resolvePromotionCoupon(promotionCode);

  if (!coupon) {
    return null;
  }

  const originalCents = parsePriceLabel(priceLabel);
  const discountCents = computeDiscountCents(originalCents, coupon);
  const finalCents = Math.max(0, originalCents - discountCents);

  return {
    code: promotionCode.code,
    description: resolveCouponDescription(promotionCode, coupon),
    discountLabel: formatDiscountLabel(coupon),
    originalPriceLabel: priceLabel,
    finalPriceLabel: formatPriceLabel(finalCents),
  };
}

export async function lookupStripePromotionCode(
  stripe: Stripe,
  rawCode: string,
): Promise<Stripe.PromotionCode | null> {
  const code = normalizeCouponCode(rawCode);

  if (!code) {
    return null;
  }

  const promotionCodes = await stripe.promotionCodes.list({
    code,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });

  const promotionCode = promotionCodes.data[0];

  if (!promotionCode) {
    return null;
  }

  if (resolvePromotionCoupon(promotionCode)) {
    return promotionCode;
  }

  const promotion = (promotionCode as PromotionCodeWithPromotion).promotion;
  const couponId =
    promotion?.type === "coupon" && typeof promotion.coupon === "string"
      ? promotion.coupon
      : null;

  if (!couponId) {
    return promotionCode;
  }

  const coupon = await stripe.coupons.retrieve(couponId);

  return {
    ...promotionCode,
    promotion: {
      ...promotion,
      coupon,
    },
  } as Stripe.PromotionCode;
}

export function getPromotionCodeValidationError(
  promotionCode: Stripe.PromotionCode,
): string | null {
  if (!promotionCode.active) {
    return "That coupon code is no longer active.";
  }

  if (promotionCode.expires_at && promotionCode.expires_at * 1000 <= Date.now()) {
    return "That coupon code has expired.";
  }

  if (
    promotionCode.max_redemptions !== null &&
    promotionCode.times_redeemed >= promotionCode.max_redemptions
  ) {
    return "That coupon code has already been used the maximum number of times.";
  }

  const coupon = resolvePromotionCoupon(promotionCode);

  if (!coupon) {
    return "That coupon code is not valid.";
  }

  if (!coupon.valid) {
    return "That coupon code is no longer valid.";
  }

  return null;
}

export async function findStripePromotionCodeId(
  stripe: Stripe,
  rawCode: string,
): Promise<string | null> {
  const promotionCode = await lookupStripePromotionCode(stripe, rawCode);

  if (!promotionCode || getPromotionCodeValidationError(promotionCode)) {
    return null;
  }

  return promotionCode.id;
}
