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
import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
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
  | "walkover"
  | "forfeited"
  | "cancelled";

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
  /**
   * Director-selected players for this board match.
   * Singles: one id per side. Doubles: two ids per side.
   */
  homePlayerIds: string[];
  awayPlayerIds: string[];
}

export function createEmptyMatchControl(
  uiStatus: LeagueNightMatchUiStatus = "waiting",
): LeagueNightMatchControl {
  return {
    board: null,
    uiStatus,
    homeScore: 0,
    awayScore: 0,
    currentLeg: 1,
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    winnerSide: null,
    homePlayerIds: [],
    awayPlayerIds: [],
  };
}

/** How many player picks each side needs for this board match (0 = no lineup UI). */
export function lineupSlotsForBoardMatch(
  match: Pick<DraftLeagueMatch, "boardFormat">,
): number {
  if (match.boardFormat === "doubles") {
    return 2;
  }
  if (match.boardFormat === "singles") {
    return 1;
  }
  return 0;
}

export function normalizeMatchControl(
  control: Partial<LeagueNightMatchControl> | null | undefined,
  uiStatus: LeagueNightMatchUiStatus = "waiting",
): LeagueNightMatchControl {
  const base = createEmptyMatchControl(uiStatus);
  if (!control) {
    return base;
  }
  return {
    ...base,
    ...control,
    homePlayerIds: Array.isArray(control.homePlayerIds)
      ? control.homePlayerIds.filter((id): id is string => typeof id === "string")
      : [],
    awayPlayerIds: Array.isArray(control.awayPlayerIds)
      ? control.awayPlayerIds.filter((id): id is string => typeof id === "string")
      : [],
    currentLeg: control.currentLeg ?? 1,
    completedAt: control.completedAt ?? null,
  };
}

export function isMatchLineupComplete(input: {
  match: Pick<DraftLeagueMatch, "boardFormat">;
  control: LeagueNightMatchControl | undefined;
}): boolean {
  const slots = lineupSlotsForBoardMatch(input.match);
  if (slots <= 0) {
    return true;
  }
  const home = (input.control?.homePlayerIds ?? [])
    .slice(0, slots)
    .filter((id): id is string => Boolean(id));
  const away = (input.control?.awayPlayerIds ?? [])
    .slice(0, slots)
    .filter((id): id is string => Boolean(id));
  return (
    home.length === slots &&
    away.length === slots &&
    new Set(home).size === slots &&
    new Set(away).size === slots
  );
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
  paused: "Saved",
  completed: "Completed",
  walkover: "Walkover",
  forfeited: "Forfeited",
  cancelled: "Canceled",
};

/** Terminal Match Control statuses (match is done for the night). */
export function isFinishedMatchUiStatus(
  status: LeagueNightMatchUiStatus | null | undefined,
): boolean {
  return (
    status === "completed" ||
    status === "walkover" ||
    status === "forfeited" ||
    status === "cancelled"
  );
}

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
        ...normalizeMatchControl(control, control.uiStatus ?? "waiting"),
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
    matchControls[match.key] = createEmptyMatchControl(
      deriveInitialMatchUiStatus(match),
    );
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
  if (match.status === "forfeited") {
    return "forfeited";
  }
  if (match.status === "walkover") {
    return "walkover";
  }
  if (match.status === "cancelled") {
    return "cancelled";
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
        ...createEmptyMatchControl(derived),
        startedAt:
          match.status === "in_progress" ? new Date().toISOString() : null,
        completedAt: derived === "completed" ? new Date().toISOString() : null,
      };
      continue;
    }

    const normalized = normalizeMatchControl(existing, existing.uiStatus);

    // Prefer local terminal nuance. Schedule only has completed/cancelled, so a
    // forfeit or walkover would otherwise get flattened back to "completed".
    if (isFinishedMatchUiStatus(normalized.uiStatus)) {
      matchControls[match.key] = normalized;
    } else if (
      derived === "completed" ||
      derived === "forfeited" ||
      derived === "walkover" ||
      derived === "cancelled"
    ) {
      matchControls[match.key] = {
        ...normalized,
        uiStatus: derived,
        completedAt:
          normalized.completedAt ?? new Date().toISOString(),
      };
    } else if (
      derived === "live" &&
      normalized.uiStatus !== "paused"
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
  if (control?.uiStatus === "cancelled") {
    return "cancelled";
  }
  if (control?.uiStatus === "walkover" || match.status === "walkover") {
    return "walkover";
  }
  if (control?.uiStatus === "forfeited" || match.status === "forfeited") {
    // Legacy cancel used forfeited with no winner — surface as Canceled.
    if (
      control?.uiStatus === "forfeited" &&
      control.winnerSide !== "home" &&
      control.winnerSide !== "away" &&
      match.status !== "forfeited"
    ) {
      return "cancelled";
    }
    return "forfeited";
  }
  if (match.status === "cancelled") {
    return "cancelled";
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

/** True when night control should count toward standings / results. */
export function matchControlCountsAsResult(
  control: LeagueNightMatchControl | null | undefined,
): control is LeagueNightMatchControl {
  if (!control) {
    return false;
  }
  if (control.uiStatus === "completed") {
    return true;
  }
  // Forfeit / walkover: awarded a winner without board scoring.
  return (
    (control.uiStatus === "forfeited" || control.uiStatus === "walkover") &&
    (control.winnerSide === "home" || control.winnerSide === "away")
  );
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
    if (!matchControlCountsAsResult(control)) {
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
  /** Terminal Match Control status for this row. */
  uiStatus: "completed" | "walkover" | "forfeited" | "cancelled";
  /** Score like "3–1", or null when the row should show status instead. */
  scoreLabel: string | null;
  /** Display label when there is no scored result (Walkover / Forfeited / Canceled). */
  statusLabel: string | null;
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
      control?.uiStatus === "walkover" ||
      control?.uiStatus === "forfeited" ||
      control?.uiStatus === "cancelled" ||
      match.status === "completed" ||
      match.status === "forfeited" ||
      match.status === "walkover" ||
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

/** Finished match rows for the League Night progress card. */
export function completedMatchResults(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
}): LeagueNightCompletedResult[] {
  const results: LeagueNightCompletedResult[] = [];

  input.matches.forEach((match, index) => {
    const control = input.matchControls[match.key];
    if (!control || !isFinishedMatchUiStatus(control.uiStatus)) {
      return;
    }

    const uiStatus = control.uiStatus as
      | "completed"
      | "walkover"
      | "forfeited"
      | "cancelled";

    let winnerSide: "home" | "away" | null = control.winnerSide;
    if (!winnerSide && uiStatus === "completed") {
      if (control.homeScore > control.awayScore) {
        winnerSide = "home";
      } else if (control.awayScore > control.homeScore) {
        winnerSide = "away";
      }
    }
    if (uiStatus === "cancelled") {
      winnerSide = null;
    }

    const showScore = uiStatus === "completed";

    results.push({
      key: match.key,
      matchNumber: index + 1,
      homeLabel: match.homeLabel,
      awayLabel: match.awayLabel,
      winnerSide,
      uiStatus,
      scoreLabel: showScore
        ? `${control.homeScore}–${control.awayScore}`
        : null,
      statusLabel: showScore
        ? null
        : LEAGUE_NIGHT_MATCH_STATUS_LABEL[uiStatus],
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

export function isBoardOccupyingUiStatus(
  status: LeagueNightMatchUiStatus,
): boolean {
  return status === "live" || status === "paused";
}

/**
 * Another match already live/paused on this physical board (excludes self).
 * Waiting/ready matches may share a board number for later queueing.
 */
export function findMatchOccupyingBoard(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  board: number;
  excludeMatchKey?: string;
}): DraftLeagueMatch | null {
  const board = Math.max(1, Math.floor(input.board));

  for (const match of input.matches) {
    if (input.excludeMatchKey && match.key === input.excludeMatchKey) {
      continue;
    }
    const control = input.matchControls[match.key];
    if ((control?.board ?? null) !== board) {
      continue;
    }
    const status = resolveMatchUiStatus({
      match,
      control,
      homeReady: false,
      awayReady: false,
    });
    if (isBoardOccupyingUiStatus(status)) {
      return match;
    }
  }

  return null;
}

export function formatBoardOccupiedMessage(input: {
  board: number;
  occupant: DraftLeagueMatch;
  weekMatches: DraftLeagueMatch[];
}): string {
  const index = input.weekMatches.findIndex(
    (entry) => entry.key === input.occupant.key,
  );
  const matchLabel =
    index >= 0 ? `Match ${index + 1}` : "another match";
  return `Board ${input.board} is in use by ${matchLabel} (${input.occupant.homeLabel} vs ${input.occupant.awayLabel}). Finish or save that match before using this board.`;
}

export function boardSummary(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  boardCount: number;
}): { active: number; available: number; total: number } {
  const total = Math.max(1, Math.floor(input.boardCount));
  const occupiedBoards = new Set<number>();

  for (const match of input.matches) {
    const control = input.matchControls[match.key];
    const board = control?.board ?? null;
    if (board == null) {
      continue;
    }
    const status = resolveMatchUiStatus({
      match,
      control,
      homeReady: false,
      awayReady: false,
    });
    if (isBoardOccupyingUiStatus(status)) {
      occupiedBoards.add(board);
    }
  }

  const active = occupiedBoards.size;

  return {
    active,
    available: Math.max(0, total - active),
    total,
  };
}

/** Board numbers directors can assign for a night (1…venue board count). */
export function boardOptionsForNight(boardCount: number): number[] {
  const total = Math.max(1, Math.floor(boardCount));
  return Array.from({ length: total }, (_, index) => index + 1);
}

/**
 * Prefill empty board assignments in match order, cycling 1…venueBoardCount.
 * Does not overwrite director picks. Same board may still be shared later.
 */
export function prefillMatchBoards(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  boardCount: number;
}): Record<string, LeagueNightMatchControl> {
  const options = boardOptionsForNight(input.boardCount);
  if (options.length === 0) {
    return input.matchControls;
  }

  let changed = false;
  const next = { ...input.matchControls };
  const ordered = [...input.matches].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  let cursor = 0;

  for (const match of ordered) {
    const current = normalizeMatchControl(next[match.key]);
    if (current.board != null) {
      continue;
    }
    const board = options[cursor % options.length]!;
    cursor += 1;
    next[match.key] = {
      ...current,
      board,
    };
    changed = true;
  }

  return changed ? next : input.matchControls;
}

/** Prefill boards + team lineups for Match Control (skips director edits). */
export function prefillMatchControls(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  players: LeaguePlayer[];
  boardCount: number;
}): Record<string, LeagueNightMatchControl> {
  const withBoards = prefillMatchBoards({
    matches: input.matches,
    matchControls: input.matchControls,
    boardCount: input.boardCount,
  });
  return prefillBoardMatchLineups({
    matches: input.matches,
    matchControls: withBoards,
    players: input.players,
  });
}

/**
 * Assign a board to a match. Waiting/ready matches may share a board number
 * for later queueing; only one live/paused match may occupy a board at a time
 * (enforced when going live / launching scoring).
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
  const current = normalizeMatchControl(next[input.matchKey]);

  if (current.board === board) {
    return input.matchControls;
  }

  next[input.matchKey] = {
    ...current,
    board,
  };

  return next;
}

function boardLineupRoundKey(
  match: Pick<DraftLeagueMatch, "lineupRound">,
): number {
  return match.lineupRound != null && match.lineupRound >= 1
    ? match.lineupRound
    : 1;
}

function sortRosterPlayers(players: LeaguePlayer[]): LeaguePlayer[] {
  return [...players].sort((a, b) =>
    leaguePlayerDisplayName(a).localeCompare(
      leaguePlayerDisplayName(b),
      undefined,
      { sensitivity: "base" },
    ),
  );
}

function lineupUsageKey(
  teamId: string,
  lineupRound: number,
  boardFormat: string,
): string {
  return `${teamId}|${lineupRound}|${boardFormat}`;
}

function markLineupUsage(
  usage: Map<string, Set<string>>,
  teamId: string,
  lineupRound: number,
  boardFormat: string,
  playerIds: string[],
) {
  const key = lineupUsageKey(teamId, lineupRound, boardFormat);
  let set = usage.get(key);
  if (!set) {
    set = new Set();
    usage.set(key, set);
  }
  for (const id of playerIds) {
    if (id) {
      set.add(id);
    }
  }
}

function playersUsedAnyFormat(
  usage: Map<string, Set<string>>,
  teamId: string,
  lineupRound: number,
): Set<string> {
  const used = new Set<string>();
  for (const format of ["singles", "doubles"] as const) {
    const set = usage.get(lineupUsageKey(teamId, lineupRound, format));
    if (!set) {
      continue;
    }
    for (const id of set) {
      used.add(id);
    }
  }
  return used;
}

/**
 * Pick lineup ids for one side: prefer players not used yet this round, then
 * (doubles only) allow reuse of singles players when the roster is short.
 */
function pickLineupIdsForSide(input: {
  roster: LeaguePlayer[];
  slots: number;
  boardFormat: "singles" | "doubles";
  usedSameFormat: Set<string>;
  usedAnyFormat: Set<string>;
}): string[] {
  const roster = sortRosterPlayers(input.roster);
  const picked: string[] = [];

  for (const player of roster) {
    if (picked.length >= input.slots) {
      break;
    }
    if (
      !input.usedAnyFormat.has(player.id) &&
      !input.usedSameFormat.has(player.id)
    ) {
      picked.push(player.id);
    }
  }

  // Doubles on short rosters (e.g. team of 3 with 2 singles): reuse singles.
  if (picked.length < input.slots && input.boardFormat === "doubles") {
    for (const player of roster) {
      if (picked.length >= input.slots) {
        break;
      }
      if (
        !picked.includes(player.id) &&
        !input.usedSameFormat.has(player.id)
      ) {
        picked.push(player.id);
      }
    }
  }

  return picked;
}

/**
 * Prefill empty board-match lineups from team roster order + Night Lineup slots.
 * Prefers unused players each round (Singles 1 → first, Doubles → next, …).
 * Doubles may reuse singles players when the roster is too small for unique
 * assignments. Does not overwrite director edits.
 */
export function prefillBoardMatchLineups(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  players: LeaguePlayer[];
}): Record<string, LeagueNightMatchControl> {
  let changed = false;
  const next = { ...input.matchControls };
  const usage = new Map<string, Set<string>>();

  const ordered = [...input.matches].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  const rememberExisting = (match: DraftLeagueMatch) => {
    const control = normalizeMatchControl(next[match.key]);
    const format = match.boardFormat;
    if (format !== "singles" && format !== "doubles") {
      return;
    }
    const round = boardLineupRoundKey(match);
    if (match.homeKind === "team" && match.homeId) {
      markLineupUsage(
        usage,
        match.homeId,
        round,
        format,
        control.homePlayerIds,
      );
    }
    if (match.awayKind === "team" && match.awayId) {
      markLineupUsage(
        usage,
        match.awayId,
        round,
        format,
        control.awayPlayerIds,
      );
    }
  };

  for (const match of ordered) {
    const slots = lineupSlotsForBoardMatch(match);
    const format = match.boardFormat;
    if (
      slots <= 0 ||
      (format !== "singles" && format !== "doubles") ||
      match.homeKind !== "team" ||
      match.awayKind !== "team" ||
      !match.homeId ||
      !match.awayId
    ) {
      continue;
    }

    const current = normalizeMatchControl(next[match.key]);
    if (
      isMatchLineupComplete({ match, control: current }) ||
      current.homePlayerIds.some(Boolean) ||
      current.awayPlayerIds.some(Boolean)
    ) {
      // Leave partially-edited rows alone; still track usage for later matches.
      if (
        current.homePlayerIds.some(Boolean) ||
        current.awayPlayerIds.some(Boolean)
      ) {
        next[match.key] = current;
      }
      rememberExisting(match);
      continue;
    }

    const round = boardLineupRoundKey(match);
    const homeIds = pickLineupIdsForSide({
      roster: input.players.filter((player) => player.teamId === match.homeId),
      slots,
      boardFormat: format,
      usedSameFormat:
        usage.get(lineupUsageKey(match.homeId, round, format)) ?? new Set(),
      usedAnyFormat: playersUsedAnyFormat(usage, match.homeId, round),
    });
    const awayIds = pickLineupIdsForSide({
      roster: input.players.filter((player) => player.teamId === match.awayId),
      slots,
      boardFormat: format,
      usedSameFormat:
        usage.get(lineupUsageKey(match.awayId, round, format)) ?? new Set(),
      usedAnyFormat: playersUsedAnyFormat(usage, match.awayId, round),
    });

    if (homeIds.length < slots || awayIds.length < slots) {
      next[match.key] = current;
      continue;
    }

    next[match.key] = {
      ...current,
      homePlayerIds: homeIds,
      awayPlayerIds: awayIds,
    };
    markLineupUsage(usage, match.homeId, round, format, homeIds);
    markLineupUsage(usage, match.awayId, round, format, awayIds);
    changed = true;
  }

  return changed ? next : input.matchControls;
}

/**
 * Players already assigned for a team in the same lineup round + board format
 * (other matches). Singles and doubles may share players when the roster is short.
 */
export function playersUsedInLineupRound(input: {
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  teamId: string;
  lineupRound: number;
  boardFormat?: DraftLeagueMatch["boardFormat"];
  excludeMatchKey?: string;
}): Set<string> {
  const used = new Set<string>();

  for (const match of input.matches) {
    if (match.key === input.excludeMatchKey) {
      continue;
    }
    if (boardLineupRoundKey(match) !== input.lineupRound) {
      continue;
    }
    if (
      input.boardFormat &&
      match.boardFormat &&
      match.boardFormat !== input.boardFormat
    ) {
      continue;
    }

    const control = input.matchControls[match.key];
    if (!control) {
      continue;
    }

    if (match.homeId === input.teamId && match.homeKind === "team") {
      for (const id of control.homePlayerIds ?? []) {
        if (id) {
          used.add(id);
        }
      }
    }
    if (match.awayId === input.teamId && match.awayKind === "team") {
      for (const id of control.awayPlayerIds ?? []) {
        if (id) {
          used.add(id);
        }
      }
    }
  }

  return used;
}

function clearPlayerFromOtherLineups(input: {
  matchControls: Record<string, LeagueNightMatchControl>;
  matches: DraftLeagueMatch[];
  matchKey: string;
  teamId: string;
  lineupRound: number;
  boardFormat: DraftLeagueMatch["boardFormat"];
  playerId: string;
}): Record<string, LeagueNightMatchControl> {
  let next = input.matchControls;

  for (const match of input.matches) {
    if (match.key === input.matchKey) {
      continue;
    }
    if (boardLineupRoundKey(match) !== input.lineupRound) {
      continue;
    }
    if (
      input.boardFormat &&
      match.boardFormat &&
      match.boardFormat !== input.boardFormat
    ) {
      continue;
    }

    const control = normalizeMatchControl(next[match.key]);
    let homePlayerIds = control.homePlayerIds;
    let awayPlayerIds = control.awayPlayerIds;
    let touched = false;

    if (match.homeId === input.teamId && match.homeKind === "team") {
      const cleared = homePlayerIds.map((id) =>
        id === input.playerId ? "" : id,
      );
      if (cleared.some((id, index) => id !== (homePlayerIds[index] ?? ""))) {
        homePlayerIds = cleared.every((id) => !id) ? [] : cleared;
        touched = true;
      }
    }
    if (match.awayId === input.teamId && match.awayKind === "team") {
      const cleared = awayPlayerIds.map((id) =>
        id === input.playerId ? "" : id,
      );
      if (cleared.some((id, index) => id !== (awayPlayerIds[index] ?? ""))) {
        awayPlayerIds = cleared.every((id) => !id) ? [] : cleared;
        touched = true;
      }
    }

    if (touched) {
      if (next === input.matchControls) {
        next = { ...input.matchControls };
      }
      next[match.key] = {
        ...control,
        homePlayerIds,
        awayPlayerIds,
      };
    }
  }

  return next;
}

/**
 * Set one player slot on a board match lineup (singles or doubles pairings).
 * Slot arrays stay index-aligned (`""` = empty) until every slot is cleared.
 * Assigning a player clears them from other matches of the same board format
 * in the same lineup round (singles/doubles may share a player).
 */
export function assignMatchLineupPlayer(input: {
  matchControls: Record<string, LeagueNightMatchControl>;
  match: DraftLeagueMatch;
  matchKey: string;
  side: "home" | "away";
  slotIndex: number;
  playerId: string | null;
  matches?: DraftLeagueMatch[];
}): Record<string, LeagueNightMatchControl> {
  const slots = lineupSlotsForBoardMatch(input.match);
  if (slots <= 0 || input.slotIndex < 0 || input.slotIndex >= slots) {
    return input.matchControls;
  }

  let next = { ...input.matchControls };
  const current = normalizeMatchControl(next[input.matchKey]);
  const key = input.side === "home" ? "homePlayerIds" : "awayPlayerIds";
  const aligned = Array.from({ length: slots }, (_, index) => {
    const existing = current[key][index];
    return typeof existing === "string" && existing ? existing : "";
  });
  aligned[input.slotIndex] = input.playerId?.trim() ? input.playerId : "";

  next[input.matchKey] = {
    ...current,
    [key]: aligned.every((id) => !id) ? [] : aligned,
  };

  if (input.playerId && input.matches && input.matches.length > 0) {
    const teamId =
      input.side === "home" ? input.match.homeId : input.match.awayId;
    if (teamId) {
      next = clearPlayerFromOtherLineups({
        matchControls: next,
        matches: input.matches,
        matchKey: input.matchKey,
        teamId,
        lineupRound: boardLineupRoundKey(input.match),
        boardFormat: input.match.boardFormat,
        playerId: input.playerId,
      });
    }
  }

  return next;
}
