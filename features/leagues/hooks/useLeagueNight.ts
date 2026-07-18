"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type {
  DraftLeagueMatch,
  LeagueScheduleModel,
} from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import {
  assignMatchBoard,
  boardSummary,
  buildReadinessChecklist,
  buildLeagueNightProgressSummary,
  completedMatchResults,
  countCheckIns,
  emptyLeagueNightState,
  emptyWeekState,
  formatCountdown,
  isFinishedMatchUiStatus,
  pushActivity,
  resolveLeagueNightWeek,
  resolveMatchDisplayStatus,
  resolveMatchUiStatus,
  syncWeekStateWithRoster,
  teamScoreboardFromControls,
  weekDateTimeLabels,
  type LeagueNightCheckInStatus,
  type LeagueNightMatchUiStatus,
  type LeagueNightPersistedState,
  type LeagueNightWeekState,
} from "@/features/leagues/lib/league-night";
import {
  LEAGUE_NIGHT_CHANGED_EVENT,
  readLeagueNightState,
  writeLeagueNightState,
} from "@/features/leagues/lib/league-night-storage";

const EMPTY_MATCHES: DraftLeagueMatch[] = [];

function weekKey(weekNumber: number) {
  return String(weekNumber);
}

function sameIdList(a: string[], b: string[]) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((id, index) => id === b[index]);
}

export function useLeagueNight(input: {
  leagueId: string | undefined;
  schedule: LeagueScheduleModel | null;
  players: LeaguePlayer[];
  teams: LeagueTeam[];
  isSingles: boolean;
  schedulePublished: boolean;
  /** Venue board capacity — drives Boards card + Match Control dropdowns. */
  boardCount?: number | null;
}) {
  const {
    leagueId,
    schedule,
    players,
    teams,
    isSingles,
    schedulePublished,
    boardCount: boardCountInput,
  } = input;

  const venueBoardCount = Math.max(
    1,
    Math.min(64, Math.floor(boardCountInput ?? 4)),
  );

  const [persisted, setPersisted] = useState<LeagueNightPersistedState>(
    emptyLeagueNightState,
  );
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setPersisted(readLeagueNightState(leagueId));
    setHydrated(true);
  }, [leagueId]);

  useEffect(() => {
    if (!hydrated || !leagueId) {
      return;
    }
    writeLeagueNightState(leagueId, persisted);
  }, [hydrated, leagueId, persisted]);

  // Stay in sync when another hook (e.g. league header) updates night storage.
  useEffect(() => {
    if (!leagueId) {
      return;
    }

    const onNightChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ leagueId: string }>).detail;
      if (detail?.leagueId && detail.leagueId !== leagueId) {
        return;
      }

      const next = readLeagueNightState(leagueId);
      setPersisted((current) => {
        if (JSON.stringify(current) === JSON.stringify(next)) {
          return current;
        }
        return next;
      });
    };

    window.addEventListener(LEAGUE_NIGHT_CHANGED_EVENT, onNightChanged);
    return () => {
      window.removeEventListener(LEAGUE_NIGHT_CHANGED_EVENT, onNightChanged);
    };
  }, [leagueId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activePlayers = useMemo(
    () => players.filter((player) => player.leagueStatus !== "inactive"),
    [players],
  );
  const playerIds = useMemo(
    () => activePlayers.map((player) => player.id),
    [activePlayers],
  );
  const playerIdsKey = playerIds.join("|");
  const stablePlayerIds = useMemo(
    () => playerIds,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity keyed by playerIdsKey
    [playerIdsKey],
  );

  const todayKey = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [now]);

  const resolved = useMemo(
    () =>
      resolveLeagueNightWeek({
        schedule,
        completedWeeks: persisted.completedWeeks,
        preferredWeekNumber: persisted.activeWeekNumber,
        // Resolve against start-of-day so the 1s clock does not rebuild weeks.
        now: new Date(`${todayKey}T12:00:00`),
      }),
    [schedule, persisted.completedWeeks, persisted.activeWeekNumber, todayKey],
  );

  const week = resolved.week;
  const weekNumber = week?.weekNumber ?? null;
  const matches = week?.matches ?? EMPTY_MATCHES;
  const matchKeysSignature = matches.map((match) => match.key).join("|");
  const stableMatches = useMemo(
    () => matches,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity keyed by match keys + week
    [weekNumber, matchKeysSignature],
  );

  const weekState: LeagueNightWeekState | null = useMemo(() => {
    if (weekNumber == null) {
      return null;
    }

    const existing = persisted.weeks[weekKey(weekNumber)];
    const base = existing ?? emptyWeekState(stableMatches, stablePlayerIds);
    return syncWeekStateWithRoster(base, stableMatches, stablePlayerIds);
  }, [weekNumber, persisted.weeks, stableMatches, stablePlayerIds]);

  // Seed the active week once into persisted state. Never rewrite an existing
  // week from an effect — that caused a maximum update depth loop.
  useEffect(() => {
    if (!hydrated || weekNumber == null) {
      return;
    }

    const key = weekKey(weekNumber);

    setPersisted((current) => {
      const existing = current.weeks[key];

      if (existing) {
        if (current.activeWeekNumber === weekNumber) {
          return current;
        }

        return {
          ...current,
          activeWeekNumber: weekNumber,
        };
      }

      return {
        ...current,
        activeWeekNumber: weekNumber,
        weeks: {
          ...current.weeks,
          [key]: emptyWeekState(stableMatches, stablePlayerIds),
        },
      };
    });
  }, [hydrated, weekNumber, stableMatches, stablePlayerIds]);

  // Keep roster/match keys in sync without replacing unrelated night state.
  useEffect(() => {
    if (!hydrated || weekNumber == null) {
      return;
    }

    const key = weekKey(weekNumber);

    setPersisted((current) => {
      const existing = current.weeks[key];
      if (!existing) {
        return current;
      }

      const synced = syncWeekStateWithRoster(
        existing,
        stableMatches,
        stablePlayerIds,
      );
      const checkInKeys = Object.keys(synced.checkIns);
      const existingCheckInKeys = Object.keys(existing.checkIns);
      const controlKeys = Object.keys(synced.matchControls);
      const existingControlKeys = Object.keys(existing.matchControls);

      if (
        sameIdList(checkInKeys, existingCheckInKeys) &&
        sameIdList(controlKeys, existingControlKeys)
      ) {
        return current;
      }

      return {
        ...current,
        weeks: {
          ...current.weeks,
          [key]: synced,
        },
      };
    });
  }, [hydrated, weekNumber, stableMatches, stablePlayerIds]);

  const updateWeekState = useCallback(
    (
      updater: (current: LeagueNightWeekState) => LeagueNightWeekState,
      options?: { activeWeekNumber?: number | null },
    ) => {
      if (weekNumber == null) {
        return;
      }

      setPersisted((current) => {
        const key = weekKey(weekNumber);
        const previous =
          current.weeks[key] ?? emptyWeekState(stableMatches, stablePlayerIds);
        const synced = syncWeekStateWithRoster(
          previous,
          stableMatches,
          stablePlayerIds,
        );
        const nextWeek = updater(synced);

        if (
          nextWeek === synced &&
          !(options && "activeWeekNumber" in options) &&
          current.activeWeekNumber != null
        ) {
          return current;
        }

        const next: LeagueNightPersistedState = {
          ...current,
          activeWeekNumber:
            options && "activeWeekNumber" in options
              ? options.activeWeekNumber ?? null
              : current.activeWeekNumber ?? weekNumber,
          weeks: {
            ...current.weeks,
            [key]: nextWeek,
          },
        };

        // Flush immediately so scores survive Match Desk unmount / navigation
        // before React effects run.
        writeLeagueNightState(leagueId, next);

        return next;
      });
    },
    [weekNumber, stableMatches, stablePlayerIds, leagueId],
  );
  const checkInCounts = useMemo(
    () => countCheckIns(weekState?.checkIns ?? {}, stablePlayerIds),
    [weekState?.checkIns, stablePlayerIds],
  );

  const readiness = useMemo(
    () =>
      buildReadinessChecklist({
        schedulePublished,
        hasTeams: teams.some((team) => team.status === "active"),
        isSingles,
        matchCount: stableMatches.length,
        checkedIn: checkInCounts.checkedIn,
        expected: stablePlayerIds.length,
      }),
    [
      schedulePublished,
      teams,
      isSingles,
      stableMatches.length,
      checkInCounts.checkedIn,
      stablePlayerIds.length,
    ],
  );

  const matchStats = useMemo(() => {
    let scheduled = 0;
    let live = 0;
    let completed = 0;
    let waiting = 0;
    let paused = 0;

    for (const match of stableMatches) {
      const homeReady = Boolean(
        weekState &&
          (match.homeKind === "player"
            ? ["checked_in", "substitute"].includes(
                weekState.checkIns[match.homeId ?? ""]?.status ?? "",
              )
            : activePlayers
                .filter((player) => player.teamId === match.homeId)
                .some((player) =>
                  ["checked_in", "substitute"].includes(
                    weekState.checkIns[player.id]?.status ?? "",
                  ),
                )),
      );
      const awayReady = Boolean(
        weekState &&
          (match.awayKind === "player"
            ? ["checked_in", "substitute"].includes(
                weekState.checkIns[match.awayId ?? ""]?.status ?? "",
              )
            : activePlayers
                .filter((player) => player.teamId === match.awayId)
                .some((player) =>
                  ["checked_in", "substitute"].includes(
                    weekState.checkIns[player.id]?.status ?? "",
                  ),
                )),
      );

      const status = resolveMatchUiStatus({
        match,
        control: weekState?.matchControls[match.key],
        homeReady,
        awayReady,
      });

      scheduled += 1;
      if (status === "live") {
        live += 1;
      } else if (isFinishedMatchUiStatus(status)) {
        completed += 1;
      } else if (status === "paused") {
        paused += 1;
        live += 1;
      } else {
        waiting += 1;
      }
    }

    return { scheduled, live, completed, waiting, paused };
  }, [stableMatches, weekState, activePlayers]);

  const boards = useMemo(
    () =>
      boardSummary({
        matches: stableMatches,
        matchControls: weekState?.matchControls ?? {},
        boardCount: venueBoardCount,
      }),
    [stableMatches, weekState?.matchControls, venueBoardCount],
  );

  const scoreboard = useMemo(
    () =>
      teamScoreboardFromControls({
        matches: stableMatches,
        matchControls: weekState?.matchControls ?? {},
      }),
    [stableMatches, weekState?.matchControls],
  );

  const completedResults = useMemo(
    () =>
      completedMatchResults({
        matches: stableMatches,
        matchControls: weekState?.matchControls ?? {},
      }),
    [stableMatches, weekState?.matchControls],
  );

  const nightProgress = useMemo(
    () =>
      buildLeagueNightProgressSummary({
        matches: stableMatches,
        matchControls: weekState?.matchControls ?? {},
        isSingles,
        now,
        nightStartedAt: weekState?.startedAt ?? null,
      }),
    [stableMatches, weekState?.matchControls, weekState?.startedAt, isSingles, now],
  );

  const labels = weekDateTimeLabels(week);
  const countdown = resolved.countdownTarget
    ? formatCountdown(resolved.countdownTarget, now)
    : null;

  const setCheckInStatus = useCallback(
    (playerId: string, status: LeagueNightCheckInStatus) => {
      updateWeekState((current) => {
        const arrivedAt =
          status === "checked_in" || status === "substitute"
            ? current.checkIns[playerId]?.arrivedAt ?? new Date().toISOString()
            : null;

        const player = activePlayers.find((entry) => entry.id === playerId);
        const name = player
          ? `${player.firstName} ${player.lastName}`.trim()
          : "Player";

        let title = `${name} checked in`;
        if (status === "absent") {
          title = `${name} marked absent`;
        } else if (status === "substitute") {
          title = `${name} assigned as substitute`;
        } else if (status === "pending") {
          title = `${name} set to pending`;
        }

        return {
          ...current,
          checkIns: {
            ...current.checkIns,
            [playerId]: { status, arrivedAt },
          },
          activity: pushActivity(current.activity, title),
        };
      });
    },
    [updateWeekState, activePlayers],
  );

  const bulkCheckIn = useCallback(
    (playerIdList: string[]) => {
      updateWeekState((current) => {
        const next = { ...current.checkIns };
        const at = new Date().toISOString();
        for (const id of playerIdList) {
          next[id] = {
            status: "checked_in",
            arrivedAt: next[id]?.arrivedAt ?? at,
          };
        }
        return {
          ...current,
          checkIns: next,
          activity: pushActivity(
            current.activity,
            `${playerIdList.length} player${playerIdList.length === 1 ? "" : "s"} checked in`,
          ),
        };
      });
    },
    [updateWeekState],
  );

  const runLeagueNight = useCallback(() => {
    updateWeekState(
      (current) => ({
        ...current,
        phase: "live",
        checkInLocked: true,
        setupEditingLocked: true,
        startedAt: current.startedAt ?? new Date().toISOString(),
        activity: pushActivity(current.activity, "League Night Started"),
      }),
      { activeWeekNumber: weekNumber },
    );
  }, [updateWeekState, weekNumber]);

  const setCheckInLocked = useCallback(
    (locked: boolean) => {
      updateWeekState((current) => ({
        ...current,
        checkInLocked: locked,
        activity: pushActivity(
          current.activity,
          locked ? "Check-in locked" : "Check-in unlocked for directors",
        ),
      }));
    },
    [updateWeekState],
  );

  const setSetupEditingLocked = useCallback(
    (locked: boolean) => {
      updateWeekState((current) => ({
        ...current,
        setupEditingLocked: locked,
        activity: pushActivity(
          current.activity,
          locked
            ? "Setup editing locked"
            : "Setup editing unlocked for directors",
        ),
      }));
    },
    [updateWeekState],
  );

  const setMatchControlStatus = useCallback(
    (
      matchKey: string,
      uiStatus: LeagueNightMatchUiStatus,
      extras?: {
        winnerSide?: "home" | "away" | null;
        homeScore?: number;
        awayScore?: number;
        activityTitle?: string;
      },
    ) => {
      updateWeekState((current) => {
        const previous = current.matchControls[matchKey] ?? {
          board: null,
          uiStatus: "waiting" as const,
          homeScore: 0,
          awayScore: 0,
          currentLeg: 1,
          startedAt: null,
          pausedAt: null,
          completedAt: null,
          winnerSide: null,
        };

        const homeScore = extras?.homeScore ?? previous.homeScore;
        const awayScore = extras?.awayScore ?? previous.awayScore;
        const nextControl = {
          ...previous,
          uiStatus,
          winnerSide:
            extras && "winnerSide" in extras
              ? extras.winnerSide ?? null
              : previous.winnerSide,
          homeScore,
          awayScore,
          currentLeg: isFinishedMatchUiStatus(uiStatus)
            ? Math.max(
                previous.currentLeg ?? 1,
                homeScore + awayScore,
                1,
              )
            : previous.currentLeg ?? 1,
          startedAt:
            uiStatus === "live" || isFinishedMatchUiStatus(uiStatus)
              ? previous.startedAt ?? new Date().toISOString()
              : previous.startedAt,
          pausedAt: uiStatus === "paused" ? new Date().toISOString() : null,
          completedAt: isFinishedMatchUiStatus(uiStatus)
            ? previous.completedAt ?? new Date().toISOString()
            : previous.completedAt,
        };

        let nextPhase = current.phase;
        if (current.phase === "live") {
          const controls = {
            ...current.matchControls,
            [matchKey]: nextControl,
          };
          const allDone = stableMatches.every((match) =>
            isFinishedMatchUiStatus(controls[match.key]?.uiStatus),
          );
          if (allDone && stableMatches.length > 0) {
            nextPhase = "complete";
          }
        }

        return {
          ...current,
          phase: nextPhase,
          matchControls: {
            ...current.matchControls,
            [matchKey]: nextControl,
          },
          activity: extras?.activityTitle
            ? pushActivity(current.activity, extras.activityTitle)
            : current.activity,
        };
      });
    },
    [updateWeekState, stableMatches],
  );

  const setMatchBoard = useCallback(
    (matchKey: string, board: number | null) => {
      updateWeekState((current) => {
        const matchControls = assignMatchBoard({
          matchControls: current.matchControls,
          matches: stableMatches,
          matchKey,
          board,
        });
        if (matchControls === current.matchControls) {
          return current;
        }
        return {
          ...current,
          matchControls,
          activity: pushActivity(
            current.activity,
            board == null ? "Board cleared" : `Board ${board} assigned`,
          ),
        };
      });
    },
    [updateWeekState, stableMatches],
  );

  const finalizeWeek = useCallback(() => {
    if (weekNumber == null) {
      return;
    }

    updateWeekState((current) => ({
      ...current,
      phase: "complete",
      finalizedAt: new Date().toISOString(),
      checkInLocked: true,
      activity: pushActivity(current.activity, "League Night Finalized"),
    }));

    setPersisted((current) => {
      const completedWeeks = current.completedWeeks.includes(weekNumber)
        ? current.completedWeeks
        : [...current.completedWeeks, weekNumber].sort((a, b) => a - b);

      const remaining = (schedule?.matches ?? [])
        .map((match) => match.weekNumber)
        .filter(
          (value, index, all) =>
            all.indexOf(value) === index && !completedWeeks.includes(value),
        )
        .sort((a, b) => a - b);

      return {
        ...current,
        completedWeeks,
        activeWeekNumber: remaining[0] ?? null,
      };
    });
  }, [weekNumber, updateWeekState, schedule?.matches]);

  // Auto-promote to complete when every match is done while live.
  useEffect(() => {
    if (!weekState || weekState.phase !== "live" || stableMatches.length === 0) {
      return;
    }

    const allDone = stableMatches.every((match) =>
      isFinishedMatchUiStatus(weekState.matchControls[match.key]?.uiStatus),
    );

    if (allDone) {
      updateWeekState((current) =>
        current.phase === "live"
          ? {
              ...current,
              phase: "complete",
              activity: pushActivity(
                current.activity,
                "All matches completed",
              ),
            }
          : current,
      );
    }
  }, [weekState, stableMatches, updateWeekState]);

  const getMatchStatus = useCallback(
    (match: DraftLeagueMatch): LeagueNightMatchUiStatus => {
      const key = weekKey(match.weekNumber);
      const existing = persisted.weeks[key];
      const weekMatches =
        schedule?.matches.filter(
          (entry) => entry.weekNumber === match.weekNumber,
        ) ?? EMPTY_MATCHES;
      const state = existing
        ? syncWeekStateWithRoster(existing, weekMatches, stablePlayerIds)
        : weekNumber === match.weekNumber
          ? weekState
          : null;

      return resolveMatchDisplayStatus({
        match,
        weekState: state,
        players: activePlayers,
        teams,
      });
    },
    [
      persisted.weeks,
      schedule?.matches,
      stablePlayerIds,
      weekNumber,
      weekState,
      activePlayers,
      teams,
    ],
  );

  return {
    hydrated,
    now,
    week,
    weeks: resolved.weeks,
    weekNumber,
    matches: stableMatches,
    isUpcoming: resolved.isUpcoming,
    countdown,
    labels,
    weekState,
    phase: weekState?.phase ?? "pre",
    activePlayers,
    checkInCounts,
    readiness,
    matchStats,
    boards,
    venueBoardCount,
    scoreboard,
    completedResults,
    nightProgress,
    getMatchStatus,
    setCheckInStatus,
    bulkCheckIn,
    runLeagueNight,
    setCheckInLocked,
    setSetupEditingLocked,
    setMatchControlStatus,
    setMatchBoard,
    finalizeWeek,
  };
}
