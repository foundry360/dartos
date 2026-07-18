import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapManagedPlayerRowsToCards,
  type LeagueMemberCardSourceRow,
  type LeagueMemberProfileCard,
} from "@/features/leagues/lib/league-member-profile-card";
import type { Database, LeaguePlayerRow } from "@/lib/supabase/database.types";
import { fetchMyLeagues } from "@/lib/supabase/queries/leagues";

const LEAGUE_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MANAGED_PLAYER_CARD_SELECT = `
  id,
  league_id,
  first_name,
  last_name,
  nickname,
  color,
  avatar_url,
  team_id,
  team_name,
  status,
  saved_player_id,
  profile_user_id,
  created_at,
  league_teams (
    id,
    name,
    color
  ),
  league:leagues!inner (
    id,
    name,
    game_format,
    season:seasons (
      id,
      name
    )
  )
` as const;

type ManagedPlayerCardQueryRow = LeaguePlayerRow & {
  league_teams?: { id: string; name: string; color: string } | null;
  league?:
    | {
        id: string;
        name: string;
        game_format: string | null;
        season?:
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
      }
    | {
        id: string;
        name: string;
        game_format: string | null;
        season?:
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
      }[]
    | null;
};

function normalizeSourceRow(
  row: ManagedPlayerCardQueryRow,
): LeagueMemberCardSourceRow | null {
  const league = Array.isArray(row.league) ? row.league[0] : row.league;
  if (!league) {
    return null;
  }

  const season = Array.isArray(league.season)
    ? league.season[0]
    : league.season;
  const team = row.league_teams;

  return {
    id: row.id,
    leagueId: row.league_id,
    firstName: row.first_name,
    lastName: row.last_name,
    nickname: row.nickname,
    color: row.color,
    avatarUrl: row.avatar_url,
    teamName: team?.name ?? row.team_name,
    status: row.status,
    savedPlayerId: row.saved_player_id,
    profileUserId: row.profile_user_id,
    createdAt: row.created_at,
    leagueName: league.name,
    gameFormat: league.game_format,
    seasonName: season?.name ?? null,
  };
}

/** Roster players across leagues the signed-in director can manage (org RLS). */
export async function fetchManagedLeagueMemberCards(
  supabase: SupabaseClient<Database>,
): Promise<LeagueMemberProfileCard[]> {
  const leagues = await fetchMyLeagues(supabase);
  const leagueIds = [
    ...new Set(
      leagues
        .map((entry) => entry.league.id)
        .filter((id) => LEAGUE_ID_UUID_RE.test(id)),
    ),
  ];

  if (leagueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("league_players")
    .select(MANAGED_PLAYER_CARD_SELECT)
    .in("league_id", leagueIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const sourceRows: LeagueMemberCardSourceRow[] = [];

  for (const row of data ?? []) {
    const mapped = normalizeSourceRow(row as ManagedPlayerCardQueryRow);
    if (mapped) {
      sourceRows.push(mapped);
    }
  }

  return mapManagedPlayerRowsToCards(sourceRows);
}

export async function fetchManagedLeagueMemberCardById(
  supabase: SupabaseClient<Database>,
  cardId: string,
): Promise<LeagueMemberProfileCard | null> {
  const trimmed = cardId.trim();
  if (!trimmed) {
    return null;
  }

  const cards = await fetchManagedLeagueMemberCards(supabase);
  return cards.find((card) => card.id === trimmed) ?? null;
}
