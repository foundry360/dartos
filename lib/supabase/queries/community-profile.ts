import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CommunityPublicProfile {
  id: string;
  displayName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  throwingHand: string | null;
  skillLevel: string | null;
  preferredGame: string | null;
  homeLeague: string | null;
  memberSince: string | null;
  threeDartAverage: number;
  checkoutPercent: number;
  highestCheckout: number;
  matchesWon: number;
  matchesPlayed: number;
}

type CommunityProfileRow = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  country_code: string | null;
  throwing_hand: string | null;
  skill_level: string | null;
  preferred_game: string | null;
  home_league: string | null;
  member_since: string | null;
  three_dart_average: number | string | null;
  checkout_percent: number | string | null;
  highest_checkout: number | null;
  matches_won: number | null;
  matches_played: number | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapCommunityProfile(row: CommunityProfileRow): CommunityPublicProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    countryCode: row.country_code,
    throwingHand: row.throwing_hand,
    skillLevel: row.skill_level,
    preferredGame: row.preferred_game,
    homeLeague: row.home_league,
    memberSince: row.member_since,
    threeDartAverage: toNumber(row.three_dart_average),
    checkoutPercent: toNumber(row.checkout_percent),
    highestCheckout: row.highest_checkout ?? 0,
    matchesWon: row.matches_won ?? 0,
    matchesPlayed: row.matches_played ?? 0,
  };
}

export async function fetchCommunityProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CommunityPublicProfile | null> {
  if (
    typeof userId !== "string" ||
    userId === "null" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_community_profile", {
    target_user_id: userId,
  });

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as CommunityProfileRow | null | undefined;
  if (!row || !row.id) {
    return null;
  }

  return mapCommunityProfile(row);
}
