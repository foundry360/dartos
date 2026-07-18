import {
  clearLegacyMatchBoards,
  emptyLeagueNightState,
  type LeagueNightPersistedState,
} from "@/features/leagues/lib/league-night";

const storageKey = (leagueId: string) => `dartos:league-night:${leagueId}`;

/** Same-tab sync when night state is written (storage events only fire cross-tab). */
export const LEAGUE_NIGHT_CHANGED_EVENT = "dartos:league-night-changed";

export type LeagueNightChangedDetail = {
  leagueId: string;
};

export function readLeagueNightState(
  leagueId: string | undefined,
): LeagueNightPersistedState {
  if (!leagueId || typeof window === "undefined") {
    return emptyLeagueNightState();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(leagueId));
    if (!raw) {
      return emptyLeagueNightState();
    }

    const parsed = JSON.parse(raw) as {
      version?: number;
      activeWeekNumber?: number | null;
      completedWeeks?: number[];
      weeks?: LeagueNightPersistedState["weeks"];
    };
    if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) {
      return emptyLeagueNightState();
    }

    const weeks =
      parsed.weeks && typeof parsed.weeks === "object" ? parsed.weeks : {};

    return {
      version: 2,
      activeWeekNumber: parsed.activeWeekNumber ?? null,
      completedWeeks: Array.isArray(parsed.completedWeeks)
        ? parsed.completedWeeks
        : [],
      // v1 auto-assigned board = sortOrder + 1; reset so the UI defaults to "-".
      weeks: parsed.version === 1 ? clearLegacyMatchBoards(weeks) : weeks,
    };
  } catch {
    return emptyLeagueNightState();
  }
}

export function writeLeagueNightState(
  leagueId: string | undefined,
  state: LeagueNightPersistedState,
): void {
  if (!leagueId || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey(leagueId), JSON.stringify(state));
    // Notify after the current render/setState flush. A sync CustomEvent here
    // can call setState in another component mid-render (React error).
    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent<LeagueNightChangedDetail>(LEAGUE_NIGHT_CHANGED_EVENT, {
          detail: { leagueId },
        }),
      );
    });
  } catch {
    // Ignore quota / private-mode failures; in-memory state still applies.
  }
}
