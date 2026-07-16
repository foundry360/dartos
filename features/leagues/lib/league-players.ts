/**
 * League roster view models.
 *
 * Membership can link to a saved `players` row, a Vector profile, or be a guest
 * league profile. Roster rows persist in `league_players`.
 */

export type LeaguePlayerStatus = "active" | "invited" | "pending" | "inactive";

export type VectorAccountState =
  | "connected"
  | "profile-only"
  | "invitation-pending"
  | "no-account";

export interface LeaguePlayerRecentMatch {
  id: string;
  label: string;
  result: "W" | "L";
  dateLabel: string;
}

export interface LeaguePlayer {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  color: string;
  teamId: string | null;
  teamName: string | null;
  leagueStatus: LeaguePlayerStatus;
  vectorAccount: VectorAccountState;
  matchesPlayed: number;
  wins: number;
  losses: number;
  average: number | null;
  checkoutPercent: number | null;
  highestCheckout: number | null;
  count180s: number | null;
  recentMatches: LeaguePlayerRecentMatch[];
  /** Optional link to saved `players` row. */
  savedPlayerId?: string | null;
  /** Optional link to auth `profiles` user. */
  profileUserId?: string | null;
}

export interface LeaguePlayerDirectoryHit {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  color: string;
  kind: "vector-user" | "player-profile";
  email?: string | null;
}

export interface CreateLeaguePlayerInput {
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export type UpdateLeaguePlayerInput = CreateLeaguePlayerInput;

export function leaguePlayerDisplayName(player: {
  firstName: string;
  lastName: string;
}): string {
  return `${player.firstName} ${player.lastName}`.trim();
}

export function leaguePlayerInitials(player: {
  firstName: string;
  lastName: string;
}): string {
  const first = player.firstName.trim().charAt(0);
  const last = player.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

export function leaguePlayerRecord(player: {
  wins: number;
  losses: number;
}): string {
  return `${player.wins}-${player.losses}`;
}

export function formatLeagueAverage(value: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return value.toFixed(2);
}

export const LEAGUE_PLAYER_STATUS_LABEL: Record<LeaguePlayerStatus, string> = {
  active: "Active",
  invited: "Invited",
  pending: "Pending",
  inactive: "Inactive",
};

export const VECTOR_ACCOUNT_LABEL: Record<VectorAccountState, string> = {
  connected: "Vector Account",
  "profile-only": "Player Profile",
  "invitation-pending": "Invite Sent",
  "no-account": "No Account",
};

const SAMPLE_TEAMS = [
  "Bull Chasers",
  "Double Trouble",
  "Flight Club",
  "Board Kings",
] as const;

function player(
  partial: Omit<LeaguePlayer, "highestCheckout" | "count180s"> &
    Partial<Pick<LeaguePlayer, "highestCheckout" | "count180s">>,
): LeaguePlayer {
  return {
    highestCheckout: null,
    count180s: null,
    ...partial,
  };
}

export const SAMPLE_LEAGUE_PLAYERS: LeaguePlayer[] = [
  player({
    id: "lp-jg",
    firstName: "Jason",
    lastName: "Gelsomino",
    nickname: "The Machine",
    email: "jason@example.com",
    phone: null,
    avatarUrl: null,
    color: "#84C126",
    teamId: "lt-bull",
    teamName: "Bull Chasers",
    leagueStatus: "active",
    vectorAccount: "connected",
    matchesPlayed: 8,
    wins: 7,
    losses: 1,
    average: 67.82,
    checkoutPercent: 38.4,
    highestCheckout: 121,
    count180s: 7,
    recentMatches: [
      { id: "m1", label: "vs Mike Smith", result: "W", dateLabel: "Tue" },
      { id: "m2", label: "vs Chris Jones", result: "W", dateLabel: "Last Tue" },
      { id: "m3", label: "vs Alex Kim", result: "L", dateLabel: "Mar 18" },
    ],
    profileUserId: "sample-user-jg",
  }),
  player({
    id: "lp-ms",
    firstName: "Mike",
    lastName: "Smith",
    nickname: null,
    email: null,
    phone: null,
    avatarUrl: null,
    color: "#68707C",
    teamId: null,
    teamName: null,
    leagueStatus: "active",
    vectorAccount: "profile-only",
    matchesPlayed: 6,
    wins: 3,
    losses: 3,
    average: 42.1,
    checkoutPercent: 28.5,
    highestCheckout: 160,
    count180s: 2,
    recentMatches: [
      { id: "m4", label: "vs Jason Gelsomino", result: "L", dateLabel: "Tue" },
    ],
    savedPlayerId: "sample-saved-ms",
  }),
  player({
    id: "lp-cj",
    firstName: "Chris",
    lastName: "Johnson",
    nickname: "CJ",
    email: "chris@example.com",
    phone: "555-0102",
    avatarUrl: null,
    color: "#B8892B",
    teamId: null,
    teamName: null,
    leagueStatus: "active",
    vectorAccount: "invitation-pending",
    matchesPlayed: 7,
    wins: 4,
    losses: 3,
    average: 48.2,
    checkoutPercent: 31.0,
    highestCheckout: 100,
    count180s: 12,
    recentMatches: [],
  }),
  player({
    id: "lp-ak",
    firstName: "Alex",
    lastName: "Kim",
    nickname: null,
    email: "alex@example.com",
    phone: null,
    avatarUrl: null,
    color: "#84C126",
    teamId: "lt-bull",
    teamName: "Bull Chasers",
    leagueStatus: "active",
    vectorAccount: "connected",
    matchesPlayed: 8,
    wins: 5,
    losses: 3,
    average: 51.08,
    checkoutPercent: 33.0,
    recentMatches: [],
    profileUserId: "sample-user-ak",
  }),
  player({
    id: "lp-tr",
    firstName: "Taylor",
    lastName: "Reyes",
    nickname: "TR",
    email: null,
    phone: null,
    avatarUrl: null,
    color: "#84C126",
    teamId: "lt-double",
    teamName: "Double Trouble",
    leagueStatus: "active",
    vectorAccount: "connected",
    matchesPlayed: 7,
    wins: 4,
    losses: 3,
    average: 47.66,
    checkoutPercent: 30.1,
    recentMatches: [],
    profileUserId: "sample-user-tr",
  }),
  player({
    id: "lp-lp",
    firstName: "Logan",
    lastName: "Perez",
    nickname: null,
    email: null,
    phone: null,
    avatarUrl: null,
    color: "#68707C",
    teamId: "lt-double",
    teamName: "Double Trouble",
    leagueStatus: "active",
    vectorAccount: "profile-only",
    matchesPlayed: 5,
    wins: 2,
    losses: 3,
    average: 39.2,
    checkoutPercent: 22.0,
    recentMatches: [],
    savedPlayerId: "sample-saved-lp",
  }),
  player({
    id: "lp-sw",
    firstName: "Sam",
    lastName: "Washington",
    nickname: null,
    email: "sam@example.com",
    phone: null,
    avatarUrl: null,
    color: "#84C126",
    teamId: "lt-flight",
    teamName: "Flight Club",
    leagueStatus: "active",
    vectorAccount: "connected",
    matchesPlayed: 8,
    wins: 6,
    losses: 2,
    average: 54.9,
    checkoutPercent: 37.5,
    recentMatches: [],
    profileUserId: "sample-user-sw",
  }),
  player({
    id: "lp-mn",
    firstName: "Morgan",
    lastName: "Nash",
    nickname: null,
    email: "morgan@example.com",
    phone: null,
    avatarUrl: null,
    color: "#B8892B",
    teamId: "lt-flight",
    teamName: "Flight Club",
    leagueStatus: "invited",
    vectorAccount: "invitation-pending",
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    average: null,
    checkoutPercent: null,
    recentMatches: [],
  }),
  player({
    id: "lp-rb",
    firstName: "Riley",
    lastName: "Brooks",
    nickname: null,
    email: null,
    phone: null,
    avatarUrl: null,
    color: "#68707C",
    teamId: null,
    teamName: null,
    leagueStatus: "active",
    vectorAccount: "profile-only",
    matchesPlayed: 4,
    wins: 1,
    losses: 3,
    average: 36.75,
    checkoutPercent: 18.0,
    recentMatches: [],
  }),
  player({
    id: "lp-dh",
    firstName: "Dana",
    lastName: "Hughes",
    nickname: "DH",
    email: "dana@example.com",
    phone: null,
    avatarUrl: null,
    color: "#84C126",
    teamId: "lt-bull",
    teamName: "Bull Chasers",
    leagueStatus: "active",
    vectorAccount: "connected",
    matchesPlayed: 8,
    wins: 4,
    losses: 4,
    average: 49.33,
    checkoutPercent: 29.4,
    recentMatches: [],
    profileUserId: "sample-user-dh",
  }),
  player({
    id: "lp-jc",
    firstName: "Jordan",
    lastName: "Cole",
    nickname: null,
    email: null,
    phone: null,
    avatarUrl: null,
    color: "#555861",
    teamId: null,
    teamName: null,
    leagueStatus: "inactive",
    vectorAccount: "no-account",
    matchesPlayed: 2,
    wins: 0,
    losses: 2,
    average: 28.5,
    checkoutPercent: 10.0,
    recentMatches: [],
  }),
  player({
    id: "lp-ev",
    firstName: "Ellis",
    lastName: "Voss",
    nickname: null,
    email: "ellis@example.com",
    phone: null,
    avatarUrl: null,
    color: "#84C126",
    teamId: "lt-double",
    teamName: "Double Trouble",
    leagueStatus: "active",
    vectorAccount: "connected",
    matchesPlayed: 7,
    wins: 5,
    losses: 2,
    average: 52.17,
    checkoutPercent: 35.2,
    recentMatches: [],
    profileUserId: "sample-user-ev",
  }),
  player({
    id: "lp-jd",
    firstName: "John",
    lastName: "Doe",
    nickname: null,
    email: "john@example.com",
    phone: null,
    avatarUrl: null,
    color: "#6B8FBF",
    teamId: "lt-flight",
    teamName: "Flight Club",
    leagueStatus: "active",
    vectorAccount: "profile-only",
    matchesPlayed: 8,
    wins: 4,
    losses: 4,
    average: 49.6,
    checkoutPercent: 41.8,
    highestCheckout: 96,
    count180s: 3,
    recentMatches: [],
  }),
];

/** Directory of profiles a director can search before creating. */
export const SAMPLE_PLAYER_DIRECTORY: LeaguePlayerDirectoryHit[] = [
  {
    id: "dir-jg",
    firstName: "Jason",
    lastName: "Gelsomino",
    nickname: "The Machine",
    avatarUrl: null,
    color: "#84C126",
    kind: "vector-user",
    email: "jason@example.com",
  },
  {
    id: "dir-ms",
    firstName: "Mike",
    lastName: "Smith",
    nickname: null,
    avatarUrl: null,
    color: "#68707C",
    kind: "player-profile",
  },
  {
    id: "dir-pr",
    firstName: "Pat",
    lastName: "Rivera",
    nickname: "River",
    avatarUrl: null,
    color: "#84C126",
    kind: "vector-user",
    email: "pat@example.com",
  },
  {
    id: "dir-nl",
    firstName: "Nina",
    lastName: "Lopez",
    nickname: null,
    avatarUrl: null,
    color: "#68707C",
    kind: "player-profile",
  },
  {
    id: "dir-ko",
    firstName: "Kai",
    lastName: "Okada",
    nickname: null,
    avatarUrl: null,
    color: "#84C126",
    kind: "vector-user",
    email: "kai@example.com",
  },
];

export const SAMPLE_LEAGUE_TEAM_OPTIONS = [...SAMPLE_TEAMS];

export function getSampleLeaguePlayers(leagueId: string): LeaguePlayer[] {
  const trimmed = leagueId.trim();

  if (!trimmed || !trimmed.startsWith("sample-")) {
    return [];
  }

  return SAMPLE_LEAGUE_PLAYERS.map((entry) => ({
    ...entry,
    recentMatches: [...entry.recentMatches],
  }));
}

export function searchPlayerDirectory(
  query: string,
  excludeNames: Set<string>,
): LeaguePlayerDirectoryHit[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 1) {
    return [];
  }

  return SAMPLE_PLAYER_DIRECTORY.filter((hit) => {
    const fullName = leaguePlayerDisplayName(hit).toLowerCase();

    if (excludeNames.has(fullName)) {
      return false;
    }

    return (
      fullName.includes(normalized) ||
      (hit.nickname?.toLowerCase().includes(normalized) ?? false) ||
      (hit.email?.toLowerCase().includes(normalized) ?? false)
    );
  });
}

export function createLeaguePlayerFromInput(
  input: CreateLeaguePlayerInput,
): LeaguePlayer {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  return {
    id: `lp-local-${Date.now()}`,
    firstName,
    lastName,
    nickname: input.nickname?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    avatarUrl: input.avatarUrl ?? null,
    color: "#68707C",
    teamId: null,
    teamName: null,
    leagueStatus: input.email ? "invited" : "active",
    vectorAccount: input.email ? "invitation-pending" : "profile-only",
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    average: null,
    checkoutPercent: null,
    highestCheckout: null,
    count180s: null,
    recentMatches: [],
  };
}

export function createLeaguePlayerFromDirectoryHit(
  hit: LeaguePlayerDirectoryHit,
): LeaguePlayer {
  return {
    id: `lp-dir-${hit.id}-${Date.now()}`,
    firstName: hit.firstName,
    lastName: hit.lastName,
    nickname: hit.nickname,
    email: hit.email ?? null,
    phone: null,
    avatarUrl: hit.avatarUrl,
    color: hit.color,
    teamId: null,
    teamName: null,
    leagueStatus: "active",
    vectorAccount: hit.kind === "vector-user" ? "connected" : "profile-only",
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    average: null,
    checkoutPercent: null,
    highestCheckout: null,
    count180s: null,
    recentMatches: [],
    profileUserId: hit.kind === "vector-user" ? hit.id : null,
    savedPlayerId: hit.kind === "player-profile" ? hit.id : null,
  };
}
