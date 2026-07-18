import { normalizeLeagueGameFormat } from "@/features/leagues/lib/league-formats";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import type { ProfileAchievementIcon } from "@/types/profile";

export type LeagueMemberGameFormat = "x01" | "cricket" | "mixed";

export interface LeagueMemberSeasonStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  currentStreakLabel: string;
}

export interface LeagueMemberX01Performance {
  averageScore: number;
  checkoutPercent: number;
  highestCheckout: number;
  oneEighties: number;
}

export interface LeagueMemberCricketPerformance {
  mpr: number;
  marks: number;
  gamesWon: number;
}

export interface LeagueMemberTeamContribution {
  teamName: string;
  pointsEarned: number;
  matchWins: number;
  singlesRecord: string;
  doublesRecord: string;
}

export interface LeagueMemberRecentMatch {
  id: string;
  dateLabel: string;
  opponent: string;
  resultLabel: string;
  won: boolean;
}

export interface LeagueMemberAchievement {
  id: string;
  icon: ProfileAchievementIcon;
  label: string;
}

/** Per-league membership + season context for a player card. */
export interface LeagueMemberLeagueContext {
  id: string;
  leagueName: string;
  seasonName: string;
  teamName: string;
  role: string;
  membershipStatus: "active" | "inactive";
  joinedLeagueLabel: string;
  seasonsPlayed: number;
  gameFormat: LeagueMemberGameFormat;
  seasonStats: LeagueMemberSeasonStats;
  x01Performance: LeagueMemberX01Performance | null;
  cricketPerformance: LeagueMemberCricketPerformance | null;
  teamContribution: LeagueMemberTeamContribution | null;
  recentMatches: LeagueMemberRecentMatch[];
}

export interface LeagueMemberProfileCard {
  id: string;
  playerName: string;
  avatarUrl: string | null;
  avatarColor: string;
  achievements: LeagueMemberAchievement[];
  leagues: LeagueMemberLeagueContext[];
}

/** Summary row for the Player Cards list. */
export interface LeagueMemberListItem {
  id: string;
  playerName: string;
  avatarUrl: string | null;
  avatarColor: string;
  teamName: string;
  role: string;
  leagueName: string;
  leagueCount: number;
  membershipStatus: "active" | "inactive";
  recordLabel: string;
}

function primaryLeague(
  leagues: LeagueMemberLeagueContext[],
): LeagueMemberLeagueContext | null {
  return (
    leagues.find((league) => league.membershipStatus === "active") ??
    leagues[0] ??
    null
  );
}

export function getLeagueContext(
  card: LeagueMemberProfileCard,
  leagueId?: string | null,
): LeagueMemberLeagueContext | null {
  if (leagueId) {
    const match = card.leagues.find((league) => league.id === leagueId);
    if (match) {
      return match;
    }
  }

  return primaryLeague(card.leagues);
}

/**
 * Stable card id for multi-league roster grouping.
 * Uses underscore prefixes (not `:`) so Next.js dynamic routes decode cleanly.
 */
export function buildLeagueMemberCardId(input: {
  profileUserId: string | null;
  savedPlayerId: string | null;
  leaguePlayerId: string;
}): string {
  if (input.profileUserId) {
    return `p_${input.profileUserId}`;
  }
  if (input.savedPlayerId) {
    return `s_${input.savedPlayerId}`;
  }
  return `lp_${input.leaguePlayerId}`;
}

/** Decode route/search params and accept legacy `profile:` / `saved:` ids. */
export function normalizeLeagueMemberCardId(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }

  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the raw value when it is not URI-encoded.
  }

  if (value.startsWith("profile:")) {
    return `p_${value.slice("profile:".length)}`;
  }
  if (value.startsWith("saved:")) {
    return `s_${value.slice("saved:".length)}`;
  }
  if (value.startsWith("league-player:")) {
    return `lp_${value.slice("league-player:".length)}`;
  }

  return value;
}

export interface LeagueMemberCardSourceRow {
  id: string;
  leagueId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  color: string;
  avatarUrl: string | null;
  teamName: string | null;
  status: string;
  savedPlayerId: string | null;
  profileUserId: string | null;
  createdAt: string;
  leagueName: string;
  gameFormat: string | null;
  seasonName: string | null;
}

const EMPTY_SEASON_STATS: LeagueMemberSeasonStats = {
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  winPercentage: 0,
  currentStreakLabel: "—",
};

function mapMembershipStatus(
  status: string,
): LeagueMemberLeagueContext["membershipStatus"] {
  return status === "active" ? "active" : "inactive";
}

function mapCardGameFormat(
  gameFormat: string | null,
): LeagueMemberGameFormat {
  const normalized = normalizeLeagueGameFormat(gameFormat);
  if (normalized === "x01" || normalized === "cricket" || normalized === "mixed") {
    return normalized;
  }
  return "mixed";
}

function formatJoinedLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function playerDisplayName(row: LeagueMemberCardSourceRow): string {
  return `${row.firstName} ${row.lastName}`.trim() || "Player";
}

function mapSourceRowToLeagueContext(
  row: LeagueMemberCardSourceRow,
): LeagueMemberLeagueContext {
  const teamName = row.teamName?.trim() || "Unassigned";
  const gameFormat = mapCardGameFormat(row.gameFormat);

  return {
    id: row.leagueId,
    leagueName: row.leagueName,
    seasonName: row.seasonName?.trim() || "Season",
    teamName,
    role: "Player",
    membershipStatus: mapMembershipStatus(row.status),
    joinedLeagueLabel: formatJoinedLabel(row.createdAt),
    seasonsPlayed: 1,
    gameFormat,
    seasonStats: { ...EMPTY_SEASON_STATS },
    x01Performance:
      gameFormat === "x01" || gameFormat === "mixed"
        ? {
            averageScore: 0,
            checkoutPercent: 0,
            highestCheckout: 0,
            oneEighties: 0,
          }
        : null,
    cricketPerformance:
      gameFormat === "cricket" || gameFormat === "mixed"
        ? {
            mpr: 0,
            marks: 0,
            gamesWon: 0,
          }
        : null,
    teamContribution: null,
    recentMatches: [],
  };
}

/** Group managed roster rows into multi-league player cards. */
export function mapManagedPlayerRowsToCards(
  rows: LeagueMemberCardSourceRow[],
): LeagueMemberProfileCard[] {
  const groups = new Map<string, LeagueMemberCardSourceRow[]>();

  for (const row of rows) {
    const cardId = buildLeagueMemberCardId({
      profileUserId: row.profileUserId,
      savedPlayerId: row.savedPlayerId,
      leaguePlayerId: row.id,
    });
    const existing = groups.get(cardId);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(cardId, [row]);
    }
  }

  const cards: LeagueMemberProfileCard[] = [];

  for (const [cardId, groupRows] of groups) {
    const primary =
      groupRows.find((row) => row.status === "active") ?? groupRows[0];
    if (!primary) {
      continue;
    }

    const leaguesById = new Map<string, LeagueMemberLeagueContext>();
    for (const row of groupRows) {
      // Prefer active membership when the same league appears more than once.
      const existing = leaguesById.get(row.leagueId);
      if (!existing || (existing.membershipStatus !== "active" && row.status === "active")) {
        leaguesById.set(row.leagueId, mapSourceRowToLeagueContext(row));
      }
    }

    cards.push({
      id: cardId,
      playerName: playerDisplayName(primary),
      avatarUrl: primary.avatarUrl,
      avatarColor: primary.color || APP_PRIMARY_COLOR,
      achievements: [],
      leagues: [...leaguesById.values()],
    });
  }

  cards.sort((a, b) =>
    a.playerName.localeCompare(b.playerName, undefined, { sensitivity: "base" }),
  );

  return cards;
}

export function toLeagueMemberListItem(
  card: LeagueMemberProfileCard,
): LeagueMemberListItem {
  const league = primaryLeague(card.leagues);
  const leagueCount = card.leagues.length;

  return {
    id: card.id,
    playerName: card.playerName,
    avatarUrl: card.avatarUrl,
    avatarColor: card.avatarColor,
    teamName: league?.teamName ?? "—",
    role: league?.role ?? "—",
    leagueName:
      leagueCount > 1
        ? `${league?.leagueName ?? "League"} · +${leagueCount - 1}`
        : (league?.leagueName ?? "—"),
    leagueCount,
    membershipStatus: league?.membershipStatus ?? "inactive",
    recordLabel: league
      ? `${league.seasonStats.wins}-${league.seasonStats.losses}`
      : "0-0",
  };
}

/** Sample League Member Profile Card until live league player data is wired. */
export const SAMPLE_LEAGUE_MEMBER_PROFILE_CARD: LeagueMemberProfileCard = {
  id: "lp-jason",
  playerName: "Jason Gelsomino",
  avatarUrl: null,
  avatarColor: APP_PRIMARY_COLOR,
  achievements: [
    { id: "ach-1", icon: "trophy", label: "First 180" },
    { id: "ach-2", icon: "flame", label: "5 Match Win Streak" },
    { id: "ach-3", icon: "target", label: "Highest Checkout 120" },
  ],
  leagues: [
    {
      id: "lg-thursday-501",
      leagueName: "Thursday Night 501 League",
      seasonName: "Summer 2026",
      teamName: "Bull Chasers",
      role: "Captain",
      membershipStatus: "active",
      joinedLeagueLabel: "August 2025",
      seasonsPlayed: 3,
      gameFormat: "mixed",
      seasonStats: {
        matchesPlayed: 12,
        wins: 9,
        losses: 3,
        winPercentage: 75,
        currentStreakLabel: "W4",
      },
      x01Performance: {
        averageScore: 72.4,
        checkoutPercent: 38,
        highestCheckout: 120,
        oneEighties: 6,
      },
      cricketPerformance: {
        mpr: 3.12,
        marks: 487,
        gamesWon: 18,
      },
      teamContribution: {
        teamName: "Bull Chasers",
        pointsEarned: 24,
        matchWins: 9,
        singlesRecord: "5-1",
        doublesRecord: "4-2",
      },
      recentMatches: [
        {
          id: "rm-1",
          dateLabel: "Aug 27",
          opponent: "Flight Crew",
          resultLabel: "Won 3-1",
          won: true,
        },
        {
          id: "rm-2",
          dateLabel: "Aug 20",
          opponent: "Dart Knights",
          resultLabel: "Lost 2-3",
          won: false,
        },
        {
          id: "rm-3",
          dateLabel: "Aug 13",
          opponent: "Bull Shooters",
          resultLabel: "Won 3-0",
          won: true,
        },
      ],
    },
    {
      id: "lg-monday-cricket",
      leagueName: "Monday Cricket League",
      seasonName: "Summer 2026",
      teamName: "Steel Tips",
      role: "Player",
      membershipStatus: "active",
      joinedLeagueLabel: "January 2026",
      seasonsPlayed: 1,
      gameFormat: "cricket",
      seasonStats: {
        matchesPlayed: 8,
        wins: 5,
        losses: 3,
        winPercentage: 63,
        currentStreakLabel: "W2",
      },
      x01Performance: null,
      cricketPerformance: {
        mpr: 2.96,
        marks: 318,
        gamesWon: 12,
      },
      teamContribution: {
        teamName: "Steel Tips",
        pointsEarned: 14,
        matchWins: 5,
        singlesRecord: "3-2",
        doublesRecord: "2-1",
      },
      recentMatches: [
        {
          id: "rm-j4",
          dateLabel: "Aug 25",
          opponent: "Wire Cutters",
          resultLabel: "Won 2-1",
          won: true,
        },
        {
          id: "rm-j5",
          dateLabel: "Aug 18",
          opponent: "Bull Zone",
          resultLabel: "Lost 0-2",
          won: false,
        },
      ],
    },
  ],
};

const SAMPLE_LEAGUE_MEMBER_PROFILE_CARDS: LeagueMemberProfileCard[] = [
  SAMPLE_LEAGUE_MEMBER_PROFILE_CARD,
  {
    id: "lp-maria",
    playerName: "Maria Chen",
    avatarUrl: null,
    avatarColor: "#3b82f6",
    achievements: [{ id: "ach-m1", icon: "target", label: "First Season Finish" }],
    leagues: [
      {
        id: "lg-thursday-501",
        leagueName: "Thursday Night 501 League",
        seasonName: "Summer 2026",
        teamName: "Flight Crew",
        role: "Player",
        membershipStatus: "active",
        joinedLeagueLabel: "March 2026",
        seasonsPlayed: 2,
        gameFormat: "x01",
        seasonStats: {
          matchesPlayed: 11,
          wins: 6,
          losses: 5,
          winPercentage: 55,
          currentStreakLabel: "L1",
        },
        x01Performance: {
          averageScore: 64.1,
          checkoutPercent: 31,
          highestCheckout: 96,
          oneEighties: 2,
        },
        cricketPerformance: null,
        teamContribution: {
          teamName: "Flight Crew",
          pointsEarned: 16,
          matchWins: 6,
          singlesRecord: "4-2",
          doublesRecord: "2-3",
        },
        recentMatches: [
          {
            id: "rm-m1",
            dateLabel: "Aug 27",
            opponent: "Bull Chasers",
            resultLabel: "Lost 1-3",
            won: false,
          },
          {
            id: "rm-m2",
            dateLabel: "Aug 20",
            opponent: "Dart Knights",
            resultLabel: "Won 3-2",
            won: true,
          },
        ],
      },
    ],
  },
  {
    id: "lp-devon",
    playerName: "Devon Brooks",
    avatarUrl: null,
    avatarColor: "#f59e0b",
    achievements: [{ id: "ach-d1", icon: "flame", label: "Comeback Win" }],
    leagues: [
      {
        id: "lg-thursday-501",
        leagueName: "Thursday Night 501 League",
        seasonName: "Summer 2026",
        teamName: "Dart Knights",
        role: "Vice Captain",
        membershipStatus: "active",
        joinedLeagueLabel: "January 2025",
        seasonsPlayed: 4,
        gameFormat: "mixed",
        seasonStats: {
          matchesPlayed: 12,
          wins: 7,
          losses: 5,
          winPercentage: 58,
          currentStreakLabel: "W2",
        },
        x01Performance: {
          averageScore: 68.8,
          checkoutPercent: 34,
          highestCheckout: 110,
          oneEighties: 4,
        },
        cricketPerformance: {
          mpr: 2.84,
          marks: 402,
          gamesWon: 11,
        },
        teamContribution: {
          teamName: "Dart Knights",
          pointsEarned: 18,
          matchWins: 7,
          singlesRecord: "3-3",
          doublesRecord: "4-2",
        },
        recentMatches: [
          {
            id: "rm-d1",
            dateLabel: "Aug 27",
            opponent: "Bull Shooters",
            resultLabel: "Won 3-1",
            won: true,
          },
        ],
      },
      {
        id: "lg-sunday-mixed",
        leagueName: "Sunday Mixed Doubles",
        seasonName: "Summer 2026",
        teamName: "Night Owls",
        role: "Player",
        membershipStatus: "active",
        joinedLeagueLabel: "April 2026",
        seasonsPlayed: 1,
        gameFormat: "mixed",
        seasonStats: {
          matchesPlayed: 6,
          wins: 4,
          losses: 2,
          winPercentage: 67,
          currentStreakLabel: "W1",
        },
        x01Performance: {
          averageScore: 66.2,
          checkoutPercent: 30,
          highestCheckout: 98,
          oneEighties: 1,
        },
        cricketPerformance: {
          mpr: 2.71,
          marks: 210,
          gamesWon: 7,
        },
        teamContribution: {
          teamName: "Night Owls",
          pointsEarned: 10,
          matchWins: 4,
          singlesRecord: "2-1",
          doublesRecord: "2-1",
        },
        recentMatches: [
          {
            id: "rm-d2",
            dateLabel: "Aug 24",
            opponent: "Pair Aces",
            resultLabel: "Won 2-0",
            won: true,
          },
        ],
      },
    ],
  },
  {
    id: "lp-sam",
    playerName: "Sam Rivera",
    avatarUrl: null,
    avatarColor: "#8b5cf6",
    achievements: [
      { id: "ach-s1", icon: "trophy", label: "First Win" },
      { id: "ach-s2", icon: "target", label: "Checkout 100+" },
      { id: "ach-s3", icon: "flame", label: "3 Match Win Streak" },
      { id: "ach-s4", icon: "bull", label: "Season Opener" },
    ],
    leagues: [
      {
        id: "lg-thursday-501",
        leagueName: "Thursday Night 501 League",
        seasonName: "Summer 2026",
        teamName: "Bull Shooters",
        role: "Player",
        membershipStatus: "inactive",
        joinedLeagueLabel: "June 2026",
        seasonsPlayed: 1,
        gameFormat: "x01",
        seasonStats: {
          matchesPlayed: 4,
          wins: 1,
          losses: 3,
          winPercentage: 25,
          currentStreakLabel: "L2",
        },
        x01Performance: {
          averageScore: 52.3,
          checkoutPercent: 22,
          highestCheckout: 60,
          oneEighties: 0,
        },
        cricketPerformance: null,
        teamContribution: {
          teamName: "Bull Shooters",
          pointsEarned: 3,
          matchWins: 1,
          singlesRecord: "1-2",
          doublesRecord: "0-1",
        },
        recentMatches: [],
      },
    ],
  },
];

export const SAMPLE_LEAGUE_MEMBER_LIST: LeagueMemberListItem[] =
  SAMPLE_LEAGUE_MEMBER_PROFILE_CARDS.map(toLeagueMemberListItem);

export function getSampleLeagueMemberProfileCard(
  playerId: string,
): LeagueMemberProfileCard | null {
  return (
    SAMPLE_LEAGUE_MEMBER_PROFILE_CARDS.find((card) => card.id === playerId) ?? null
  );
}
