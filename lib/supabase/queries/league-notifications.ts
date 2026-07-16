import { formatLeagueDate } from "@/features/leagues/lib/league-formats";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function buildLeagueRegistrationAnnouncement(input: {
  leagueId: string;
  leagueName: string;
  startsAt: string | null | undefined;
}): {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
} {
  const name = input.leagueName.trim() || "a league";
  const startLabel = formatLeagueDate(input.startsAt);

  return {
    title: `Added to ${name}`,
    body: startLabel
      ? `You’re registered for ${name}. The season starts ${startLabel}.`
      : `You’re registered for ${name}.`,
    ctaLabel: "View league",
    ctaHref: `/leagues/league/${input.leagueId}`,
  };
}

/** Notify a Vector user they were registered on a league (no-op if already sent). */
export async function notifyLeaguePlayerRegistered(
  supabase: SupabaseClient<Database>,
  input: {
    leagueId: string;
    profileUserId: string;
    leagueName: string;
    startsAt: string | null | undefined;
  },
): Promise<void> {
  const message = buildLeagueRegistrationAnnouncement({
    leagueId: input.leagueId,
    leagueName: input.leagueName,
    startsAt: input.startsAt,
  });

  const { error } = await supabase.rpc("notify_league_player_registered", {
    p_league_id: input.leagueId,
    p_user_id: input.profileUserId,
    p_title: message.title,
    p_body: message.body,
    p_cta_label: message.ctaLabel,
    p_cta_href: message.ctaHref,
  });

  if (error) {
    throw error;
  }
}

export async function notifyLeaguePlayerRegisteredSafe(
  supabase: SupabaseClient<Database>,
  input: {
    leagueId: string;
    profileUserId: string | null | undefined;
    leagueName?: string | null;
    startsAt?: string | null;
  },
): Promise<void> {
  const profileUserId = input.profileUserId?.trim();

  if (!profileUserId) {
    return;
  }

  let leagueName = input.leagueName?.trim() || "";
  let startsAt = input.startsAt ?? null;

  if (!leagueName) {
    const { data, error } = await supabase
      .from("leagues")
      .select("name, starts_at")
      .eq("id", input.leagueId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load league for registration notice", error);
      return;
    }

    if (!data) {
      return;
    }

    leagueName = data.name;
    startsAt = data.starts_at;
  }

  try {
    await notifyLeaguePlayerRegistered(supabase, {
      leagueId: input.leagueId,
      profileUserId,
      leagueName,
      startsAt,
    });
  } catch (caught) {
    console.error("Failed to send league registration notice", caught);
  }
}
