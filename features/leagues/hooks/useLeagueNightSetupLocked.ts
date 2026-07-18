"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeagueScheduleModel } from "@/features/leagues/lib/league-schedule";
import {
  emptyWeekState,
  resolveLeagueNightWeek,
  type LeagueNightPhase,
  type LeagueNightPersistedState,
} from "@/features/leagues/lib/league-night";
import {
  LEAGUE_NIGHT_CHANGED_EVENT,
  readLeagueNightState,
  writeLeagueNightState,
  type LeagueNightChangedDetail,
} from "@/features/leagues/lib/league-night-storage";

type NightSetupState = {
  setupLocked: boolean;
  phase: LeagueNightPhase;
  canToggleSetupLock: boolean;
  setSetupEditingLocked: (locked: boolean) => void;
};

function weekKey(weekNumber: number) {
  return String(weekNumber);
}

function isSetupEditingLocked(
  week: LeagueNightPersistedState["weeks"][string] | undefined,
): boolean {
  // Older persisted weeks omit the field; treat as locked while night is active.
  return week?.setupEditingLocked !== false;
}

function computeNightSetupState(
  leagueId: string | undefined,
  schedule: LeagueScheduleModel | null,
): Omit<NightSetupState, "setSetupEditingLocked"> {
  if (!leagueId || !schedule) {
    return {
      setupLocked: false,
      phase: "pre",
      canToggleSetupLock: false,
    };
  }

  const persisted = readLeagueNightState(leagueId);
  const resolved = resolveLeagueNightWeek({
    schedule,
    completedWeeks: persisted.completedWeeks,
    preferredWeekNumber: persisted.activeWeekNumber,
  });
  const weekNumber = resolved.week?.weekNumber;
  if (weekNumber == null) {
    return {
      setupLocked: false,
      phase: "pre",
      canToggleSetupLock: false,
    };
  }

  const week = persisted.weeks[weekKey(weekNumber)];
  const phase = week?.phase ?? "pre";
  const nightActive = phase === "live" || phase === "complete";
  const editingLocked = isSetupEditingLocked(week);

  return {
    setupLocked: nightActive && editingLocked,
    phase,
    canToggleSetupLock: nightActive,
  };
}

/**
 * Active League Night week phase, plus whether setup tabs should stay read-only.
 * Auto-locks when the night goes live; directors can unlock/re-lock during the night.
 */
export function useLeagueNightSetupLocked(
  leagueId: string | undefined,
  schedule: LeagueScheduleModel | null,
): NightSetupState {
  const [state, setState] = useState<
    Omit<NightSetupState, "setSetupEditingLocked">
  >({
    setupLocked: false,
    phase: "pre",
    canToggleSetupLock: false,
  });

  useEffect(() => {
    const refresh = () => {
      setState(computeNightSetupState(leagueId, schedule));
    };

    refresh();

    const onNightChanged = (event: Event) => {
      const detail = (event as CustomEvent<LeagueNightChangedDetail>).detail;
      if (detail?.leagueId && leagueId && detail.leagueId !== leagueId) {
        return;
      }
      // Avoid setState during another component's render if an event was sync.
      queueMicrotask(refresh);
    };

    const onStorage = (event: StorageEvent) => {
      if (!leagueId) {
        return;
      }
      if (event.key && event.key !== `dartos:league-night:${leagueId}`) {
        return;
      }
      refresh();
    };

    window.addEventListener(LEAGUE_NIGHT_CHANGED_EVENT, onNightChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LEAGUE_NIGHT_CHANGED_EVENT, onNightChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [leagueId, schedule]);

  const setSetupEditingLocked = useCallback(
    (locked: boolean) => {
      if (!leagueId || !schedule) {
        return;
      }

      const persisted = readLeagueNightState(leagueId);
      const resolved = resolveLeagueNightWeek({
        schedule,
        completedWeeks: persisted.completedWeeks,
        preferredWeekNumber: persisted.activeWeekNumber,
      });
      const weekNumber = resolved.week?.weekNumber;
      if (weekNumber == null) {
        return;
      }

      const key = weekKey(weekNumber);
      const matches = resolved.week?.matches ?? [];
      const previous = persisted.weeks[key] ?? emptyWeekState(matches, []);
      const phase = previous.phase ?? "pre";
      if (phase !== "live" && phase !== "complete") {
        return;
      }

      writeLeagueNightState(leagueId, {
        ...persisted,
        activeWeekNumber: persisted.activeWeekNumber ?? weekNumber,
        weeks: {
          ...persisted.weeks,
          [key]: {
            ...previous,
            setupEditingLocked: locked,
          },
        },
      });
    },
    [leagueId, schedule],
  );

  return {
    ...state,
    setSetupEditingLocked,
  };
}
