export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due"]);

export function isActiveSubscriptionStatus(status: string): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}
