export type SubscriptionPlanId = "club" | "elite" | "league_pro";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceLabel: string;
  intervalLabel: string;
  billingMeta: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "club",
    name: "Club",
    priceLabel: "$4.99",
    intervalLabel: "per month",
    billingMeta: "Billed every month",
    description: "Local play, bot matches, and core scoring.",
    features: [
      "Local and bot play",
      "Unlimited match scoring",
      "Player profiles and stats",
      "Cloud sync across devices",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    priceLabel: "$9.99",
    intervalLabel: "per month",
    billingMeta: "Billed every month",
    description: "Everything in Club, plus league play.",
    features: [
      "Everything in Club",
      "League play",
      "Advanced statistics",
      "Priority voice and features",
    ],
  },
  {
    id: "league_pro",
    name: "League Pro",
    priceLabel: "$25",
    intervalLabel: "per month",
    billingMeta: "Billed every month",
    description: "Run venues, leagues, and seasons — includes Elite.",
    features: [
      "Everything in Elite",
      "League management and venues",
      "Create and manage seasons",
      "Competition admin tools",
    ],
    highlighted: true,
  },
];

export function isSubscriptionPlanId(value: string | null | undefined): value is SubscriptionPlanId {
  return value === "club" || value === "elite" || value === "league_pro";
}

export function getSubscriptionPlan(planId: SubscriptionPlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((entry) => entry.id === planId);
  if (!plan) {
    throw new Error(`Unknown subscription plan: ${planId}`);
  }
  return plan;
}

/** Higher number = higher tier. */
export function getSubscriptionPlanRank(planId: SubscriptionPlanId): number {
  switch (planId) {
    case "club":
      return 1;
    case "elite":
      return 2;
    case "league_pro":
      return 3;
  }
}
