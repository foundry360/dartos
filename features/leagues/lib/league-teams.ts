/**
 * League teams view models.
 *
 * Teams live in `league_teams`. Roster players optionally reference a team via
 * `league_players.team_id` (with denormalized `team_name` for display).
 */

export type LeagueTeamStatus = "active" | "inactive";

export interface LeagueTeam {
  id: string;
  name: string;
  color: string;
  status: LeagueTeamStatus;
  playerCount: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

export interface CreateLeagueTeamInput {
  name: string;
  color?: string;
}

export const LEAGUE_TEAM_STATUS_LABEL: Record<LeagueTeamStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const LEAGUE_TEAM_COLORS = [
  "#6F9E24",
  "#68707C",
  "#B8892B",
  "#0EA5E9",
  "#E11D48",
  "#14B8A6",
] as const;

const SAMPLE_TEAM_DEFS = [
  { id: "lt-bull", name: "Bull Chasers", color: "#6F9E24", status: "active" as const },
  { id: "lt-double", name: "Double Trouble", color: "#0EA5E9", status: "active" as const },
  { id: "lt-flight", name: "Flight Club", color: "#B8892B", status: "active" as const },
  { id: "lt-board", name: "Board Kings", color: "#68707C", status: "inactive" as const },
] as const;

/** Stable sample team ids keyed by display name (case-insensitive). */
export const SAMPLE_TEAM_ID_BY_NAME: Record<string, string> = Object.fromEntries(
  SAMPLE_TEAM_DEFS.map((team) => [team.name.toLowerCase(), team.id]),
);

export function leagueTeamRecord(team: { wins: number; losses: number }): string {
  return `${team.wins}-${team.losses}`;
}

export function getSampleLeagueTeams(leagueId: string): LeagueTeam[] {
  const trimmed = leagueId.trim();

  if (!trimmed || !trimmed.startsWith("sample-")) {
    return [];
  }

  // Singles sample leagues have no teams.
  if (trimmed === "sample-league-singles-501") {
    return [];
  }

  const playerCounts: Record<string, number> = {
    "lt-bull": 3,
    "lt-double": 3,
    "lt-flight": 2,
    "lt-board": 0,
  };

  return SAMPLE_TEAM_DEFS.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    status: team.status,
    playerCount: playerCounts[team.id] ?? 0,
    matchesPlayed: team.status === "active" ? 6 : 0,
    wins: team.status === "active" ? 3 : 0,
    losses: team.status === "active" ? 3 : 0,
  }));
}

export function createLeagueTeamFromInput(
  input: CreateLeagueTeamInput,
  colorIndex = 0,
): LeagueTeam {
  const name = input.name.trim();
  const color =
    input.color?.trim() ||
    LEAGUE_TEAM_COLORS[colorIndex % LEAGUE_TEAM_COLORS.length] ||
    "#6F9E24";

  return {
    id: `lt-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    color,
    status: "active",
    playerCount: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
  };
}
