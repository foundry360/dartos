export const LEAGUE_FORMATS = [
  "singles",
  "team",
  "doubles",
  "blind_draw",
  "ladder",
] as const;

export type LeagueFormat = (typeof LEAGUE_FORMATS)[number];

export const LEAGUE_FORMAT_OPTIONS: Array<{
  value: LeagueFormat;
  label: string;
  description?: string;
}> = [
  { value: "singles", label: "Singles League" },
  { value: "team", label: "Team League" },
  { value: "doubles", label: "Doubles League" },
  { value: "blind_draw", label: "Blind Draw League" },
  { value: "ladder", label: "Ladder League" },
];

export const LEAGUE_COMPETITION_FORMATS = [
  "round_robin",
  "points",
  "ladder",
  "custom",
] as const;

export type LeagueCompetitionFormat =
  (typeof LEAGUE_COMPETITION_FORMATS)[number];

export const LEAGUE_COMPETITION_FORMAT_OPTIONS: Array<{
  value: LeagueCompetitionFormat;
  label: string;
}> = [
  { value: "round_robin", label: "Round Robin" },
  { value: "points", label: "Points League" },
  { value: "ladder", label: "Ladder" },
  { value: "custom", label: "Custom" },
];

export function isLeagueFormat(value: string): value is LeagueFormat {
  return (LEAGUE_FORMATS as readonly string[]).includes(value);
}

export function isLeagueCompetitionFormat(
  value: string,
): value is LeagueCompetitionFormat {
  return (LEAGUE_COMPETITION_FORMATS as readonly string[]).includes(value);
}

export function formatLeagueFormatLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return LEAGUE_FORMAT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/** Display label for league detail. */
export function formatLeagueFormatDetailLabel(
  value: string | null | undefined,
): string | null {
  return formatLeagueFormatLabel(value);
}

export function formatLeagueCompetitionFormatLabel(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return (
    LEAGUE_COMPETITION_FORMAT_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export const LEAGUE_GAME_FORMATS = [
  "x01",
  "cricket",
  "tactics",
  "mixed",
  "custom",
] as const;

export type LeagueGameFormat = (typeof LEAGUE_GAME_FORMATS)[number];

/** Legacy X01 game_format values stored before Starting Score moved to Game Rules. */
const LEGACY_X01_GAME_FORMATS = ["501", "301", "701"] as const;

export const LEAGUE_GAME_FORMAT_OPTIONS: Array<{
  value: LeagueGameFormat;
  label: string;
}> = [
  { value: "x01", label: "X01" },
  { value: "cricket", label: "Cricket" },
  { value: "tactics", label: "Tactics" },
  { value: "mixed", label: "Mixed Games" },
  { value: "custom", label: "Custom" },
];

export function normalizeLeagueGameFormat(
  value: string | null | undefined,
): LeagueGameFormat | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (
    (LEGACY_X01_GAME_FORMATS as readonly string[]).includes(normalized) ||
    normalized === "x01"
  ) {
    return "x01";
  }

  return (LEAGUE_GAME_FORMATS as readonly string[]).includes(normalized)
    ? (normalized as LeagueGameFormat)
    : null;
}

export function isLeagueGameFormat(value: string): value is LeagueGameFormat {
  return normalizeLeagueGameFormat(value) !== null;
}

export function formatLeagueGameFormatLabel(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeLeagueGameFormat(value);

  if (!normalized) {
    return value?.trim() ? value : null;
  }

  return (
    LEAGUE_GAME_FORMAT_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? normalized
  );
}

/** e.g. "Sept 3 – Dec 10" (years included when they differ). */
export function formatLeagueDateRange(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): string | null {
  if (!startsAt || !endsAt) {
    return null;
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(start);
  const endLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

/** e.g. "Tuesday Nights • 7:00 PM" from season start datetime. */
export function formatLeagueNightSchedule(
  startsAt: string | null | undefined,
): string | null {
  if (!startsAt) {
    return null;
  }

  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${weekday} Nights • ${time}`;
}

/** e.g. "Tuesday Nights at 7:00 PM". */
export function formatLeagueNightScheduleAt(
  startsAt: string | null | undefined,
): string | null {
  if (!startsAt) {
    return null;
  }

  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${weekday} Nights at ${time}`;
}

/** e.g. "7:00 PM". */
export function formatLeagueTime(
  startsAt: string | null | undefined,
): string | null {
  if (!startsAt) {
    return null;
  }

  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLeagueWeekday(
  startsAt: string | null | undefined,
): string | null {
  if (!startsAt) {
    return null;
  }

  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
}

/** e.g. "Sep 3, 2026". */
export function formatLeagueDate(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Convert a `YYYY-MM-DDTHH:MM` local value into an ISO timestamp. */
export function datetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  if (
    ![year, month, day, hour, minute, second].every((part) =>
      Number.isFinite(part),
    )
  ) {
    return null;
  }

  // Construct in local time — avoid browser-specific string parsing.
  const date = new Date(year, month - 1, day, hour, minute, second);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

/** Split an ISO timestamp into local `YYYY-MM-DD` and `HH:MM` parts. */
export function isoToLocalDateAndTime(
  value: string | null | undefined,
): { date: string; time: string } | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function padLocalPart(part: number): string {
  return String(part).padStart(2, "0");
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${padLocalPart(date.getMonth() + 1)}-${padLocalPart(date.getDate())}`;
}

function parseLocalDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Apply a match weekday + HH:MM time onto an existing league start/end range,
 * shifting the start calendar day forward to the chosen weekday when needed.
 */
export function applyMatchNightToLeagueDates(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  matchWeekday: number | null,
  matchTime: string,
): { startsAtLocal: string; endsAtLocal: string } {
  const startParts = isoToLocalDateAndTime(startsAt);
  const endParts = isoToLocalDateAndTime(endsAt);
  const now = new Date();
  const fallbackDate = formatLocalDate(now);
  const timeMatch = matchTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  const time = timeMatch
    ? `${padLocalPart(Number(timeMatch[1]))}:${padLocalPart(Number(timeMatch[2]))}`
    : (startParts?.time ?? "19:00");

  let startDate =
    parseLocalDate(startParts?.date ?? fallbackDate) ??
    new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (matchWeekday != null && Number.isFinite(matchWeekday)) {
    const weekday = ((Math.trunc(matchWeekday) % 7) + 7) % 7;
    const delta = (weekday - startDate.getDay() + 7) % 7;
    startDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + delta,
    );
  }

  let endDate =
    parseLocalDate(endParts?.date ?? formatLocalDate(startDate)) ?? startDate;

  if (endDate.getTime() < startDate.getTime()) {
    endDate = startDate;
  }

  return {
    startsAtLocal: `${formatLocalDate(startDate)}T${time}`,
    endsAtLocal: `${formatLocalDate(endDate)}T${time}`,
  };
}

export function formatLeagueDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export type LeagueScheduleStatus = "active" | "upcoming" | "past" | "unknown";

export const LEAGUE_SCHEDULE_STATUS_LABEL: Record<LeagueScheduleStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  past: "Completed",
  unknown: "—",
};

export function formatLeagueScheduleStatusLabel(
  status: LeagueScheduleStatus,
): string {
  return LEAGUE_SCHEDULE_STATUS_LABEL[status];
}

/** Player-facing My Leagues status (On Roster / Registered / In Progress / Completed). */
export type PlayerLeagueStatus =
  | "on_roster"
  | "registered"
  | "in_progress"
  | "completed";

export function getPlayerLeagueStatus(
  league: {
    starts_at?: string | null;
    ends_at?: string | null;
    published_at?: string | null;
  },
  now = new Date(),
): PlayerLeagueStatus {
  const scheduleStatus = getLeagueScheduleStatus(league, now);

  if (scheduleStatus === "past") {
    return "completed";
  }

  if (!league.published_at) {
    return "on_roster";
  }

  if (scheduleStatus === "active") {
    return "in_progress";
  }

  return "registered";
}

export function formatPlayerLeagueStatusLabel(
  status: PlayerLeagueStatus,
): string {
  switch (status) {
    case "on_roster":
      return "On Roster";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Registered";
  }
}

export type LeagueViewFilter = "7d" | "30d" | "90d" | "120d";

export const LEAGUE_VIEW_FILTER_OPTIONS: Array<{
  value: LeagueViewFilter;
  label: string;
}> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "120d", label: "120 days" },
];

export function leagueViewFilterDayCount(filter: LeagueViewFilter): number {
  switch (filter) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "120d":
      return 120;
  }
}

/** Sparkline point count is capped; day labels still span 1…periodDays. */
export function leagueViewChartPointCount(filter: LeagueViewFilter): number {
  return Math.min(leagueViewFilterDayCount(filter), 10);
}

/** League is active when now is between starts_at and ends_at (inclusive). */
export function isLeagueActive(
  league: { starts_at?: string | null; ends_at?: string | null },
  now = new Date(),
): boolean {
  return getLeagueScheduleStatus(league, now) === "active";
}

export function isLeagueUpcoming(
  league: { starts_at?: string | null; ends_at?: string | null },
  now = new Date(),
): boolean {
  return getLeagueScheduleStatus(league, now) === "upcoming";
}

export function isLeaguePast(
  league: { starts_at?: string | null; ends_at?: string | null },
  now = new Date(),
): boolean {
  return getLeagueScheduleStatus(league, now) === "past";
}

export function getLeagueScheduleStatus(
  league: { starts_at?: string | null; ends_at?: string | null },
  now = new Date(),
): LeagueScheduleStatus {
  if (!league.starts_at || !league.ends_at) {
    return "unknown";
  }

  const startsAt = new Date(league.starts_at).getTime();
  const endsAt = new Date(league.ends_at).getTime();
  const current = now.getTime();

  if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) {
    return "unknown";
  }

  if (current < startsAt) {
    return "upcoming";
  }

  if (current > endsAt) {
    return "past";
  }

  return "active";
}

/** Inclusive rolling date window for a dashboard view filter. */
export function getLeagueViewFilterRange(
  filter: LeagueViewFilter,
  now = new Date(),
): { start: Date; end: Date } {
  const days = leagueViewFilterDayCount(filter);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function matchesLeagueViewFilter(
  league: { starts_at?: string | null; ends_at?: string | null },
  filter: LeagueViewFilter,
  now = new Date(),
): boolean {
  // Incomplete schedules stay visible so migrated / unfinished leagues aren't lost.
  if (!league.starts_at || !league.ends_at) {
    return true;
  }

  const startsAt = new Date(league.starts_at).getTime();
  const endsAt = new Date(league.ends_at).getTime();

  if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) {
    return true;
  }

  // Upcoming leagues always appear — a just-created league that starts next month
  // must still show on the default "30 days" dashboard tab.
  if (startsAt > now.getTime()) {
    return true;
  }

  const range = getLeagueViewFilterRange(filter, now);
  return startsAt <= range.end.getTime() && endsAt >= range.start.getTime();
}

export function leagueViewFilterTitle(filter: LeagueViewFilter): string {
  return (
    LEAGUE_VIEW_FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? "30 days"
  );
}

export function leagueViewStatLabel(
  _filter: LeagueViewFilter,
  noun: "leagues" | "tournaments" | "players" | "teams",
): string {
  return noun.charAt(0).toUpperCase() + noun.slice(1);
}

/** X-axis time-bucket label for rolling day filters. */
export function leagueViewChartXLabel(_filter: LeagueViewFilter): string {
  return "Day";
}
