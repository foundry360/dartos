import {
  formatLeagueCompetitionFormatLabel,
  formatLeagueDate,
  formatLeagueDateRange,
  formatLeagueFormatLabel,
  formatLeagueGameFormatLabel,
  formatLeagueTime,
  formatLeagueWeekday,
} from "@/features/leagues/lib/league-formats";
import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import type { LeagueRow } from "@/lib/supabase/database.types";

export const SCHEDULE_FREQUENCIES = ["weekly", "biweekly", "custom"] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export const SCHEDULE_PATTERNS = ["round_robin", "custom"] as const;
export type SchedulePattern = (typeof SCHEDULE_PATTERNS)[number];

export const SCHEDULE_STATUSES = ["draft", "published"] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export const LEAGUE_MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type LeagueMatchStatus = (typeof LEAGUE_MATCH_STATUSES)[number];

export interface ScheduleParticipant {
  id: string;
  label: string;
  kind: "team" | "player";
}

export interface ScheduleRules {
  frequency: ScheduleFrequency;
  matchWeekday: number | null;
  matchTime: string;
  weeks: number;
  matchesPerNight: number;
  pattern: SchedulePattern;
}

export interface DraftLeagueMatch {
  key: string;
  weekNumber: number;
  scheduledAt: string;
  homeId: string | null;
  awayId: string | null;
  homeLabel: string;
  awayLabel: string;
  homeKind: "team" | "player";
  awayKind: "team" | "player";
  sortOrder: number;
  status: LeagueMatchStatus;
}

export interface LeagueScheduleWeek {
  weekNumber: number;
  dateLabel: string;
  timeLabel: string;
  matches: DraftLeagueMatch[];
}

export interface LeagueScheduleModel {
  id: string;
  leagueId: string;
  status: ScheduleStatus;
  frequency: ScheduleFrequency;
  matchWeekday: number | null;
  matchTime: string | null;
  weeks: number;
  matchesPerNight: number;
  pattern: SchedulePattern;
  publishedAt: string | null;
  matches: DraftLeagueMatch[];
  createdAt: string;
  updatedAt: string;
}

export interface LeagueScheduleSetupSummary {
  leagueName: string;
  leagueTypeLabel: string | null;
  competitionFormatLabel: string | null;
  gameFormatLabel: string | null;
  seasonLabel: string | null;
  matchDay: string | null;
  matchTime: string | null;
  playerCount: number;
  teamCount: number;
  seasonName: string | null;
}

export function buildScheduleSetupSummary(input: {
  league: LeagueRow;
  seasonName: string | null;
  playerCount: number;
  teamCount: number;
}): LeagueScheduleSetupSummary {
  const { league, seasonName, playerCount, teamCount } = input;

  return {
    leagueName: league.name,
    leagueTypeLabel: formatLeagueFormatLabel(league.format),
    competitionFormatLabel: formatLeagueCompetitionFormatLabel(
      league.competition_format,
    ),
    gameFormatLabel: formatLeagueGameFormatLabel(league.game_format),
    seasonLabel: formatLeagueDateRange(league.starts_at, league.ends_at),
    matchDay: formatLeagueWeekday(league.starts_at),
    matchTime: formatLeagueTime(league.starts_at),
    playerCount,
    teamCount,
    seasonName,
  };
}

export function defaultScheduleRulesFromLeague(league: LeagueRow): ScheduleRules {
  const start = league.starts_at ? new Date(league.starts_at) : null;
  const end = league.ends_at ? new Date(league.ends_at) : null;
  const matchWeekday =
    start && !Number.isNaN(start.getTime()) ? start.getDay() : null;
  const matchTime =
    start && !Number.isNaN(start.getTime())
      ? `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
      : "19:00";

  let weeks = 8;
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    const dayMs = 24 * 60 * 60 * 1000;
    const spanDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / dayMs) + 1,
    );
    weeks = Math.max(1, Math.ceil(spanDays / 7));
  }

  return {
    frequency: "weekly",
    matchWeekday,
    matchTime,
    weeks,
    matchesPerNight: 2,
    pattern: "round_robin",
  };
}

/** Full-round night size: everyone plays once (bye rounds excluded separately). */
export function defaultMatchesPerNight(participantCount: number): number {
  return Math.max(1, Math.floor(participantCount / 2));
}

export function participantsFromLeague(input: {
  leagueType: string | null | undefined;
  teams: LeagueTeam[];
  players: LeaguePlayer[];
}): ScheduleParticipant[] {
  const format = (input.leagueType || "").toLowerCase();
  const activeTeams = input.teams.filter((team) => team.status === "active");
  const activePlayers = input.players.filter(
    (player) => player.leagueStatus !== "inactive",
  );

  if (format === "singles") {
    return activePlayers.map((player) => ({
      id: player.id,
      label: `${player.firstName} ${player.lastName}`.trim() || "Player",
      kind: "player" as const,
    }));
  }

  // Team, doubles, blind_draw, ladder — prefer teams when present.
  if (activeTeams.length >= 2) {
    return activeTeams.map((team) => ({
      id: team.id,
      label: team.name,
      kind: "team" as const,
    }));
  }

  return activePlayers.map((player) => ({
    id: player.id,
    label: `${player.firstName} ${player.lastName}`.trim() || "Player",
    kind: "player" as const,
  }));
}

/** Circle method single round-robin rounds. Each round is a list of [home, away]. */
export function generateRoundRobinRounds(
  participants: ScheduleParticipant[],
): Array<Array<[ScheduleParticipant, ScheduleParticipant]>> {
  if (participants.length < 2) {
    return [];
  }

  const list = [...participants];
  if (list.length % 2 === 1) {
    list.push({ id: "__bye__", label: "BYE", kind: "player" });
  }

  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const fixed = list[0]!;
  let rotating = list.slice(1);
  const result: Array<Array<[ScheduleParticipant, ScheduleParticipant]>> = [];

  for (let round = 0; round < rounds; round += 1) {
    const pairings: Array<[ScheduleParticipant, ScheduleParticipant]> = [];
    const left = [fixed, ...rotating.slice(0, half - 1)];
    const right = rotating.slice(half - 1).reverse();

    for (let i = 0; i < half; i += 1) {
      const a = left[i]!;
      const b = right[i]!;
      if (a.id === "__bye__" || b.id === "__bye__") {
        continue;
      }
      // Alternate home/away across rounds for fairness.
      if (round % 2 === 0) {
        pairings.push([a, b]);
      } else {
        pairings.push([b, a]);
      }
    }

    result.push(pairings);
    rotating = [rotating[rotating.length - 1]!, ...rotating.slice(0, -1)];
  }

  return result;
}

function nextWeekdayOnOrAfter(from: Date, weekday: number): Date {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  const current = date.getDay();
  const delta = (weekday - current + 7) % 7;
  date.setDate(date.getDate() + delta);
  return date;
}

function applyTime(date: Date, time: string): Date {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  const next = new Date(date);
  next.setHours(
    Number.isFinite(hours) ? hours : 19,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return next;
}

export function generateSchedulePreview(input: {
  league: LeagueRow;
  rules: ScheduleRules;
  participants: ScheduleParticipant[];
}): DraftLeagueMatch[] {
  const { league, rules, participants } = input;

  if (participants.length < 2 || rules.pattern !== "round_robin") {
    return [];
  }

  const rounds = generateRoundRobinRounds(participants);
  if (rounds.length === 0) {
    return [];
  }

  const startBase = league.starts_at ? new Date(league.starts_at) : new Date();
  const weekday =
    rules.matchWeekday ??
    (Number.isNaN(startBase.getTime()) ? 4 : startBase.getDay());
  const firstNight = nextWeekdayOnOrAfter(
    Number.isNaN(startBase.getTime()) ? new Date() : startBase,
    weekday,
  );
  const stepDays = rules.frequency === "biweekly" ? 14 : 7;

  const matches: DraftLeagueMatch[] = [];
  let roundIndex = 0;

  for (let week = 1; week <= rules.weeks; week += 1) {
    const night = new Date(firstNight);
    night.setDate(firstNight.getDate() + (week - 1) * stepDays);
    const scheduledAt = applyTime(night, rules.matchTime).toISOString();

    const round = rounds[roundIndex % rounds.length] ?? [];
    roundIndex += 1;

    const nightMatches = round.slice(0, rules.matchesPerNight);
    nightMatches.forEach(([home, away], index) => {
      matches.push({
        key: `w${week}-m${index}-${home.id}-${away.id}`,
        weekNumber: week,
        scheduledAt,
        homeId: home.id,
        awayId: away.id,
        homeLabel: home.label,
        awayLabel: away.label,
        homeKind: home.kind,
        awayKind: away.kind,
        sortOrder: index,
        status: "scheduled",
      });
    });
  }

  return matches;
}

export function groupMatchesByWeek(
  matches: DraftLeagueMatch[],
): LeagueScheduleWeek[] {
  const byWeek = new Map<number, DraftLeagueMatch[]>();

  for (const match of matches) {
    const list = byWeek.get(match.weekNumber) ?? [];
    list.push(match);
    byWeek.set(match.weekNumber, list);
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, weekMatches]) => {
      const sorted = [...weekMatches].sort((a, b) => a.sortOrder - b.sortOrder);
      const first = sorted[0];
      return {
        weekNumber,
        dateLabel: first ? formatLeagueDate(first.scheduledAt) ?? "—" : "—",
        timeLabel: first ? formatLeagueTime(first.scheduledAt) ?? "—" : "—",
        matches: sorted,
      };
    });
}

export const SCHEDULE_FREQUENCY_OPTIONS: Array<{
  value: ScheduleFrequency;
  label: string;
}> = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "custom", label: "Custom" },
];

export const SCHEDULE_PATTERN_OPTIONS: Array<{
  value: SchedulePattern;
  label: string;
}> = [
  { value: "round_robin", label: "Round Robin" },
  { value: "custom", label: "Custom Matchups" },
];

export function weekdayOptions(): Array<{ value: string; label: string }> {
  return [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ];
}
