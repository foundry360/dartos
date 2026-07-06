import type { User } from "@supabase/supabase-js";
import type { SavedPlayerProfile } from "@/types/player-setup";

export const ACCOUNT_PROFILE_PREFIX = "account-";

export function getAccountProfileId(userId: string) {
  return `${ACCOUNT_PROFILE_PREFIX}${userId}`;
}

export function isAccountProfileId(profileId: string | undefined): profileId is string {
  return Boolean(profileId?.startsWith(ACCOUNT_PROFILE_PREFIX));
}

export function getUserDisplayName(user: User | null, cloudDisplayName?: string | null) {
  if (!user) {
    return "Guest";
  }

  if (cloudDisplayName?.trim()) {
    return cloudDisplayName.trim();
  }

  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  return user.email?.split("@")[0] ?? "Player";
}

export function buildAccountPlayerProfile(input: {
  user: User;
  displayName?: string | null;
  avatarUrl?: string | null;
  color?: string | null;
}): SavedPlayerProfile {
  return {
    id: getAccountProfileId(input.user.id),
    name: getUserDisplayName(input.user, input.displayName),
    nickname: null,
    color: input.color ?? null,
    avatarUrl: input.avatarUrl ?? null,
    isAccountOwner: true,
  };
}
