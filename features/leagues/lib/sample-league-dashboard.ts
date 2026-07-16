import {
  leagueViewFilterDayCount,
  matchesLeagueViewFilter,
  type LeagueViewFilter,
} from "@/features/leagues/lib/league-formats";
import { buildStatSparklineSeries } from "@/features/leagues/lib/stat-sparkline";
import type { SeasonRow } from "@/lib/supabase/database.types";
import type { LeagueWithVenue } from "@/lib/supabase/queries/leagues";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";
import {
  getSampleLeaguePlayers,
  leaguePlayerDisplayName,
  leaguePlayerInitials,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";

export interface SampleVenue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primaryContactName: string | null;
}

export interface SampleTournament {
  id: string;
  name: string;
  venueName: string;
  startsAt: string;
  format: string;
}

export interface SampleActivityItem {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
}

function isoDaysFromNow(days: number, hour = 19, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const SAMPLE_VENUES: SampleVenue[] = [
  {
    id: "sample-venue-riverside",
    name: "Riverside Darts Club",
    slug: "riverside-darts-club",
    description: "Downtown board room with league nights Thu–Sat.",
    primaryContactName: "Alex Morgan",
  },
  {
    id: "sample-venue-oakwood",
    name: "Oakwood Tap House",
    slug: "oakwood-tap-house",
    description: "Pub venue with six boards upstairs.",
    primaryContactName: "Sam Rivera",
  },
  {
    id: "sample-venue-northside",
    name: "Northside Game Hall",
    slug: "northside-game-hall",
    description: "Tournament-ready hall with electronic boards.",
    primaryContactName: "Jordan Lee",
  },
];

export function getSampleVenueMemberships(): OrganizationMembership[] {
  return SAMPLE_VENUES.map((venue, index) => ({
    organization: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      logo_url: null,
      primary_contact_name: venue.primaryContactName,
      primary_contact_email:
        index === 0
          ? "alex@riverside.example"
          : index === 1
            ? "sam@oakwood.example"
            : "jordan@northside.example",
      primary_contact_phone:
        index === 0 ? "(555) 201-4400" : index === 1 ? "(555) 318-9021" : "(555) 774-1102",
      created_by: "sample-user",
      created_at: isoDaysFromNow(-60),
      updated_at: isoDaysFromNow(-1),
    },
    role: index === 2 ? "admin" : "owner",
  }));
}

export function getSampleVenueLeagueCounts(): Map<string, number> {
  const counts = new Map<string, number>();

  for (const venue of SAMPLE_VENUES) {
    counts.set(venue.id, 0);
  }

  for (const { league } of SAMPLE_LEAGUES) {
    counts.set(
      league.organization_id,
      (counts.get(league.organization_id) ?? 0) + 1,
    );
  }

  return counts;
}

export function getSampleSeasonsForOrganization(
  organizationId: string,
): SeasonRow[] {
  const trimmed = organizationId.trim();
  const byId = new Map<string, SeasonRow>();

  for (const entry of SAMPLE_LEAGUES) {
    if (entry.league.organization_id !== trimmed || !entry.season) {
      continue;
    }

    byId.set(entry.season.id, {
      id: entry.season.id,
      organization_id: trimmed,
      name: entry.season.name,
      slug: entry.season.slug,
      created_by: "sample-user",
      created_at: isoDaysFromNow(-90),
      updated_at: isoDaysFromNow(-1),
    });
  }

  return [...byId.values()];
}

export const SAMPLE_LEAGUES: LeagueWithVenue[] = [
  {
    league: {
      id: "sample-league-thursday-501",
      organization_id: "sample-venue-riverside",
      season_id: "sample-season-2526",
      name: "Thursday Night 501",
      slug: "thursday-night-501",
      description: "Weekly doubles, double-out.",
      format: "singles",
      competition_format: "round_robin",
      game_format: "x01",
      rules: {
        family: "x01",
        startingScore: 501,
        startingRule: "straight_in",
        finishingRule: "double_out",
        bustRule: "enabled",
        matchFormat: "best_of_5",
        startingPlayer: "coin_toss",
      },
      max_players: null,
      starts_at: isoDaysFromNow(-30, 19, 0),
      ends_at: isoDaysFromNow(120, 22, 0),
      published_at: null,
      created_by: "sample-user",
      created_at: isoDaysFromNow(-45),
      updated_at: isoDaysFromNow(-2),
    },
    organization: {
      id: "sample-venue-riverside",
      name: "Riverside Darts Club",
      slug: "riverside-darts-club",
    },
    season: {
      id: "sample-season-2526",
      name: "2025/26",
      slug: "2025-26",
    },
  },
  {
    league: {
      id: "sample-league-cricket-classic",
      organization_id: "sample-venue-oakwood",
      season_id: "sample-season-2526-oak",
      name: "Friday Cricket Classic",
      slug: "friday-cricket-classic",
      description: "Singles cricket, rotation format.",
      format: "team",
      competition_format: "points",
      game_format: "cricket",
      rules: null,
      max_players: null,
      starts_at: isoDaysFromNow(-14, 18, 30),
      ends_at: isoDaysFromNow(90, 23, 0),
      published_at: null,
      created_by: "sample-user",
      created_at: isoDaysFromNow(-20),
      updated_at: isoDaysFromNow(-1),
    },
    organization: {
      id: "sample-venue-oakwood",
      name: "Oakwood Tap House",
      slug: "oakwood-tap-house",
    },
    season: {
      id: "sample-season-2526-oak",
      name: "Fall 2025",
      slug: "fall-2025",
    },
  },
  {
    league: {
      id: "sample-league-tactics-cup",
      organization_id: "sample-venue-northside",
      season_id: "sample-season-winter",
      name: "Tactics Winter Cup",
      slug: "tactics-winter-cup",
      description: "Team tactics nights.",
      format: "doubles",
      competition_format: "custom",
      game_format: "x01",
      rules: null,
      max_players: null,
      starts_at: isoDaysFromNow(7, 19, 0),
      ends_at: isoDaysFromNow(140, 22, 30),
      published_at: null,
      created_by: "sample-user",
      created_at: isoDaysFromNow(-5),
      updated_at: isoDaysFromNow(-5),
    },
    organization: {
      id: "sample-venue-northside",
      name: "Northside Game Hall",
      slug: "northside-game-hall",
    },
    season: {
      id: "sample-season-winter",
      name: "Winter 2026",
      slug: "winter-2026",
    },
  },
  {
    league: {
      id: "sample-league-summer-301",
      organization_id: "sample-venue-riverside",
      season_id: "sample-season-summer",
      name: "Summer 301 Series",
      slug: "summer-301-series",
      description: "Completed summer singles series.",
      format: "ladder",
      competition_format: "ladder",
      game_format: "x01",
      rules: null,
      max_players: null,
      starts_at: isoDaysFromNow(-150, 19, 0),
      ends_at: isoDaysFromNow(-20, 22, 0),
      published_at: null,
      created_by: "sample-user",
      created_at: isoDaysFromNow(-160),
      updated_at: isoDaysFromNow(-20),
    },
    organization: {
      id: "sample-venue-riverside",
      name: "Riverside Darts Club",
      slug: "riverside-darts-club",
    },
    season: {
      id: "sample-season-summer",
      name: "Summer 2025",
      slug: "summer-2025",
    },
  },
];

/** Published leagues shown on My Leagues (Elite/Club) in local development. */
export const SAMPLE_REGISTERED_LEAGUES: LeagueWithVenue[] = [
  {
    league: {
      id: "sample-league-my-thursday-501",
      organization_id: "sample-venue-riverside",
      season_id: "sample-season-2526",
      name: "Thursday Night 501",
      slug: "thursday-night-501",
      description: "Weekly singles, double-out.",
      format: "singles",
      competition_format: "round_robin",
      game_format: "x01",
      rules: null,
      max_players: 16,
      starts_at: isoDaysFromNow(-14, 19, 0),
      ends_at: isoDaysFromNow(100, 22, 0),
      published_at: isoDaysFromNow(-20),
      created_by: "sample-user",
      created_at: isoDaysFromNow(-45),
      updated_at: isoDaysFromNow(-2),
    },
    organization: {
      id: "sample-venue-riverside",
      name: "Riverside Darts Club",
      slug: "riverside-darts-club",
    },
    season: {
      id: "sample-season-2526",
      name: "2025/26",
      slug: "2025-26",
    },
  },
  {
    league: {
      id: "sample-league-my-friday-cricket",
      organization_id: "sample-venue-oakwood",
      season_id: "sample-season-2526-oak",
      name: "Friday Cricket Classic",
      slug: "friday-cricket-classic",
      description: "Singles cricket, rotation format.",
      format: "team",
      competition_format: "points",
      game_format: "cricket",
      rules: null,
      max_players: 20,
      starts_at: isoDaysFromNow(10, 18, 30),
      ends_at: isoDaysFromNow(120, 23, 0),
      published_at: isoDaysFromNow(-5),
      created_by: "sample-user",
      created_at: isoDaysFromNow(-20),
      updated_at: isoDaysFromNow(-1),
    },
    organization: {
      id: "sample-venue-oakwood",
      name: "Oakwood Tap House",
      slug: "oakwood-tap-house",
    },
    season: {
      id: "sample-season-2526-oak",
      name: "Fall 2025",
      slug: "fall-2025",
    },
  },
  {
    league: {
      id: "sample-league-my-tactics-cup",
      organization_id: "sample-venue-northside",
      season_id: "sample-season-winter",
      name: "Tactics Winter Cup",
      slug: "tactics-winter-cup",
      description: "Team tactics nights.",
      format: "doubles",
      competition_format: "custom",
      game_format: "x01",
      rules: null,
      max_players: 24,
      starts_at: isoDaysFromNow(-40, 19, 0),
      ends_at: isoDaysFromNow(-5, 22, 30),
      published_at: isoDaysFromNow(-50),
      created_by: "sample-user",
      created_at: isoDaysFromNow(-55),
      updated_at: isoDaysFromNow(-5),
    },
    organization: {
      id: "sample-venue-northside",
      name: "Northside Game Hall",
      slug: "northside-game-hall",
    },
    season: {
      id: "sample-season-winter",
      name: "Winter 2026",
      slug: "winter-2026",
    },
  },
  {
    league: {
      id: "sample-league-my-summer-301",
      organization_id: "sample-venue-riverside",
      season_id: "sample-season-summer",
      name: "Summer 301 Series",
      slug: "summer-301-series",
      description: "Summer singles series.",
      format: "ladder",
      competition_format: "ladder",
      game_format: "x01",
      rules: null,
      max_players: 12,
      starts_at: isoDaysFromNow(21, 19, 0),
      ends_at: isoDaysFromNow(140, 22, 0),
      published_at: isoDaysFromNow(-2),
      created_by: "sample-user",
      created_at: isoDaysFromNow(-10),
      updated_at: isoDaysFromNow(-2),
    },
    organization: {
      id: "sample-venue-riverside",
      name: "Riverside Darts Club",
      slug: "riverside-darts-club",
    },
    season: {
      id: "sample-season-summer",
      name: "Summer 2026",
      slug: "summer-2026",
    },
  },
];

export function getSampleRegisteredLeagues(): LeagueWithVenue[] {
  return SAMPLE_REGISTERED_LEAGUES;
}

export const SAMPLE_TOURNAMENTS: SampleTournament[] = [
  {
    id: "sample-tournament-open",
    name: "Riverside Open",
    venueName: "Riverside Darts Club",
    startsAt: isoDaysFromNow(12, 10, 0),
    format: "501",
  },
  {
    id: "sample-tournament-tactics",
    name: "Northside Tactics Invitational",
    venueName: "Northside Game Hall",
    startsAt: isoDaysFromNow(26, 11, 0),
    format: "Tactics",
  },
  {
    id: "sample-tournament-pub",
    name: "Oakwood Pub Cup",
    venueName: "Oakwood Tap House",
    startsAt: isoDaysFromNow(40, 17, 0),
    format: "301",
  },
];

export const SAMPLE_ACTIVITY: SampleActivityItem[] = [
  {
    id: "sample-activity-1",
    title: "League created",
    detail: "Thursday Night 501 at Riverside Darts Club",
    occurredAt: isoDaysFromNow(-2, 14, 20),
  },
  {
    id: "sample-activity-2",
    title: "Venue updated",
    detail: "Oakwood Tap House contact details saved",
    occurredAt: isoDaysFromNow(-5, 11, 5),
  },
  {
    id: "sample-activity-3",
    title: "Season started",
    detail: "Fall 2025 · Friday Cricket Classic",
    occurredAt: isoDaysFromNow(-14, 18, 30),
  },
  {
    id: "sample-activity-4",
    title: "Tournament scheduled",
    detail: "Riverside Open · in 12 days",
    occurredAt: isoDaysFromNow(-1, 9, 45),
  },
];

const SAMPLE_STATS_BY_VIEW: Record<
  LeagueViewFilter,
  {
    tournaments: number;
    players: number;
    teams: number;
  }
> = {
  "7d": { tournaments: 1, players: 28, teams: 8 },
  "30d": { tournaments: 1, players: 36, teams: 10 },
  "90d": { tournaments: 2, players: 44, teams: 11 },
  "120d": { tournaments: 3, players: 48, teams: 12 },
};

export function getSampleLeagueCount(filter: LeagueViewFilter): number {
  return SAMPLE_LEAGUES.filter(({ league }) => matchesLeagueViewFilter(league, filter)).length;
}

export function getSampleSeasonStats(filter: LeagueViewFilter) {
  const counts = SAMPLE_STATS_BY_VIEW[filter];
  const periodDays = leagueViewFilterDayCount(filter);
  const leagueCount = getSampleLeagueCount(filter);

  return [
    {
      id: "leagues" as const,
      label: "Leagues",
      value: leagueCount,
      series: buildStatSparklineSeries(leagueCount, `${filter}-leagues`, periodDays),
    },
    {
      id: "tournaments" as const,
      label: "Tournaments",
      value: counts.tournaments,
      series: buildStatSparklineSeries(
        counts.tournaments,
        `${filter}-tournaments`,
        periodDays,
      ),
    },
    {
      id: "players" as const,
      label: "Players",
      value: counts.players,
      series: buildStatSparklineSeries(counts.players, `${filter}-players`, periodDays),
    },
    {
      id: "teams" as const,
      label: "Teams",
      value: counts.teams,
      series: buildStatSparklineSeries(counts.teams, `${filter}-teams`, periodDays),
    },
  ];
}

export function getSampleLeagueById(leagueId: string): LeagueWithVenue | null {
  const trimmed = leagueId.trim();

  if (!trimmed) {
    return null;
  }

  return (
    SAMPLE_LEAGUES.find(({ league }) => league.id === trimmed) ??
    SAMPLE_REGISTERED_LEAGUES.find(({ league }) => league.id === trimmed) ??
    null
  );
}

export type SampleRosterStatus = "connected" | "profile-only" | "pending";

export interface SampleLeagueRosterPlayer {
  id: string;
  name: string;
  initials: string;
  team: string;
  status: SampleRosterStatus;
  avatarTone: "primary" | "muted" | "gold";
}

export function toOverviewRosterPlayer(
  player: LeaguePlayer,
): SampleLeagueRosterPlayer {
  const status: SampleRosterStatus =
    player.vectorAccount === "connected"
      ? "connected"
      : player.vectorAccount === "invitation-pending"
        ? "pending"
        : "profile-only";

  return {
    id: player.id,
    name: leaguePlayerDisplayName(player),
    initials: leaguePlayerInitials(player),
    team: player.teamName ?? "Unassigned",
    status,
    avatarTone:
      status === "connected" ? "primary" : status === "pending" ? "gold" : "muted",
  };
}

function toSampleRosterPlayer(player: LeaguePlayer): SampleLeagueRosterPlayer {
  return toOverviewRosterPlayer(player);
}

export const SAMPLE_LEAGUE_ROSTER: SampleLeagueRosterPlayer[] =
  getSampleLeaguePlayers("sample-league").map(toSampleRosterPlayer);

export interface SampleLeagueActivityItem {
  id: string;
  title: string;
  timeLabel: string;
}

export interface SampleLeagueOverview {
  playerCount: number;
  pendingInvites: number;
  teamCount: number;
  matchCount: number;
  rosterPreview: SampleLeagueRosterPlayer[];
  activity: SampleLeagueActivityItem[];
}

export const SAMPLE_LEAGUE_OVERVIEW: SampleLeagueOverview = {
  playerCount: SAMPLE_LEAGUE_ROSTER.length,
  pendingInvites: SAMPLE_LEAGUE_ROSTER.filter((player) => player.status === "pending")
    .length,
  teamCount: 4,
  matchCount: 0,
  rosterPreview: SAMPLE_LEAGUE_ROSTER.slice(0, 10),
  activity: [
    { id: "act-2", title: "Venue Added", timeLabel: "Today" },
    { id: "act-1", title: "League Created", timeLabel: "Today" },
    { id: "act-3", title: "League Settings Updated", timeLabel: "Yesterday" },
  ],
};

export function getSampleLeagueRoster(
  leagueId: string,
): SampleLeagueRosterPlayer[] {
  return getSampleLeagueById(leagueId)
    ? getSampleLeaguePlayers(leagueId).map(toSampleRosterPlayer)
    : [];
}

export function getSampleLeagueOverview(
  leagueId: string,
): SampleLeagueOverview | null {
  if (!getSampleLeagueById(leagueId)) {
    return null;
  }

  const roster = getSampleLeagueRoster(leagueId);

  return {
    ...SAMPLE_LEAGUE_OVERVIEW,
    playerCount: roster.length,
    pendingInvites: roster.filter((player) => player.status === "pending").length,
    rosterPreview: roster.slice(0, 10),
  };
}

/** Demo/sample pack only when explicitly requested via `?sample=1`. */
export function shouldUseLeagueManagementSample(
  sampleParam?: string | null,
): boolean {
  return sampleParam === "1";
}
