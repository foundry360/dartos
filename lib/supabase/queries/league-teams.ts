import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateLeagueTeamInput,
  LeagueTeam,
  LeagueTeamStatus,
} from "@/features/leagues/lib/league-teams";
import type { Database, LeagueTeamRow } from "@/lib/supabase/database.types";

const LEAGUE_TEAM_SELECT = `
  id,
  league_id,
  name,
  color,
  status,
  created_by,
  created_at,
  updated_at
` as const;

const TEAM_STATUSES = new Set<LeagueTeamStatus>(["active", "inactive"]);

function asStatus(value: string): LeagueTeamStatus {
  return TEAM_STATUSES.has(value as LeagueTeamStatus)
    ? (value as LeagueTeamStatus)
    : "active";
}

export function mapLeagueTeamRow(
  row: LeagueTeamRow,
  playerCount = 0,
): LeagueTeam {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    status: asStatus(row.status),
    playerCount,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
  };
}

export async function fetchLeagueTeams(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<LeagueTeam[]> {
  const [{ data: teams, error: teamsError }, { data: players, error: playersError }] =
    await Promise.all([
      supabase
        .from("league_teams")
        .select(LEAGUE_TEAM_SELECT)
        .eq("league_id", leagueId)
        .order("created_at", { ascending: true }),
      supabase
        .from("league_players")
        .select("team_id")
        .eq("league_id", leagueId)
        .not("team_id", "is", null),
    ]);

  if (teamsError) {
    throw teamsError;
  }

  if (playersError) {
    throw playersError;
  }

  const counts = new Map<string, number>();

  for (const row of players ?? []) {
    if (!row.team_id) {
      continue;
    }
    counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }

  return (teams ?? []).map((row) =>
    mapLeagueTeamRow(row, counts.get(row.id) ?? 0),
  );
}

export interface CreateLeagueTeamRecordInput extends CreateLeagueTeamInput {
  leagueId: string;
  createdBy: string;
  status?: LeagueTeamStatus;
}

export async function createLeagueTeamRecord(
  supabase: SupabaseClient<Database>,
  input: CreateLeagueTeamRecordInput,
): Promise<LeagueTeam> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Team name is required.");
  }

  const { data, error } = await supabase
    .from("league_teams")
    .insert({
      league_id: input.leagueId,
      name,
      color: input.color?.trim() || "#84C126",
      status: input.status ?? "active",
      created_by: input.createdBy,
    })
    .select(LEAGUE_TEAM_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapLeagueTeamRow(data, 0);
}

export async function updateLeagueTeamRecord(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  teamId: string,
  patch: {
    name?: string;
    color?: string;
    status?: LeagueTeamStatus;
  },
): Promise<LeagueTeam> {
  const update: Database["public"]["Tables"]["league_teams"]["Update"] = {};

  if (patch.name != null) {
    const name = patch.name.trim();
    if (!name) {
      throw new Error("Team name is required.");
    }
    update.name = name;
  }

  if (patch.color != null) {
    update.color = patch.color.trim() || "#84C126";
  }

  if (patch.status != null) {
    update.status = patch.status;
  }

  const { data, error } = await supabase
    .from("league_teams")
    .update(update)
    .eq("id", teamId)
    .eq("league_id", leagueId)
    .select(LEAGUE_TEAM_SELECT)
    .single();

  if (error) {
    throw error;
  }

  if (patch.name != null) {
    const { error: syncError } = await supabase
      .from("league_players")
      .update({ team_name: data.name })
      .eq("league_id", leagueId)
      .eq("team_id", teamId);

    if (syncError) {
      throw syncError;
    }
  }

  const { count, error: countError } = await supabase
    .from("league_players")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId)
    .eq("team_id", teamId);

  if (countError) {
    throw countError;
  }

  return mapLeagueTeamRow(data, count ?? 0);
}

export async function updateLeagueTeamsStatus(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  teamIds: string[],
  status: LeagueTeamStatus,
): Promise<void> {
  if (teamIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("league_teams")
    .update({ status })
    .eq("league_id", leagueId)
    .in("id", teamIds);

  if (error) {
    throw error;
  }
}

export async function deleteLeagueTeams(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  teamIds: string[],
): Promise<void> {
  if (teamIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("league_teams")
    .delete()
    .eq("league_id", leagueId)
    .in("id", teamIds);

  if (error) {
    throw error;
  }
}

/** Find an existing team by name (case-insensitive) or create one. */
export async function findOrCreateLeagueTeam(
  supabase: SupabaseClient<Database>,
  input: {
    leagueId: string;
    createdBy: string;
    name: string;
    color?: string;
  },
): Promise<LeagueTeam> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Team name is required.");
  }

  const existing = await fetchLeagueTeams(supabase, input.leagueId);
  const match = existing.find(
    (team) => team.name.trim().toLowerCase() === name.toLowerCase(),
  );

  if (match) {
    return match;
  }

  return createLeagueTeamRecord(supabase, {
    leagueId: input.leagueId,
    createdBy: input.createdBy,
    name,
    color: input.color,
  });
}
