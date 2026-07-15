export const LEAGUE_FORMATS = [
  "cricket",
  "tactics",
  "201",
  "301",
  "501",
  "701",
] as const;

export type LeagueFormat = (typeof LEAGUE_FORMATS)[number];

export const LEAGUE_FORMAT_OPTIONS: Array<{
  value: LeagueFormat;
  label: string;
  description?: string;
}> = [
  { value: "cricket", label: "Cricket", description: "15–20 & Bull" },
  { value: "tactics", label: "Tactics", description: "10–20 & Bull" },
  { value: "201", label: "201", description: "X01" },
  { value: "301", label: "301", description: "X01" },
  { value: "501", label: "501", description: "X01" },
  { value: "701", label: "701", description: "X01" },
];

export function isLeagueFormat(value: string): value is LeagueFormat {
  return (LEAGUE_FORMATS as readonly string[]).includes(value);
}

export function formatLeagueFormatLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return LEAGUE_FORMAT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/** Display label for league detail (X01 formats default to double-out). */
export function formatLeagueFormatDetailLabel(
  value: string | null | undefined,
): string | null {
  const label = formatLeagueFormatLabel(value);

  if (!label) {
    return null;
  }

  if (value === "201" || value === "301" || value === "501" || value === "701") {
    return `${label} Double Out`;
  }

  return label;
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

/** Convert a `datetime-local` value into an ISO timestamp. */
export function datetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
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
  upcoming: "Not Yet Started",
  past: "Complete",
  unknown: "—",
};

export function formatLeagueScheduleStatusLabel(
  status: LeagueScheduleStatus,
): string {
  return LEAGUE_SCHEDULE_STATUS_LABEL[status];
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
