import {
  formatLeagueCompetitionFormatLabel,
  formatLeagueDate,
  formatLeagueDateRange,
  formatLeagueFormatLabel,
  formatLeagueGameFormatLabel,
  formatLeagueTime,
  formatLeagueWeekday,
} from "@/features/leagues/lib/league-formats";
import {
  isSinglesLeagueFormat,
  resolveLeagueRulesForMatches,
  resolveScheduleMatchesPerNightFromGameRules,
  resolveSinglesRoundsPerNight,
} from "@/features/leagues/lib/league-game-rules";
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
  "forfeited",
  "walkover",
  "cancelled",
] as const;
export type LeagueMatchStatus = (typeof LEAGUE_MATCH_STATUSES)[number];

export const LEAGUE_MATCH_STATUS_LABEL: Record<LeagueMatchStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  forfeited: "Forfeited",
  walkover: "Walkover",
  cancelled: "Canceled",
};

export function isTerminalLeagueMatchStatus(
  status: LeagueMatchStatus | null | undefined,
): boolean {
  return (
    status === "completed" ||
    status === "forfeited" ||
    status === "walkover" ||
    status === "cancelled"
  );
}

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
  /** Null = auto full round (everyone plays once; bye when odd). */
  matchesPerNight: number | null;
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

export interface LeagueScheduleBye {
  participantId: string;
  participantLabel: string;
  participantKind: "team" | "player";
  /** Insert after this match sort index within the week (end of a round). */
  afterSortOrder: number;
}

export interface LeagueScheduleWeek {
  weekNumber: number;
  dateLabel: string;
  timeLabel: string;
  matches: DraftLeagueMatch[];
  byes: LeagueScheduleBye[];
}

export interface LeagueScheduleModel {
  id: string;
  leagueId: string;
  status: ScheduleStatus;
  frequency: ScheduleFrequency;
  matchWeekday: number | null;
  matchTime: string | null;
  weeks: number;
  /** Null = auto full round (everyone plays once; bye when odd). */
  matchesPerNight: number | null;
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

export function defaultScheduleRulesFromLeague(
  league: LeagueRow,
  participantCount = 0,
): ScheduleRules {
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

  const gameRules = resolveLeagueRulesForMatches(league);

  return {
    frequency: "weekly",
    matchWeekday,
    matchTime,
    weeks,
    matchesPerNight: resolveScheduleMatchesPerNightFromGameRules({
      leagueFormat: league.format,
      rules: gameRules,
      participantCount,
    }),
    pattern: "round_robin",
  };
}

/** Full-round night size: everyone plays once (bye rounds excluded separately). */
export function defaultMatchesPerNight(participantCount: number): number {
  return Math.max(1, Math.floor(participantCount / 2));
}

/** Null / unset = auto full round for the current roster size. */
export function isAutoMatchesPerNight(
  matchesPerNight: number | null | undefined,
): boolean {
  return matchesPerNight == null || matchesPerNight <= 0;
}

export function resolveMatchesPerNight(
  matchesPerNight: number | null | undefined,
  participantCount: number,
): number {
  if (isAutoMatchesPerNight(matchesPerNight)) {
    return defaultMatchesPerNight(participantCount);
  }

  return Math.max(1, matchesPerNight!);
}
export function leagueScheduleTimingKey(
  league: Pick<LeagueRow, "starts_at" | "ends_at">,
): string {
  const derived = defaultScheduleRulesFromLeague(league as LeagueRow);
  return [
    league.starts_at ?? "",
    league.ends_at ?? "",
    String(derived.matchWeekday ?? ""),
    derived.matchTime,
    String(derived.weeks),
  ].join("|");
}

export function didLeagueScheduleTimingChange(
  before: Pick<LeagueRow, "starts_at" | "ends_at"> | null | undefined,
  after: Pick<LeagueRow, "starts_at" | "ends_at"> | null | undefined,
): boolean {
  if (!before || !after) {
    return false;
  }

  return leagueScheduleTimingKey(before) !== leagueScheduleTimingKey(after);
}

/**
 * Rebuild schedule rules from the league’s start/end night, preserving
 * pattern / frequency from an existing schedule. Matches-per-night always
 * comes from Game Rules → Match Format.
 */
export function syncedScheduleRulesFromLeague(input: {
  league: LeagueRow;
  existing?: Pick<
    LeagueScheduleModel,
    "frequency" | "matchesPerNight" | "pattern"
  > | null;
  participantCount?: number;
}): ScheduleRules {
  const derived = defaultScheduleRulesFromLeague(
    input.league,
    input.participantCount ?? 0,
  );

  return {
    frequency: input.existing?.frequency ?? derived.frequency,
    matchWeekday: derived.matchWeekday,
    matchTime: derived.matchTime,
    weeks: derived.weeks,
    matchesPerNight: derived.matchesPerNight,
    pattern: input.existing?.pattern ?? derived.pattern,
  };
}

export function regenerateScheduleFromLeague(input: {
  league: LeagueRow;
  existing?: LeagueScheduleModel | null;
  participants: ScheduleParticipant[];
}): { rules: ScheduleRules; matches: DraftLeagueMatch[] } {
  const rules = syncedScheduleRulesFromLeague({
    league: input.league,
    existing: input.existing ?? null,
    participantCount: input.participants.length,
  });
  const matches = generateSchedulePreview({
    league: input.league,
    rules,
    participants: input.participants,
  });

  return { rules, matches };
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

export type RoundRobinRound = {
  pairings: Array<[ScheduleParticipant, ScheduleParticipant]>;
  bye: ScheduleParticipant | null;
};

/** Circle method single round-robin rounds. Each round is pairings + optional bye. */
export function generateRoundRobinRounds(
  participants: ScheduleParticipant[],
): RoundRobinRound[] {
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
  const result: RoundRobinRound[] = [];

  for (let round = 0; round < rounds; round += 1) {
    const pairings: Array<[ScheduleParticipant, ScheduleParticipant]> = [];
    let bye: ScheduleParticipant | null = null;
    const left = [fixed, ...rotating.slice(0, half - 1)];
    const right = rotating.slice(half - 1).reverse();

    for (let i = 0; i < half; i += 1) {
      const a = left[i]!;
      const b = right[i]!;
      if (a.id === "__bye__") {
        bye = b;
        continue;
      }
      if (b.id === "__bye__") {
        bye = a;
        continue;
      }
      // Alternate home/away across rounds for fairness.
      if (round % 2 === 0) {
        pairings.push([a, b]);
      } else {
        pairings.push([b, a]);
      }
    }

    result.push({ pairings, bye });
    rotating = [rotating[rotating.length - 1]!, ...rotating.slice(0, -1)];
  }

  return result;
}

/**
 * Derive bye seats for a week from who is missing in each round chunk.
 * Works for odd-sized singles/team fields after schedule generation.
 */
export function resolveByesForWeekMatches(
  matches: DraftLeagueMatch[],
  participants: ScheduleParticipant[],
): LeagueScheduleBye[] {
  if (participants.length < 2 || participants.length % 2 === 0) {
    return [];
  }

  const matchesPerRound = Math.max(1, Math.floor(participants.length / 2));
  const byes: LeagueScheduleBye[] = [];
  const sorted = [...matches].sort((a, b) => a.sortOrder - b.sortOrder);

  for (let start = 0; start < sorted.length; start += matchesPerRound) {
    const roundMatches = sorted.slice(start, start + matchesPerRound);
    if (roundMatches.length === 0) {
      break;
    }

    const playing = new Set<string>();
    for (const match of roundMatches) {
      if (match.homeId) {
        playing.add(match.homeId);
      }
      if (match.awayId) {
        playing.add(match.awayId);
      }
    }

    const bye = participants.find((participant) => !playing.has(participant.id));
    if (!bye) {
      continue;
    }

    const last = roundMatches[roundMatches.length - 1]!;
    byes.push({
      participantId: bye.id,
      participantLabel: bye.label,
      participantKind: bye.kind,
      afterSortOrder: last.sortOrder,
    });
  }

  return byes;
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
  const { league, participants } = input;
  const gameRules = resolveLeagueRulesForMatches(league);
  const rules: ScheduleRules = {
    ...input.rules,
    matchesPerNight: resolveScheduleMatchesPerNightFromGameRules({
      leagueFormat: league.format,
      rules: gameRules,
      participantCount: participants.length,
    }),
  };

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

  // Singles Match Format: N matches/player = N complete RR rounds per night
  // (everyone plays N times; odd rosters sit one bye each round).
  // Teams / auto: one round per night.
  const roundsPerNight = isSinglesLeagueFormat(league.format)
    ? resolveSinglesRoundsPerNight(gameRules)
    : 1;

  const matches: DraftLeagueMatch[] = [];
  let roundIndex = 0;

  for (let week = 1; week <= rules.weeks; week += 1) {
    const night = new Date(firstNight);
    night.setDate(firstNight.getDate() + (week - 1) * stepDays);
    const scheduledAt = applyTime(night, rules.matchTime).toISOString();
    let sortOrder = 0;

    for (let roundOffset = 0; roundOffset < roundsPerNight; roundOffset += 1) {
      const round = rounds[roundIndex % rounds.length]!;
      roundIndex += 1;

      round.pairings.forEach(([home, away]) => {
        matches.push({
          key: `w${week}-m${sortOrder}-${home.id}-${away.id}`,
          weekNumber: week,
          scheduledAt,
          homeId: home.id,
          awayId: away.id,
          homeLabel: home.label,
          awayLabel: away.label,
          homeKind: home.kind,
          awayKind: away.kind,
          sortOrder,
          status: "scheduled",
        });
        sortOrder += 1;
      });
    }
  }

  return matches;
}

export function groupMatchesByWeek(
  matches: DraftLeagueMatch[],
  participants: ScheduleParticipant[] = [],
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
        byes: resolveByesForWeekMatches(sorted, participants),
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
