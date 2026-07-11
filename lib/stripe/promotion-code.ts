import type Stripe from "stripe";
import { normalizeCouponCode } from "@/features/onboarding/lib/subscription-coupons";

export async function findStripePromotionCodeId(
  stripe: Stripe,
  rawCode: string,
): Promise<string | null> {
  const code = normalizeCouponCode(rawCode);

  if (!code) {
    return null;
  }

  const promotionCodes = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });

  return promotionCodes.data[0]?.id ?? null;
}
