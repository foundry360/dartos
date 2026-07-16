import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";

export interface LeagueStandingRow {
  id: string;
  rank: number;
  name: string;
  kind: "player" | "team";
  color: string;
  avatarUrl: string | null;
  played: number;
  wins: number;
  losses: number;
  points: number;
  winPercent: number;
  legDiff: number;
  streak: string;
}

const POINTS_PER_WIN = 2;

function formatStreak(recent: Array<{ result: "W" | "L" }>): string {
  if (recent.length === 0) {
    return "—";
  }

  const first = recent[0]!.result;
  let count = 0;

  for (const entry of recent) {
    if (entry.result !== first) {
      break;
    }
    count += 1;
  }

  return `${first}${count}`;
}

function compareStandings(a: LeagueStandingRow, b: LeagueStandingRow): number {
  return (
    b.points - a.points ||
    b.winPercent - a.winPercent ||
    b.legDiff - a.legDiff ||
    b.wins - a.wins ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

function toStandingRow(input: {
  id: string;
  name: string;
  kind: "player" | "team";
  color: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  played?: number;
  legDiff?: number;
  streak?: string;
}): LeagueStandingRow {
  const wins = Math.max(0, input.wins);
  const losses = Math.max(0, input.losses);
  const played = input.played ?? wins + losses;
  const points = wins * POINTS_PER_WIN;
  const winPercent = played > 0 ? (wins / played) * 100 : 0;

  return {
    id: input.id,
    rank: 0,
    name: input.name,
    kind: input.kind,
    color: input.color,
    avatarUrl: input.avatarUrl,
    played,
    wins,
    losses,
    points,
    winPercent,
    legDiff: input.legDiff ?? wins - losses,
    streak: input.streak ?? "—",
  };
}

export function buildSinglesStandings(
  players: LeaguePlayer[],
): LeagueStandingRow[] {
  const rows = players
    .filter((player) => player.leagueStatus !== "inactive")
    .map((player) =>
      toStandingRow({
        id: player.id,
        name: leaguePlayerDisplayName(player),
        kind: "player",
        color: player.color,
        avatarUrl: player.avatarUrl,
        wins: player.wins,
        losses: player.losses,
        played: player.matchesPlayed || player.wins + player.losses,
        streak: formatStreak(player.recentMatches),
      }),
    )
    .sort(compareStandings);

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function buildTeamStandings(teams: LeagueTeam[]): LeagueStandingRow[] {
  const rows = teams
    .filter((team) => team.status === "active")
    .map((team) =>
      toStandingRow({
        id: team.id,
        name: team.name,
        kind: "team",
        color: team.color,
        avatarUrl: null,
        wins: team.wins,
        losses: team.losses,
        played: team.wins + team.losses,
      }),
    )
    .sort(compareStandings);

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function formatWinPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export function formatLegDiff(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
