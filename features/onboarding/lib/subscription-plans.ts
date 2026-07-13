export type SubscriptionPlanId = "club" | "elite";

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
    description: "Everything you need for league nights and home play.",
    features: [
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
    description: "Advanced tools for serious players and captains.",
    features: [
      "Everything in Club",
      "Advanced statistics",
      "Priority voice and features",
    ],
    highlighted: true,
  },
];

export function isSubscriptionPlanId(value: string | null | undefined): value is SubscriptionPlanId {
  return value === "club" || value === "elite";
}

export function getSubscriptionPlan(planId: SubscriptionPlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((entry) => entry.id === planId);
  if (!plan) {
    throw new Error(`Unknown subscription plan: ${planId}`);
  }
  return plan;
}
