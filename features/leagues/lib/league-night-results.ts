import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type {
  LeagueNightMatchControl,
} from "@/features/leagues/lib/league-night";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";

export interface LeagueNightResultRecord {
  id: string;
  kind: "player" | "team";
  wins: number;
  losses: number;
  recent: Array<"W" | "L">;
}

export interface LeagueNightResultsStore {
  version: 1;
  updatedAt: string;
  appliedWeeks: number[];
  records: Record<string, LeagueNightResultRecord>;
}

const storageKey = (leagueId: string) =>
  `dartos:league-night-results:${leagueId}`;

export function emptyNightResults(): LeagueNightResultsStore {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    appliedWeeks: [],
    records: {},
  };
}

export function readLeagueNightResults(
  leagueId: string | undefined,
): LeagueNightResultsStore {
  if (!leagueId || typeof window === "undefined") {
    return emptyNightResults();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(leagueId));
    if (!raw) {
      return emptyNightResults();
    }
    const parsed = JSON.parse(raw) as LeagueNightResultsStore;
    if (!parsed || parsed.version !== 1) {
      return emptyNightResults();
    }
    return {
      version: 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      appliedWeeks: Array.isArray(parsed.appliedWeeks) ? parsed.appliedWeeks : [],
      records:
        parsed.records && typeof parsed.records === "object"
          ? parsed.records
          : {},
    };
  } catch {
    return emptyNightResults();
  }
}

export function writeLeagueNightResults(
  leagueId: string | undefined,
  store: LeagueNightResultsStore,
): void {
  if (!leagueId || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey(leagueId), JSON.stringify(store));
  } catch {
    // Ignore storage failures.
  }
}

function bumpRecord(
  records: Record<string, LeagueNightResultRecord>,
  id: string | null,
  kind: "player" | "team",
  result: "W" | "L",
) {
  if (!id) {
    return;
  }

  const current = records[id] ?? {
    id,
    kind,
    wins: 0,
    losses: 0,
    recent: [],
  };

  if (result === "W") {
    current.wins += 1;
  } else {
    current.losses += 1;
  }

  current.recent = [result, ...current.recent].slice(0, 12);
  records[id] = current;
}

/** Merge one finalized night’s completed matchups into the cumulative results store. */
export function appendNightResults(input: {
  leagueId: string;
  weekNumber: number;
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
}): LeagueNightResultsStore {
  const store = readLeagueNightResults(input.leagueId);

  if (store.appliedWeeks.includes(input.weekNumber)) {
    return store;
  }

  const records = { ...store.records };

  for (const match of input.matches) {
    const control = input.matchControls[match.key];
    if (!control || control.uiStatus !== "completed") {
      continue;
    }

    const winner = control.winnerSide;
    if (winner !== "home" && winner !== "away") {
      continue;
    }

    const homeKind = match.homeKind;
    const awayKind = match.awayKind;

    if (winner === "home") {
      bumpRecord(records, match.homeId, homeKind, "W");
      bumpRecord(records, match.awayId, awayKind, "L");
    } else {
      bumpRecord(records, match.awayId, awayKind, "W");
      bumpRecord(records, match.homeId, homeKind, "L");
    }
  }

  const next: LeagueNightResultsStore = {
    version: 1,
    updatedAt: new Date().toISOString(),
    appliedWeeks: [...store.appliedWeeks, input.weekNumber].sort(
      (a, b) => a - b,
    ),
    records,
  };
  writeLeagueNightResults(input.leagueId, next);
  return next;
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
      wins: player.wins + record.wins,
      losses: player.losses + record.losses,
      matchesPlayed: player.matchesPlayed + record.wins + record.losses,
      recentMatches: [
        ...record.recent.map((result, index) => ({
          id: `night-${player.id}-${index}`,
          label: "League Night",
          result,
          dateLabel: "Night",
        })),
        ...player.recentMatches,
      ].slice(0, 8),
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
      wins: team.wins + record.wins,
      losses: team.losses + record.losses,
    };
  });
}
