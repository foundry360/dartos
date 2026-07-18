import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLeagueMemberCardId,
  mapManagedPlayerRowsToCards,
  normalizeLeagueMemberCardId,
  type LeagueMemberCardSourceRow,
  type LeagueMemberProfileCard,
} from "@/features/leagues/lib/league-member-profile-card";
import type { Database, LeaguePlayerRow } from "@/lib/supabase/database.types";
import { fetchMyLeagues } from "@/lib/supabase/queries/leagues";

const LEAGUE_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Same roster fields as league admin, without nested league joins. */
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
  )
` as const;

type ManagedPlayerCardQueryRow = LeaguePlayerRow & {
  league_teams?: { id: string; name: string; color: string } | null;
};

function toSourceRows(
  rows: ManagedPlayerCardQueryRow[],
  leagueMeta: Map<
    string,
    { leagueName: string; gameFormat: string | null; seasonName: string | null }
  >,
): LeagueMemberCardSourceRow[] {
  const sourceRows: LeagueMemberCardSourceRow[] = [];

  for (const row of rows) {
    const meta = leagueMeta.get(row.league_id);
    if (!meta) {
      continue;
    }

    const team = row.league_teams;
    sourceRows.push({
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
      leagueName: meta.leagueName,
      gameFormat: meta.gameFormat,
      seasonName: meta.seasonName,
    });
  }

  return sourceRows;
}

async function loadManagedSourceRows(
  supabase: SupabaseClient<Database>,
): Promise<LeagueMemberCardSourceRow[]> {
  const leagues = await fetchMyLeagues(supabase);
  const leagueMeta = new Map<
    string,
    { leagueName: string; gameFormat: string | null; seasonName: string | null }
  >();

  for (const entry of leagues) {
    if (!LEAGUE_ID_UUID_RE.test(entry.league.id)) {
      continue;
    }
    leagueMeta.set(entry.league.id, {
      leagueName: entry.league.name,
      gameFormat: entry.league.game_format,
      seasonName: entry.season?.name ?? null,
    });
  }

  const leagueIds = [...leagueMeta.keys()];
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

  return toSourceRows((data ?? []) as ManagedPlayerCardQueryRow[], leagueMeta);
}

/** Roster players across leagues the signed-in director can manage (org RLS). */
export async function fetchManagedLeagueMemberCards(
  supabase: SupabaseClient<Database>,
): Promise<LeagueMemberProfileCard[]> {
  const sourceRows = await loadManagedSourceRows(supabase);
  return mapManagedPlayerRowsToCards(sourceRows);
}

export async function fetchManagedLeagueMemberCardById(
  supabase: SupabaseClient<Database>,
  cardId: string,
): Promise<LeagueMemberProfileCard | null> {
  const trimmed = normalizeLeagueMemberCardId(cardId);
  if (!trimmed) {
    return null;
  }

  const sourceRows = await loadManagedSourceRows(supabase);
  const cards = mapManagedPlayerRowsToCards(sourceRows);

  const exact = cards.find((card) => card.id === trimmed);
  if (exact) {
    return exact;
  }

  // Raw league_player UUID (or legacy links) → owning card.
  if (LEAGUE_ID_UUID_RE.test(trimmed)) {
    const membership = sourceRows.find((row) => row.id === trimmed);
    if (membership) {
      const owningId = buildLeagueMemberCardId({
        profileUserId: membership.profileUserId,
        savedPlayerId: membership.savedPlayerId,
        leaguePlayerId: membership.id,
      });
      return cards.find((card) => card.id === owningId) ?? null;
    }
  }

  return null;
}
