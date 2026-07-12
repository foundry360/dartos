export interface AppliedSubscriptionCoupon {
  code: string;
  description: string;
  discountLabel: string;
  originalPriceLabel: string;
  finalPriceLabel: string;
}

const PREVIEW_COUPONS: Record<
  string,
  { description: string; apply: (priceCents: number) => { discountCents: number; discountLabel: string } }
> = {
  LAUNCH20: {
    description: "20% off your first month",
    apply: (priceCents) => {
      const discountCents = Math.round(priceCents * 0.2);
      return { discountCents, discountLabel: "20% off" };
    },
  },
  DARTS10: {
    description: "$10 off your first month",
    apply: (priceCents) => {
      const discountCents = Math.min(1000, priceCents);
      return { discountCents, discountLabel: "$10 off" };
    },
  },
  OS100: {
    description: "Free forever",
    apply: (priceCents) => ({
      discountCents: priceCents,
      discountLabel: "100% off",
    }),
  },
};

export function parsePriceLabel(priceLabel: string): number {
  return Math.round(Number.parseFloat(priceLabel.replace(/[^0-9.]/g, "")) * 100);
}

export function formatPriceLabel(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function applySubscriptionCoupon(
  priceLabel: string,
  rawCode: string,
): AppliedSubscriptionCoupon | null {
  const code = rawCode.trim().toUpperCase();
  const coupon = PREVIEW_COUPONS[code];

  if (!coupon) {
    return null;
  }

  const originalCents = parsePriceLabel(priceLabel);
  const { discountCents, discountLabel } = coupon.apply(originalCents);
  const finalCents = Math.max(0, originalCents - discountCents);

  return {
    code,
    description: coupon.description,
    discountLabel,
    originalPriceLabel: priceLabel,
    finalPriceLabel: formatPriceLabel(finalCents),
  };
}

export function normalizeCouponCode(rawCode: string | null | undefined): string | null {
  const code = rawCode?.trim().toUpperCase();
  return code ? code : null;
}
