import {
  formatLeagueCompetitionFormatLabel,
  formatLeagueDate,
  formatLeagueFormatDetailLabel,
  formatLeagueGameFormatLabel,
  formatLeagueScheduleStatusLabel,
  formatLeagueTime,
  formatLeagueWeekday,
  getLeagueScheduleStatus,
  type LeagueScheduleStatus,
} from "@/features/leagues/lib/league-formats";
import { formatCountdown } from "@/features/leagues/lib/league-night";
import type { LeagueDetailSectionId } from "@/features/leagues/lib/league-detail-sections";
import {
  groupMatchesByWeek,
  isTerminalLeagueMatchStatus,
  type DraftLeagueMatch,
  type LeagueScheduleModel,
} from "@/features/leagues/lib/league-schedule";
import type { SampleLeagueActivityItem } from "@/features/leagues/lib/sample-league-dashboard";
import type { LeagueRow } from "@/lib/supabase/database.types";

export type LeagueOverviewLifecycle = "setup" | "active" | "completed";

export interface LeagueOverviewChecklistItem {
  id: string;
  label: string;
  complete: boolean;
  actionLabel?: string;
  actionSection?: LeagueDetailSectionId;
}

export interface LeagueOverviewNextNight {
  weekNumber: number;
  weekdayLabel: string | null;
  dateLabel: string | null;
  timeLabel: string | null;
  startsInLabel: string | null;
  matchCount: number;
  playersExpected: number;
}

export interface LeagueOverviewRecentResult {
  id: string;
  homeLabel: string;
  awayLabel: string;
  weekNumber: number;
  summary: string;
}

export interface LeagueOverviewQuickAction {
  id: string;
  label: string;
  section: LeagueDetailSectionId | "settings";
  primary?: boolean;
}

export interface LeagueOverviewDashboard {
  leagueName: string;
  venueName: string;
  seasonName: string | null;
  formatLabel: string | null;
  competitionFormatLabel: string | null;
  gameFormatLabel: string | null;
  matchDay: string | null;
  matchTime: string | null;
  startsOn: string | null;
  endsOn: string | null;
  statusLabel: string;
  statusKind: "setup" | "active" | "upcoming" | "completed";
  lifecycle: LeagueOverviewLifecycle;
  isSingles: boolean;
  playerCount: number;
  maxPlayers: number | null;
  teamCount: number;
  currentWeek: number | null;
  totalWeeks: number;
  progressPercent: number;
  nextNightSummary: {
    weekNumber: number;
    dateLabel: string | null;
    weekdayLabel: string | null;
    timeLabel: string | null;
    startsInLabel: string | null;
  } | null;
  checklist: LeagueOverviewChecklistItem[];
  nextNight: LeagueOverviewNextNight | null;
  canOpenLeagueNight: boolean;
  activity: SampleLeagueActivityItem[];
  quickActions: LeagueOverviewQuickAction[];
  recentResults: LeagueOverviewRecentResult[];
  emptyCopy: string;
}

function formatStartsInLabel(target: Date, now = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return "Starting soon";
  }

  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) {
    return `Starts in ${formatCountdown(target, now).label}`;
  }
  if (days === 1) {
    return "Starts in 1 day";
  }
  if (days < 14) {
    return `Starts in ${days} days`;
  }

  return `Starts in ${formatCountdown(target, now).label}`;
}

function resolveLifecycle(
  isPublished: boolean,
  scheduleStatus: LeagueScheduleStatus,
): LeagueOverviewLifecycle {
  if (scheduleStatus === "past") {
    return "completed";
  }
  if (!isPublished) {
    return "setup";
  }
  return "active";
}

function resolveStatusBadge(
  isPublished: boolean,
  scheduleStatus: LeagueScheduleStatus,
): { label: string; kind: LeagueOverviewDashboard["statusKind"] } {
  if (!isPublished) {
    return { label: "Setup", kind: "setup" };
  }
  if (scheduleStatus === "past") {
    return { label: "Completed", kind: "completed" };
  }
  if (scheduleStatus === "upcoming") {
    return { label: "Upcoming", kind: "upcoming" };
  }
  if (scheduleStatus === "active") {
    return { label: "Active", kind: "active" };
  }
  return {
    label: formatLeagueScheduleStatusLabel(scheduleStatus),
    kind: "active",
  };
}

function pickNextWeek(matches: DraftLeagueMatch[], now = new Date()) {
  const weeks = groupMatchesByWeek(matches);
  if (weeks.length === 0) {
    return null;
  }

  const upcoming = weeks.find((week) => {
    const first = week.matches[0];
    if (!first) {
      return false;
    }
    const at = new Date(first.scheduledAt).getTime();
    return !Number.isNaN(at) && at >= now.getTime() - 12 * 60 * 60 * 1000;
  });

  return upcoming ?? weeks[weeks.length - 1] ?? null;
}

function resolveCurrentWeek(
  matches: DraftLeagueMatch[],
  totalWeeks: number,
  now = new Date(),
): { currentWeek: number | null; progressPercent: number } {
  if (totalWeeks <= 0 || matches.length === 0) {
    return { currentWeek: null, progressPercent: 0 };
  }

  const weeks = groupMatchesByWeek(matches);
  let completedWeeks = 0;
  let currentWeek: number | null = null;

  for (const week of weeks) {
    const allDone = week.matches.every((match) =>
      isTerminalLeagueMatchStatus(match.status),
    );
    if (allDone) {
      completedWeeks += 1;
      continue;
    }

    const first = week.matches[0];
    const at = first ? new Date(first.scheduledAt).getTime() : NaN;
    if (!Number.isNaN(at) && at <= now.getTime()) {
      currentWeek = week.weekNumber;
    } else if (currentWeek == null) {
      currentWeek = week.weekNumber;
    }
    break;
  }

  if (currentWeek == null) {
    currentWeek =
      completedWeeks >= totalWeeks
        ? totalWeeks
        : (weeks[completedWeeks]?.weekNumber ?? totalWeeks);
  }

  const progressPercent = Math.min(
    100,
    Math.round((completedWeeks / totalWeeks) * 100),
  );

  return { currentWeek, progressPercent };
}

function buildRecentResults(
  matches: DraftLeagueMatch[],
): LeagueOverviewRecentResult[] {
  return [...matches]
    .filter(
      (match) =>
        match.status === "completed" ||
        match.status === "forfeited" ||
        match.status === "walkover",
    )
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 3)
    .map((match) => ({
      id: match.key,
      homeLabel: match.homeLabel,
      awayLabel: match.awayLabel,
      weekNumber: match.weekNumber,
      summary:
        match.status === "forfeited"
          ? `${match.homeLabel} vs ${match.awayLabel} (Forfeited)`
          : match.status === "walkover"
            ? `${match.homeLabel} vs ${match.awayLabel} (Walkover)`
            : `${match.homeLabel} vs ${match.awayLabel}`,
    }));
}

function buildActivity(input: {
  league: LeagueRow;
  playerCount: number;
  teamCount: number;
  schedule: LeagueScheduleModel | null;
  recentResults: LeagueOverviewRecentResult[];
  sampleActivity?: SampleLeagueActivityItem[] | null;
}): SampleLeagueActivityItem[] {
  if (input.sampleActivity && input.sampleActivity.length > 0) {
    return input.sampleActivity.slice(0, 8);
  }

  const items: SampleLeagueActivityItem[] = [];

  for (const result of input.recentResults) {
    items.push({
      id: `result-${result.id}`,
      title: `${result.homeLabel} vs ${result.awayLabel} completed`,
      timeLabel: `Week ${result.weekNumber}`,
    });
  }

  if (input.schedule?.status === "published" && input.schedule.publishedAt) {
    items.push({
      id: "schedule-published",
      title: "League schedule published",
      timeLabel: formatLeagueDate(input.schedule.publishedAt) ?? "Recently",
    });
  } else if (input.schedule && input.schedule.matches.length > 0) {
    items.push({
      id: "schedule-draft",
      title: "Schedule draft saved",
      timeLabel: formatLeagueDate(input.schedule.updatedAt) ?? "Recently",
    });
  }

  if (input.teamCount > 0) {
    items.push({
      id: "teams",
      title: `${input.teamCount} team${input.teamCount === 1 ? "" : "s"} on roster`,
      timeLabel: "Teams",
    });
  }

  if (input.playerCount > 0) {
    items.push({
      id: "players",
      title: `${input.playerCount} player${input.playerCount === 1 ? "" : "s"} added`,
      timeLabel: "Players",
    });
  }

  if (input.league.published_at) {
    items.push({
      id: "published",
      title: "League published",
      timeLabel: formatLeagueDate(input.league.published_at) ?? "Recently",
    });
  }

  if (input.league.created_at) {
    items.push({
      id: "created",
      title: "League created",
      timeLabel: formatLeagueDate(input.league.created_at) ?? "Recently",
    });
  }

  return items.slice(0, 8);
}

function buildQuickActions(input: {
  isSingles: boolean;
  hasPlayers: boolean;
  hasTeams: boolean;
  hasSchedule: boolean;
  schedulePublished: boolean;
  canOpenLeagueNight: boolean;
  lifecycle: LeagueOverviewLifecycle;
}): LeagueOverviewQuickAction[] {
  const actions: LeagueOverviewQuickAction[] = [];

  if (input.lifecycle !== "completed") {
    actions.push({ id: "add-player", label: "Add Player", section: "players" });
  }

  if (!input.isSingles && input.lifecycle !== "completed") {
    actions.push({ id: "create-team", label: "Create Team", section: "teams" });
  }

  if (!input.hasSchedule) {
    actions.push({
      id: "generate-schedule",
      label: "Generate Schedule",
      section: "schedule",
      primary: true,
    });
  } else if (!input.schedulePublished) {
    actions.push({
      id: "publish-schedule",
      label: "Publish Schedule",
      section: "schedule",
      primary: true,
    });
  }

  if (input.canOpenLeagueNight) {
    actions.push({
      id: "open-night",
      label: "Open League Night",
      section: "night",
      primary: !actions.some((action) => action.primary),
    });
  }

  if (input.hasSchedule || input.lifecycle === "active") {
    actions.push({
      id: "standings",
      label: "View Standings",
      section: "standings",
    });
  }

  actions.push({
    id: "settings",
    label: "Manage Settings",
    section: "settings",
  });

  return actions.slice(0, 6);
}

export function buildLeagueOverviewDashboard(input: {
  league: LeagueRow;
  leagueName: string;
  venueName: string;
  seasonName: string | null;
  playerCount: number;
  maxPlayers: number | null;
  teamCount: number;
  isSingles: boolean;
  hasRules: boolean;
  isPublished: boolean;
  schedule: LeagueScheduleModel | null;
  canOpenLeagueNight: boolean;
  sampleActivity?: SampleLeagueActivityItem[] | null;
}): LeagueOverviewDashboard {
  const {
    league,
    venueName,
    seasonName,
    playerCount,
    maxPlayers,
    teamCount,
    isSingles,
    hasRules,
    isPublished,
    schedule,
    canOpenLeagueNight,
  } = input;

  const hasPlayers = playerCount > 0;
  const hasTeams = isSingles || teamCount > 0;
  const hasSchedule = Boolean(schedule && schedule.matches.length > 0);
  const schedulePublished = schedule?.status === "published";
  const venueAssigned = Boolean(venueName.trim());
  const detailsComplete = Boolean(
    league.name?.trim() &&
      league.format &&
      league.competition_format &&
      league.game_format &&
      league.starts_at &&
      league.ends_at &&
      venueAssigned,
  );

  const scheduleStatus = getLeagueScheduleStatus(league);
  const lifecycle = resolveLifecycle(isPublished, scheduleStatus);
  const status = resolveStatusBadge(isPublished, scheduleStatus);

  const matches = schedule?.matches ?? [];
  const totalWeeks = Math.max(schedule?.weeks ?? 0, groupMatchesByWeek(matches).length);
  const { currentWeek, progressPercent } = resolveCurrentWeek(
    matches,
    totalWeeks,
  );

  const nextWeek = pickNextWeek(matches);
  const nextAt =
    nextWeek?.matches[0] != null
      ? new Date(nextWeek.matches[0].scheduledAt)
      : league.starts_at
        ? new Date(league.starts_at)
        : null;
  const nextValid = nextAt && !Number.isNaN(nextAt.getTime()) ? nextAt : null;

  const nextNight: LeagueOverviewNextNight | null = nextWeek
    ? {
        weekNumber: nextWeek.weekNumber,
        weekdayLabel:
          formatLeagueWeekday(nextWeek.matches[0]?.scheduledAt) ??
          formatLeagueWeekday(league.starts_at),
        dateLabel: nextWeek.dateLabel !== "—" ? nextWeek.dateLabel : null,
        timeLabel:
          nextWeek.timeLabel !== "—"
            ? nextWeek.timeLabel
            : formatLeagueTime(league.starts_at),
        startsInLabel: nextValid ? formatStartsInLabel(nextValid) : null,
        matchCount: nextWeek.matches.length,
        playersExpected: playerCount,
      }
    : nextValid
      ? {
          weekNumber: 1,
          weekdayLabel: formatLeagueWeekday(league.starts_at),
          dateLabel: formatLeagueDate(league.starts_at),
          timeLabel: formatLeagueTime(league.starts_at),
          startsInLabel: formatStartsInLabel(nextValid),
          matchCount: 0,
          playersExpected: playerCount,
        }
      : null;

  const checklist: LeagueOverviewChecklistItem[] = [
    {
      id: "venue",
      label: "Venue Assigned",
      complete: venueAssigned && detailsComplete,
      actionLabel:
        venueAssigned && detailsComplete ? undefined : "Complete Details",
      actionSection: "details",
    },
    {
      id: "rules",
      label: "Game Rules Configured",
      complete: hasRules,
      actionLabel: hasRules ? undefined : "Set Game Rules",
      actionSection: "rules",
    },
    {
      id: "players",
      label: "Players Added",
      complete: hasPlayers,
      actionLabel: hasPlayers ? undefined : "Add Players",
      actionSection: "players",
    },
    {
      id: "teams",
      label: isSingles ? "Teams (not required)" : "Teams Created",
      complete: hasTeams,
      actionLabel: isSingles || hasTeams ? undefined : "Create Teams",
      actionSection: isSingles ? undefined : "teams",
    },
    {
      id: "schedule",
      label: "Schedule Published",
      complete: schedulePublished,
      actionLabel: schedulePublished
        ? undefined
        : hasSchedule
          ? "Publish Schedule"
          : "Create Schedule",
      actionSection: "schedule",
    },
    {
      id: "night-ready",
      label: "Ready for League Night",
      complete: isPublished && schedulePublished,
      actionLabel:
        isPublished && schedulePublished
          ? undefined
          : !isPublished
            ? undefined
            : "Publish Schedule",
      actionSection:
        isPublished && !schedulePublished ? "schedule" : undefined,
    },
  ];

  const recentResults = buildRecentResults(matches);
  const activity = buildActivity({
    league,
    playerCount,
    teamCount,
    schedule,
    recentResults,
    sampleActivity: input.sampleActivity,
  });

  const emptyCopy =
    lifecycle === "setup"
      ? "Your league is ready to configure."
      : lifecycle === "completed"
        ? "This league season is complete. Review final standings and results."
        : "Your league is live. Keep an eye on the next night and anything that needs attention.";

  return {
    leagueName: input.leagueName,
    venueName,
    seasonName,
    formatLabel: formatLeagueFormatDetailLabel(league.format),
    competitionFormatLabel: formatLeagueCompetitionFormatLabel(
      league.competition_format,
    ),
    gameFormatLabel: formatLeagueGameFormatLabel(league.game_format),
    matchDay: formatLeagueWeekday(league.starts_at),
    matchTime: formatLeagueTime(league.starts_at),
    startsOn: formatLeagueDate(league.starts_at),
    endsOn: formatLeagueDate(league.ends_at),
    statusLabel: status.label,
    statusKind: status.kind,
    lifecycle,
    isSingles,
    playerCount,
    maxPlayers,
    teamCount,
    currentWeek,
    totalWeeks,
    progressPercent,
    nextNightSummary: nextNight
      ? {
          weekNumber: nextNight.weekNumber,
          dateLabel: nextNight.dateLabel,
          weekdayLabel: nextNight.weekdayLabel,
          timeLabel: nextNight.timeLabel,
          startsInLabel: nextNight.startsInLabel,
        }
      : null,
    checklist,
    nextNight,
    canOpenLeagueNight,
    activity,
    quickActions: buildQuickActions({
      isSingles,
      hasPlayers,
      hasTeams,
      hasSchedule,
      schedulePublished,
      canOpenLeagueNight,
      lifecycle,
    }),
    recentResults,
    emptyCopy,
  };
}
