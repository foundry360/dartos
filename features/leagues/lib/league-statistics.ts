import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import { formatWinPercent } from "@/features/leagues/lib/league-standings";

export type LeagueStatisticsView = "players" | "teams";

export type PlayerStatSortKey =
  | "rank"
  | "name"
  | "matches"
  | "wins"
  | "losses"
  | "winPercent"
  | "average"
  | "streak";

export type TeamStatSortKey =
  | "rank"
  | "name"
  | "matches"
  | "wins"
  | "losses"
  | "winPercent"
  | "legDiff"
  | "streak";

export type StatSortDirection = "asc" | "desc";

export type LeagueAverageMetric = "three_dart" | "mpr" | "mixed";

export interface LeaguePlayerStatRow {
  id: string;
  rank: number;
  name: string;
  color: string;
  avatarUrl: string | null;
  matches: number;
  wins: number;
  losses: number;
  winPercent: number;
  average: number | null;
  streak: string;
}

export interface LeagueTeamStatRow {
  id: string;
  rank: number;
  name: string;
  color: string;
  avatarUrl: string | null;
  matches: number;
  wins: number;
  losses: number;
  winPercent: number;
  legDiff: number;
  streak: string;
}

export function resolveAverageMetric(
  gameFormat: string | null | undefined,
): LeagueAverageMetric {
  const format = (gameFormat || "").trim().toLowerCase();

  if (
    format === "cricket" ||
    format.includes("cricket") ||
    format.includes("tactic")
  ) {
    return "mpr";
  }

  if (format === "custom" || format.includes("mixed")) {
    return "mixed";
  }

  return "three_dart";
}

export function averageMetricLabel(metric: LeagueAverageMetric): string {
  if (metric === "mpr") {
    return "MPR";
  }

  if (metric === "mixed") {
    return "Avg / MPR";
  }

  return "3DA";
}

export function formatAverageMetric(
  value: number | null,
  metric: LeagueAverageMetric,
): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return value.toFixed(2);
}

export function formatStatStreak(recent: Array<{ result: "W" | "L" }>): string {
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

export function hasCompletedMatchStatistics(input: {
  matches: DraftLeagueMatch[];
  players: LeaguePlayer[];
  teams: LeagueTeam[];
}): boolean {
  if (input.matches.some((match) => match.status === "completed")) {
    return true;
  }

  if (
    input.players.some(
      (player) =>
        player.matchesPlayed > 0 || player.wins > 0 || player.losses > 0,
    )
  ) {
    return true;
  }

  return input.teams.some((team) => team.wins > 0 || team.losses > 0);
}

function winPercent(wins: number, matches: number): number {
  return matches > 0 ? (wins / matches) * 100 : 0;
}

/**
 * Player statistics from roster result fields (populated by completed matches).
 * Aggregate from league_matches result payloads here when those fields exist.
 */
export function buildPlayerStatistics(
  players: LeaguePlayer[],
): LeaguePlayerStatRow[] {
  return players
    .filter((player) => player.leagueStatus !== "inactive")
    .map((player) => {
      const matches = player.matchesPlayed || player.wins + player.losses;
      const wins = player.wins;
      const losses = player.losses;

      return {
        id: player.id,
        rank: 0,
        name: leaguePlayerDisplayName(player),
        color: player.color,
        avatarUrl: player.avatarUrl,
        matches,
        wins,
        losses,
        winPercent: winPercent(wins, matches),
        average: player.average,
        streak: formatStatStreak(player.recentMatches),
      };
    });
}

export function buildTeamStatistics(teams: LeagueTeam[]): LeagueTeamStatRow[] {
  return teams
    .filter((team) => team.status === "active")
    .map((team) => {
      const wins = team.wins;
      const losses = team.losses;
      const matches = wins + losses;

      return {
        id: team.id,
        rank: 0,
        name: team.name,
        color: team.color,
        avatarUrl: null,
        matches,
        wins,
        losses,
        winPercent: winPercent(wins, matches),
        legDiff: wins - losses,
        streak: "—",
      };
    });
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }

  return a - b;
}

function streakScore(value: string): number {
  if (value === "—" || !value) {
    return Number.NEGATIVE_INFINITY;
  }

  const kind = value.startsWith("W") ? 1 : value.startsWith("L") ? -1 : 0;
  const count = Number(value.slice(1)) || 0;
  return kind * 1000 + count;
}

function withDirection(result: number, direction: StatSortDirection): number {
  if (result === 0) {
    return 0;
  }

  return direction === "asc" ? result : -result;
}

function defaultPlayerCompare(a: LeaguePlayerStatRow, b: LeaguePlayerStatRow): number {
  return (
    b.winPercent - a.winPercent ||
    b.wins - a.wins ||
    compareNullableNumber(b.average, a.average) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

function defaultTeamCompare(a: LeagueTeamStatRow, b: LeagueTeamStatRow): number {
  return (
    b.winPercent - a.winPercent ||
    b.wins - a.wins ||
    b.legDiff - a.legDiff ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export function sortPlayerStatistics(
  rows: LeaguePlayerStatRow[],
  key: PlayerStatSortKey,
  direction: StatSortDirection,
): LeaguePlayerStatRow[] {
  const sorted = [...rows].sort((a, b) => {
    let result = 0;

    if (key === "rank") {
      const ranked = defaultPlayerCompare(a, b);
      return direction === "desc" ? ranked : -ranked;
    }

    switch (key) {
      case "name":
        result = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;
      case "matches":
        result = a.matches - b.matches;
        break;
      case "wins":
        result = a.wins - b.wins;
        break;
      case "losses":
        result = a.losses - b.losses;
        break;
      case "winPercent":
        result = a.winPercent - b.winPercent;
        break;
      case "average":
        result = compareNullableNumber(a.average, b.average);
        break;
      case "streak":
        result = streakScore(a.streak) - streakScore(b.streak);
        break;
      default:
        result = a.winPercent - b.winPercent;
    }

    if (result === 0) {
      return defaultPlayerCompare(a, b);
    }

    return withDirection(result, direction);
  });

  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function sortTeamStatistics(
  rows: LeagueTeamStatRow[],
  key: TeamStatSortKey,
  direction: StatSortDirection,
): LeagueTeamStatRow[] {
  if (key === "rank") {
    const ordered = [...rows].sort(defaultTeamCompare);
    const ranked = ordered.map((row, index) => ({ ...row, rank: index + 1 }));
    if (direction === "asc") {
      return [...ranked].reverse().map((row, index) => ({ ...row, rank: index + 1 }));
    }
    return ranked;
  }

  const sorted = [...rows].sort((a, b) => {
    let result = 0;

    switch (key) {
      case "name":
        result = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;
      case "matches":
        result = a.matches - b.matches;
        break;
      case "wins":
        result = a.wins - b.wins;
        break;
      case "losses":
        result = a.losses - b.losses;
        break;
      case "winPercent":
        result = a.winPercent - b.winPercent;
        break;
      case "legDiff":
        result = a.legDiff - b.legDiff;
        break;
      case "streak":
        result = streakScore(a.streak) - streakScore(b.streak);
        break;
      default:
        result = 0;
    }

    if (result === 0) {
      return defaultTeamCompare(a, b);
    }

    return withDirection(result, direction);
  });

  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function filterStatRowsByQuery<T extends { name: string }>(
  rows: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return rows;
  }

  return rows.filter((row) => row.name.toLowerCase().includes(needle));
}

export { formatWinPercent };

export function formatLegDiff(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
