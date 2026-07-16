import {
  formatLeagueDate,
  formatLeagueTime,
} from "@/features/leagues/lib/league-formats";
import {
  groupMatchesByWeek,
  type DraftLeagueMatch,
  type LeagueScheduleModel,
  type LeagueScheduleWeek,
} from "@/features/leagues/lib/league-schedule";
import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";

export type LeagueNightPhase = "pre" | "live" | "complete";

export type LeagueNightCheckInStatus =
  | "checked_in"
  | "pending"
  | "substitute"
  | "absent";

export type LeagueNightMatchUiStatus =
  | "waiting"
  | "ready"
  | "live"
  | "paused"
  | "completed"
  | "forfeited";

export interface LeagueNightCheckIn {
  status: LeagueNightCheckInStatus;
  arrivedAt: string | null;
}

export interface LeagueNightMatchControl {
  /** Physical board number; null means unassigned ("-"). */
  board: number | null;
  uiStatus: LeagueNightMatchUiStatus;
  homeScore: number;
  awayScore: number;
  /** 1-based leg/game index within the series. */
  currentLeg: number;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  winnerSide: "home" | "away" | null;
}

/** X01 uses legs; cricket/tactics use games. */
export type MatchProgressUnit = "leg" | "game";

export interface LeagueNightActivityItem {
  id: string;
  at: string;
  title: string;
}

export interface LeagueNightWeekState {
  phase: LeagueNightPhase;
  checkIns: Record<string, LeagueNightCheckIn>;
  matchControls: Record<string, LeagueNightMatchControl>;
  activity: LeagueNightActivityItem[];
  checkInLocked: boolean;
  /**
   * When true (default after night goes live), setup tabs stay read-only.
   * Directors can unlock temporarily during a live night.
   */
  setupEditingLocked: boolean;
  startedAt: string | null;
  finalizedAt: string | null;
}

export interface LeagueNightPersistedState {
  /** v2: boards default to unassigned (null / "-") instead of sort order. */
  version: 2;
  activeWeekNumber: number | null;
  completedWeeks: number[];
  weeks: Record<string, LeagueNightWeekState>;
}

export const LEAGUE_NIGHT_CHECK_IN_LABEL: Record<
  LeagueNightCheckInStatus,
  string
> = {
  checked_in: "Checked In",
  pending: "Pending",
  substitute: "Substitute",
  absent: "Absent",
};

export const LEAGUE_NIGHT_MATCH_STATUS_LABEL: Record<
  LeagueNightMatchUiStatus,
  string
> = {
  waiting: "Waiting",
  ready: "Ready",
  live: "Live",
  paused: "Paused",
  completed: "Completed",
  forfeited: "Forfeited",
};

export function emptyLeagueNightState(): LeagueNightPersistedState {
  return {
    version: 2,
    activeWeekNumber: null,
    completedWeeks: [],
    weeks: {},
  };
}

/** Clear auto-assigned boards from pre-v2 night state. */
export function clearLegacyMatchBoards(
  weeks: Record<string, LeagueNightWeekState>,
): Record<string, LeagueNightWeekState> {
  const next: Record<string, LeagueNightWeekState> = {};
  for (const [key, week] of Object.entries(weeks)) {
    const matchControls: Record<string, LeagueNightMatchControl> = {};
    for (const [matchKey, control] of Object.entries(week.matchControls ?? {})) {
      matchControls[matchKey] = {
        ...control,
        board: null,
      };
    }
    next[key] = {
      ...week,
      matchControls,
    };
  }
  return next;
}

export function emptyWeekState(
  matches: DraftLeagueMatch[],
  playerIds: string[],
): LeagueNightWeekState {
  const checkIns: Record<string, LeagueNightCheckIn> = {};
  for (const id of playerIds) {
    checkIns[id] = { status: "pending", arrivedAt: null };
  }

  const matchControls: Record<string, LeagueNightMatchControl> = {};
  for (const match of matches) {
    matchControls[match.key] = {
      board: null,
      uiStatus: deriveInitialMatchUiStatus(match),
      homeScore: 0,
      awayScore: 0,
      currentLeg: 1,
      startedAt: null,
      pausedAt: null,
      completedAt: null,
      winnerSide: null,
    };
  }

  return {
    phase: "pre",
    checkIns,
    matchControls,
    activity: [],
    checkInLocked: false,
    setupEditingLocked: true,
    startedAt: null,
    finalizedAt: null,
  };
}

/** Map schedule/DB match status to Match Control UI badge status. */
export function matchUiStatusFromSchedule(
  match: DraftLeagueMatch,
): LeagueNightMatchUiStatus {
  if (match.status === "completed") {
    return "completed";
  }
  if (match.status === "cancelled") {
    return "forfeited";
  }
  if (match.status === "in_progress") {
    return "live";
  }
  return "waiting";
}

function deriveInitialMatchUiStatus(
  match: DraftLeagueMatch,
): LeagueNightMatchUiStatus {
  return matchUiStatusFromSchedule(match);
}

export function localDateKey(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameLocalDay(a: string | Date, b: string | Date): boolean {
  const keyA = localDateKey(a);
  const keyB = localDateKey(b);
  return Boolean(keyA && keyB && keyA === keyB);
}

export function startOfLocalDay(date = new Date()): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function resolveLeagueNightWeek(input: {
  schedule: LeagueScheduleModel | null;
  completedWeeks: number[];
  preferredWeekNumber?: number | null;
  now?: Date;
}): {
  week: LeagueScheduleWeek | null;
  weeks: LeagueScheduleWeek[];
  isUpcoming: boolean;
  countdownTarget: Date | null;
} {
  const now = input.now ?? new Date();
  const weeks = groupMatchesByWeek(input.schedule?.matches ?? []);
  const completed = new Set(input.completedWeeks);
  const incomplete = weeks.filter((week) => !completed.has(week.weekNumber));

  if (incomplete.length === 0) {
    return { week: null, weeks, isUpcoming: false, countdownTarget: null };
  }

  if (
    input.preferredWeekNumber != null &&
    incomplete.some((week) => week.weekNumber === input.preferredWeekNumber)
  ) {
    const preferred =
      incomplete.find((week) => week.weekNumber === input.preferredWeekNumber) ??
      null;
    const firstMatch = preferred?.matches[0];
    const scheduled = firstMatch ? new Date(firstMatch.scheduledAt) : null;
    const isUpcoming = Boolean(
      scheduled &&
        !Number.isNaN(scheduled.getTime()) &&
        startOfLocalDay(scheduled).getTime() > startOfLocalDay(now).getTime(),
    );
    return {
      week: preferred,
      weeks,
      isUpcoming,
      countdownTarget: isUpcoming && scheduled ? scheduled : null,
    };
  }

  const todayWeek =
    incomplete.find((week) => {
      const first = week.matches[0];
      return first ? isSameLocalDay(first.scheduledAt, now) : false;
    }) ?? null;

  if (todayWeek) {
    return {
      week: todayWeek,
      weeks,
      isUpcoming: false,
      countdownTarget: null,
    };
  }

  const upcoming = incomplete.find((week) => {
    const first = week.matches[0];
    if (!first) {
      return false;
    }
    const scheduled = new Date(first.scheduledAt);
    return (
      !Number.isNaN(scheduled.getTime()) &&
      startOfLocalDay(scheduled).getTime() > startOfLocalDay(now).getTime()
    );
  });

  if (upcoming) {
    const scheduled = new Date(upcoming.matches[0]!.scheduledAt);
    return {
      week: upcoming,
      weeks,
      isUpcoming: true,
      countdownTarget: scheduled,
    };
  }

  // Past incomplete week — still operable (catch-up night).
  return {
    week: incomplete[0] ?? null,
    weeks,
    isUpcoming: false,
    countdownTarget: null,
  };
}

export function formatCountdown(target: Date, now = new Date()): {
  label: string;
  totalMs: number;
} {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return {
      label: `${days}d ${hours}h ${minutes}m`,
      totalMs,
    };
  }

  if (hours > 0) {
    return {
      label: `${hours}h ${minutes}m`,
      totalMs,
    };
  }

  const seconds = totalSeconds % 60;
  return {
    label: `${minutes}m ${seconds}s`,
    totalMs,
  };
}

export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return (
    date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }) || "—"
  );
}

export function formatElapsed(startedAt: string | null, now = new Date()): string {
  if (!startedAt) {
    return "—";
  }
  return formatDurationBetween(startedAt, now.toISOString());
}

/** Elapsed time between two ISO timestamps (e.g. match start → finish). */
export function formatDurationBetween(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
): string {
  if (!startedAt || !endedAt) {
    return "—";
  }
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }
  const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function syncWeekStateWithRoster(
  weekState: LeagueNightWeekState,
  matches: DraftLeagueMatch[],
  playerIds: string[],
): LeagueNightWeekState {
  const checkIns = { ...weekState.checkIns };
  for (const id of playerIds) {
    if (!checkIns[id]) {
      checkIns[id] = { status: "pending", arrivedAt: null };
    }
  }

  const matchControls = { ...weekState.matchControls };
  for (const match of matches) {
    const existing = matchControls[match.key];
    const derived = deriveInitialMatchUiStatus(match);

    if (!existing) {
      matchControls[match.key] = {
        board: null,
        uiStatus: derived,
        homeScore: 0,
        awayScore: 0,
        currentLeg: 1,
        startedAt: match.status === "in_progress" ? new Date().toISOString() : null,
        pausedAt: null,
        completedAt: derived === "completed" ? new Date().toISOString() : null,
        winnerSide: null,
      };
      continue;
    }

    const normalized: LeagueNightMatchControl = {
      ...existing,
      currentLeg: existing.currentLeg ?? 1,
      completedAt: existing.completedAt ?? null,
    };

    // Prefer local pause / scores; reconcile terminal DB statuses.
    if (derived === "completed" || derived === "forfeited") {
      matchControls[match.key] = {
        ...normalized,
        uiStatus: derived,
      };
    } else if (
      derived === "live" &&
      normalized.uiStatus !== "paused" &&
      normalized.uiStatus !== "completed" &&
      normalized.uiStatus !== "forfeited"
    ) {
      matchControls[match.key] = {
        ...normalized,
        uiStatus: "live",
        startedAt: normalized.startedAt ?? new Date().toISOString(),
      };
    } else if (
      derived === "waiting" &&
      (normalized.uiStatus === "waiting" || normalized.uiStatus === "ready")
    ) {
      matchControls[match.key] = normalized;
    } else {
      matchControls[match.key] = normalized;
    }
  }

  return {
    ...weekState,
    checkIns,
    matchControls,
  };
}

export function resolveMatchUiStatus(input: {
  match: DraftLeagueMatch;
  control: LeagueNightMatchControl | undefined;
  homeReady: boolean;
  awayReady: boolean;
}): LeagueNightMatchUiStatus {
  const { match, control, homeReady, awayReady } = input;

  if (control?.uiStatus === "paused") {
    return "paused";
  }
  if (control?.uiStatus === "forfeited" || match.status === "cancelled") {
    return "forfeited";
  }
  if (control?.uiStatus === "completed" || match.status === "completed") {
    return "completed";
  }
  if (control?.uiStatus === "live" || match.status === "in_progress") {
    return "live";
  }
  if (homeReady && awayReady) {
    return "ready";
  }
  return control?.uiStatus === "ready" ? "ready" : "waiting";
}

/** Same badge status Match Control shows, including check-in readiness. */
export function resolveMatchDisplayStatus(input: {
  match: DraftLeagueMatch;
  weekState: LeagueNightWeekState | null | undefined;
  players: LeaguePlayer[];
  teams: LeagueTeam[];
}): LeagueNightMatchUiStatus {
  const { match, weekState, players, teams } = input;
  if (!weekState) {
    return matchUiStatusFromSchedule(match);
  }

  return resolveMatchUiStatus({
    match,
    control: weekState.matchControls[match.key],
    homeReady: isSideCheckedIn({
      match,
      checkIns: weekState.checkIns,
      players,
      teams,
      side: "home",
    }),
    awayReady: isSideCheckedIn({
      match,
      checkIns: weekState.checkIns,
      players,
      teams,
      side: "away",
    }),
  });
}

export function isSideCheckedIn(input: {
  match: DraftLeagueMatch;
  checkIns: Record<string, LeagueNightCheckIn>;
  players: LeaguePlayer[];
  teams: LeagueTeam[];
  side: "home" | "away";
}): boolean {
  const { match, checkIns, players, teams, side } = input;
  const id = side === "home" ? match.homeId : match.awayId;
  const kind = side === "home" ? match.homeKind : match.awayKind;

  if (!id) {
    return false;
  }

  if (kind === "player") {
    const status = checkIns[id]?.status;
    return status === "checked_in" || status === "substitute";
  }

  const roster = players.filter((player) => player.teamId === id);
  if (roster.length === 0) {
    // Team exists but no roster rows — treat as ready when any check-in is present.
    void teams;
    return false;
  }

  return roster.some((player) => {
    const status = checkIns[player.id]?.status;
    return status === "checked_in" || status === "substitute";
  });
}

export function buildReadinessChecklist(input: {
  schedulePublished: boolean;
  hasTeams: boolean;
  isSingles: boolean;
  matchCount: number;
  checkedIn: number;
  expected: number;
}): { items: Array<{ label: string; complete: boolean }>; percent: number } {
  const items = [
    {
      label: "Schedule Published",
      complete: input.schedulePublished || input.matchCount > 0,
    },
    {
      label: "Teams Assigned",
      complete: input.isSingles || input.hasTeams,
    },
    {
      label: "Matchups Generated",
      complete: input.matchCount > 0,
    },
    {
      label: `${input.checkedIn} / ${input.expected} Players Checked In`,
      complete: input.expected > 0 && input.checkedIn >= input.expected,
    },
  ];

  const completeCount = items.filter((item) => item.complete).length;
  // Weight check-in progress into overall readiness.
  const checkInRatio =
    input.expected > 0 ? Math.min(1, input.checkedIn / input.expected) : 0;
  const base = items.slice(0, 3).filter((item) => item.complete).length;
  const percent = Math.round(((base + checkInRatio) / 4) * 100);

  return { items, percent };
}

export function weekDateTimeLabels(week: LeagueScheduleWeek | null): {
  dateLabel: string;
  timeLabel: string;
} {
  if (!week?.matches[0]) {
    return { dateLabel: "—", timeLabel: "—" };
  }
  return {
    dateLabel: formatLeagueDate(week.matches[0].scheduledAt) ?? week.dateLabel,
    timeLabel: formatLeagueTime(week.matches[0].scheduledAt) ?? week.timeLabel,
  };
}

export function countCheckIns(
  checkIns: Record<string, LeagueNightCheckIn>,
  playerIds: string[],
): { checkedIn: number; pending: number; absent: number; substitute: number } {
  let checkedIn = 0;
  let pending = 0;
  let absent = 0;
  let substitute = 0;

  for (const id of playerIds) {
    const status = checkIns[id]?.status ?? "pending";
    if (status === "checked_in") {
      checkedIn += 1;
    } else if (status === "absent") {
      absent += 1;
    } else if (status === "substitute") {
      substitute += 1;
      checkedIn += 1;
    } else {
      pending += 1;
    }
  }

  return { checkedIn, pending, absent, substitute };
}

export function pushActivity(
  activity: LeagueNightActivityItem[],
  title: string,
  at = new Date().toISOString(),
): LeagueNightActivityItem[] {
  return [
    {
      id: `activity-${at}-${Math.random().toString(36).slice(2, 8)}`,
      at,
      title,
    },
    ...activity,
  ].slice(0, 40);
}

export function teamScoreboardFromControls(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
}): Array<{ id: string; label: string; score: number }> {
  const scores = new Map<string, { label: string; score: number }>();

  const bump = (id: string | null, label: string, amount: number) => {
    if (!id) {
      return;
    }
    const current = scores.get(id) ?? { label, score: 0 };
    current.score += amount;
    current.label = label;
    scores.set(id, current);
  };

  for (const match of input.matches) {
    const control = input.matchControls[match.key];
    if (!control || control.uiStatus !== "completed") {
      continue;
    }

    if (control.winnerSide === "home") {
      bump(match.homeId, match.homeLabel, 1);
    } else if (control.winnerSide === "away") {
      bump(match.awayId, match.awayLabel, 1);
    } else if (control.homeScore !== control.awayScore) {
      if (control.homeScore > control.awayScore) {
        bump(match.homeId, match.homeLabel, 1);
      } else {
        bump(match.awayId, match.awayLabel, 1);
      }
    }
  }

  return [...scores.entries()]
    .map(([id, value]) => ({ id, label: value.label, score: value.score }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}

export interface LeagueNightCompletedResult {
  key: string;
  matchNumber: number;
  homeLabel: string;
  awayLabel: string;
  winnerSide: "home" | "away" | null;
  scoreLabel: string;
  durationLabel: string;
  completedAt: string | null;
}

/** Human-friendly match length for progress microcards (e.g. "42 min", "1h 15m"). */
export function formatFriendlyDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) {
    return "—";
  }
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) {
    return `${Math.max(totalMin, ms > 0 ? 1 : 0)} min`;
  }
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function matchDurationMs(control: LeagueNightMatchControl): number | null {
  if (!control.startedAt || !control.completedAt) {
    return null;
  }
  const start = new Date(control.startedAt).getTime();
  const end = new Date(control.completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  return end - start;
}

export interface LeagueNightClosestMatch {
  matchNumber: number;
  homeLabel: string;
  awayLabel: string;
  homeScore: number;
  awayScore: number;
}

export interface LeagueNightProgressSummary {
  percentComplete: number;
  completedCount: number;
  totalCount: number;
  estimatedCompletionLabel: string;
  remainingLabel: string;
  matchesPerHour: number | null;
  matchesPerHourLabel: string;
  closestMatch: LeagueNightClosestMatch | null;
  avgMatchMs: number | null;
  longestMatchMs: number | null;
  avgMatchLabel: string;
  longestMatchLabel: string;
  longestMatchMeta: string;
  isSample: boolean;
}

function formatClockTime(date: Date): string {
  return (
    date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }) || "—"
  );
}

function formatRemainingLabel(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  if (totalMin < 60) {
    return `~${totalMin} minutes remaining`;
  }
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (minutes === 0) {
    return `~${hours}h remaining`;
  }
  return `~${hours}h ${minutes}m remaining`;
}

export function buildLeagueNightProgressSummary(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  isSingles?: boolean;
  now?: Date;
  nightStartedAt?: string | null;
}): LeagueNightProgressSummary {
  const now = input.now ?? new Date();
  const totalCount = input.matches.length;
  let completedCount = 0;
  let durationSum = 0;
  let durationCount = 0;
  let earliestStartMs: number | null = null;
  let longestMatchMs: number | null = null;
  let longestMatchMeta = "—";
  let closestMatch: LeagueNightClosestMatch | null = null;
  let closestMargin = Number.POSITIVE_INFINITY;

  input.matches.forEach((match, index) => {
    const control = input.matchControls[match.key];
    const done =
      control?.uiStatus === "completed" ||
      control?.uiStatus === "forfeited" ||
      match.status === "completed" ||
      match.status === "cancelled";
    if (!done) {
      return;
    }
    completedCount += 1;
    if (!control) {
      return;
    }

    const ms = matchDurationMs(control);
    if (ms != null) {
      durationSum += ms;
      durationCount += 1;
      if (longestMatchMs == null || ms > longestMatchMs) {
        longestMatchMs = ms;
        longestMatchMeta = `Match ${index + 1} · ${match.homeLabel} vs ${match.awayLabel}`;
      }
    }

    if (control.startedAt) {
      const startMs = new Date(control.startedAt).getTime();
      if (!Number.isNaN(startMs)) {
        earliestStartMs =
          earliestStartMs == null ? startMs : Math.min(earliestStartMs, startMs);
      }
    }

    const margin = Math.abs(control.homeScore - control.awayScore);
    const totalScore = control.homeScore + control.awayScore;
    const closestTotal = closestMatch
      ? closestMatch.homeScore + closestMatch.awayScore
      : -1;
    if (
      margin < closestMargin ||
      (margin === closestMargin && totalScore > closestTotal)
    ) {
      closestMargin = margin;
      closestMatch = {
        matchNumber: index + 1,
        homeLabel: match.homeLabel,
        awayLabel: match.awayLabel,
        homeScore: control.homeScore,
        awayScore: control.awayScore,
      };
    }
  });

  const measuredAvgMs =
    durationCount > 0 ? durationSum / durationCount : null;
  const avgMatchMs = measuredAvgMs ?? 45 * 60 * 1000;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const remainingMs = remainingCount * avgMatchMs;
  const estimatedAt = new Date(now.getTime() + remainingMs);

  let nightStartMs: number | null = earliestStartMs;
  if (input.nightStartedAt) {
    const parsed = new Date(input.nightStartedAt).getTime();
    if (!Number.isNaN(parsed)) {
      nightStartMs =
        nightStartMs == null ? parsed : Math.min(nightStartMs, parsed);
    }
  }

  const elapsedHours =
    nightStartMs != null
      ? Math.max((now.getTime() - nightStartMs) / 3_600_000, 1 / 60)
      : null;
  const matchesPerHour =
    elapsedHours != null && completedCount > 0
      ? completedCount / elapsedHours
      : null;

  if (completedCount === 0) {
    const sampleMatch = input.matches[0];
    const sampleMeta = sampleMatch
      ? `Match 1 · ${sampleMatch.homeLabel} vs ${sampleMatch.awayLabel}`
      : input.isSingles
        ? "Match 1 · Alex Morgan vs Jamie Cole"
        : "Match 1 · Bull Chasers vs Flight Crew";

    return {
      percentComplete: 75,
      completedCount: 12,
      totalCount: Math.max(totalCount, 16),
      estimatedCompletionLabel: "10:45 PM",
      remainingLabel: "~45 minutes remaining",
      matchesPerHour: 4.2,
      matchesPerHourLabel: "4.2",
      closestMatch: input.isSingles
        ? {
            matchNumber: 1,
            homeLabel: "Alex Morgan",
            awayLabel: "Jamie Cole",
            homeScore: 5,
            awayScore: 4,
          }
        : {
            matchNumber: 1,
            homeLabel: "Bull Chasers",
            awayLabel: "Flight Crew",
            homeScore: 5,
            awayScore: 4,
          },
      avgMatchMs: 42 * 60 * 1000,
      longestMatchMs: (1 * 60 + 15) * 60 * 1000,
      avgMatchLabel: "42 min",
      longestMatchLabel: "1h 15m",
      longestMatchMeta: sampleMeta,
      isSample: true,
    };
  }

  const percentComplete =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    percentComplete,
    completedCount,
    totalCount,
    estimatedCompletionLabel:
      remainingCount === 0 ? "Complete" : formatClockTime(estimatedAt),
    remainingLabel:
      remainingCount === 0
        ? "All matches finished"
        : formatRemainingLabel(remainingMs),
    matchesPerHour,
    matchesPerHourLabel:
      matchesPerHour == null ? "—" : matchesPerHour.toFixed(1),
    closestMatch,
    avgMatchMs: measuredAvgMs,
    longestMatchMs,
    avgMatchLabel: formatFriendlyDuration(measuredAvgMs),
    longestMatchLabel: formatFriendlyDuration(longestMatchMs),
    longestMatchMeta,
    isSample: false,
  };
}

/** Completed match rows for the League Night scoreboard card. */
export function completedMatchResults(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
}): LeagueNightCompletedResult[] {
  const results: LeagueNightCompletedResult[] = [];

  input.matches.forEach((match, index) => {
    const control = input.matchControls[match.key];
    if (!control || control.uiStatus !== "completed") {
      return;
    }

    let winnerSide: "home" | "away" | null = control.winnerSide;
    if (!winnerSide) {
      if (control.homeScore > control.awayScore) {
        winnerSide = "home";
      } else if (control.awayScore > control.homeScore) {
        winnerSide = "away";
      }
    }

    results.push({
      key: match.key,
      matchNumber: index + 1,
      homeLabel: match.homeLabel,
      awayLabel: match.awayLabel,
      winnerSide,
      scoreLabel: `${control.homeScore}–${control.awayScore}`,
      durationLabel: formatDurationBetween(
        control.startedAt,
        control.completedAt,
      ),
      completedAt: control.completedAt ?? null,
    });
  });

  return results.sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime || a.matchNumber - b.matchNumber;
  });
}

export function boardSummary(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
}): { active: number; available: number; total: number } {
  const total = input.matches.length;
  let active = 0;

  for (const match of input.matches) {
    const status =
      input.matchControls[match.key]?.uiStatus ??
      deriveInitialMatchUiStatus(match);
    if (status === "live" || status === "paused") {
      active += 1;
    }
  }

  return {
    active,
    available: Math.max(0, total - active),
    total,
  };
}

/** Default board is unassigned until a director picks one. */
export function defaultBoardForMatch(_match?: DraftLeagueMatch): number | null {
  return null;
}

/** Board numbers directors can assign for a night (1…match count). */
export function boardOptionsForNight(matchCount: number): number[] {
  const total = Math.max(1, matchCount);
  return Array.from({ length: total }, (_, index) => index + 1);
}

/**
 * Assign a board to a match. If another match already uses that board,
 * swap the two boards so each board stays unique for the night.
 * Pass `null` to clear the assignment ("-").
 */
export function assignMatchBoard(input: {
  matchControls: Record<string, LeagueNightMatchControl>;
  matches: DraftLeagueMatch[];
  matchKey: string;
  board: number | null;
}): Record<string, LeagueNightMatchControl> {
  const board =
    input.board == null
      ? null
      : Math.max(1, Math.floor(input.board));
  const match = input.matches.find((entry) => entry.key === input.matchKey);
  if (!match) {
    return input.matchControls;
  }

  const next = { ...input.matchControls };
  const current = next[input.matchKey] ?? {
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

  const previousBoard = current.board;
  if (previousBoard === board) {
    return input.matchControls;
  }

  next[input.matchKey] = {
    ...current,
    board,
  };

  if (board != null) {
    const occupantKey = Object.keys(next).find(
      (key) => key !== input.matchKey && next[key]?.board === board,
    );
    if (occupantKey && next[occupantKey]) {
      next[occupantKey] = {
        ...next[occupantKey],
        board: previousBoard,
      };
    }
  }

  return next;
}
