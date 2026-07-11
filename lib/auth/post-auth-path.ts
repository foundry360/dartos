import { getSafeNextPath, APP_HOME_PATH, SUBSCRIBE_PATH } from "@/lib/auth/routes";
import { isSubscriptionEnforcementEnabled } from "@/lib/subscription/access";

export function getPostAuthDestination(
  next: string | null | undefined,
): string {
  const fallback = isSubscriptionEnforcementEnabled() ? SUBSCRIBE_PATH : APP_HOME_PATH;
  return getSafeNextPath(next, fallback);
}
