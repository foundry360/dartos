import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";
import { isTerminalLeagueMatchStatus } from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";

export interface LeagueNightResultRecord {
  id: string;
  kind: "player" | "team";
  wins: number;
  losses: number;
  recent: Array<"W" | "L">;
  legsFor: number;
  legsAgainst: number;
}

export interface LeagueNightResultsStore {
  version: 1;
  updatedAt: string;
  appliedWeeks: number[];
  records: Record<string, LeagueNightResultRecord>;
}

export function emptyNightResults(): LeagueNightResultsStore {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    appliedWeeks: [],
    records: {},
  };
}

function emptyRecord(
  id: string,
  kind: "player" | "team",
): LeagueNightResultRecord {
  return {
    id,
    kind,
    wins: 0,
    losses: 0,
    recent: [],
    legsFor: 0,
    legsAgainst: 0,
  };
}

function bumpRecord(
  records: Record<string, LeagueNightResultRecord>,
  id: string | null,
  kind: "player" | "team",
  result: "W" | "L",
  legsFor: number,
  legsAgainst: number,
) {
  if (!id) {
    return;
  }

  const current = records[id] ?? emptyRecord(id, kind);
  if (result === "W") {
    current.wins += 1;
  } else {
    current.losses += 1;
  }
  current.legsFor += Math.max(0, legsFor);
  current.legsAgainst += Math.max(0, legsAgainst);
  current.recent = [result, ...current.recent].slice(0, 12);
  records[id] = current;
}

/** True when a persisted schedule match should count toward standings. */
export function matchCountsAsStandingResult(
  match: Pick<DraftLeagueMatch, "status" | "winnerSide">,
): boolean {
  if (
    match.status !== "completed" &&
    match.status !== "forfeited" &&
    match.status !== "walkover"
  ) {
    return false;
  }

  return match.winnerSide === "home" || match.winnerSide === "away";
}

/**
 * Derive cumulative W/L (and leg totals) from schedule match results in the DB.
 * Newest results are prepended so streaks read most-recent first.
 */
export function buildResultsFromMatches(
  matches: DraftLeagueMatch[],
): LeagueNightResultsStore {
  const records: Record<string, LeagueNightResultRecord> = {};
  const appliedWeeks = new Set<number>();

  const sorted = [...matches].sort((a, b) => {
    const aTime = a.completedAt
      ? new Date(a.completedAt).getTime()
      : new Date(a.scheduledAt).getTime();
    const bTime = b.completedAt
      ? new Date(b.completedAt).getTime()
      : new Date(b.scheduledAt).getTime();
    return aTime - bTime || a.sortOrder - b.sortOrder;
  });

  for (const match of sorted) {
    if (!matchCountsAsStandingResult(match)) {
      continue;
    }

    const winner = match.winnerSide;
    if (winner !== "home" && winner !== "away") {
      continue;
    }

    appliedWeeks.add(match.weekNumber);
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    if (winner === "home") {
      bumpRecord(
        records,
        match.homeId,
        match.homeKind,
        "W",
        homeScore,
        awayScore,
      );
      bumpRecord(
        records,
        match.awayId,
        match.awayKind,
        "L",
        awayScore,
        homeScore,
      );
    } else {
      bumpRecord(
        records,
        match.awayId,
        match.awayKind,
        "W",
        awayScore,
        homeScore,
      );
      bumpRecord(
        records,
        match.homeId,
        match.homeKind,
        "L",
        homeScore,
        awayScore,
      );
    }
  }

  // Chronological bumps prepend results, so recent is newest-first already.

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    appliedWeeks: [...appliedWeeks].sort((a, b) => a - b),
    records,
  };
}

export function applyNightResultsToPlayers(
  players: LeaguePlayer[],
  store: LeagueNightResultsStore,
): LeaguePlayer[] {
  return players.map((player) => {
    const record = store.records[player.id];
    if (!record) {
      return player;
    }

    return {
      ...player,
      wins: record.wins,
      losses: record.losses,
      matchesPlayed: record.wins + record.losses,
      recentMatches: record.recent.map((result, index) => ({
        id: `result-${player.id}-${index}`,
        label: "League Match",
        result,
        dateLabel: "Match",
      })),
    };
  });
}

export function applyNightResultsToTeams(
  teams: LeagueTeam[],
  store: LeagueNightResultsStore,
): LeagueTeam[] {
  return teams.map((team) => {
    const record = store.records[team.id];
    if (!record) {
      return team;
    }

    return {
      ...team,
      wins: record.wins,
      losses: record.losses,
      matchesPlayed: record.wins + record.losses,
    };
  });
}

/** @deprecated Results are derived from league_matches — no-op kept for call-site safety. */
export function appendNightResults(_input: {
  leagueId: string;
  weekNumber: number;
  matches: DraftLeagueMatch[];
  matchControls: Record<string, unknown>;
}): LeagueNightResultsStore {
  return emptyNightResults();
}

/** @deprecated Prefer buildResultsFromMatches(schedule.matches). */
export function readLeagueNightResults(
  _leagueId: string | undefined,
): LeagueNightResultsStore {
  return emptyNightResults();
}

export function writeLeagueNightResults(
  _leagueId: string | undefined,
  _store: LeagueNightResultsStore,
): void {
  // no-op — standings persist on league_matches
}

export function hasPersistedMatchResults(matches: DraftLeagueMatch[]): boolean {
  return matches.some(
    (match) =>
      matchCountsAsStandingResult(match) ||
      isTerminalLeagueMatchStatus(match.status),
  );
}
