export type LeagueDetailSectionId =
  | "overview"
  | "rules"
  | "players"
  | "teams"
  | "schedule"
  | "night"
  | "matches"
  | "standings"
  | "statistics";

export interface LeagueDetailSection {
  id: LeagueDetailSectionId;
  label: string;
  description: string;
}

export const LEAGUE_DETAIL_SECTIONS: LeagueDetailSection[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Setup status and league summary",
  },
  {
    id: "rules",
    label: "Game Rules",
    description: "Match play scoring and gameplay rules",
  },
  {
    id: "players",
    label: "Players",
    description: "Roster and player management",
  },
  {
    id: "teams",
    label: "Teams",
    description: "Team creation and assignments",
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Season calendar and match nights",
  },
  {
    id: "matches",
    label: "Matches",
    description: "Results and match history",
  },
  {
    id: "standings",
    label: "Standings",
    description: "League table and rankings",
  },
  {
    id: "statistics",
    label: "Statistics",
    description: "League stats and trends",
  },
  {
    id: "night",
    label: "League Night",
    description: "Live operations command center",
  },
];

export const DEFAULT_LEAGUE_DETAIL_SECTION: LeagueDetailSectionId = "overview";

/** Ordered setup wizard steps (Game Rules → … → Schedule). */
export const LEAGUE_DETAIL_SETUP_FLOW: readonly LeagueDetailSectionId[] = [
  "rules",
  "players",
  "teams",
  "schedule",
] as const;

export type LeagueSetupSaveStatus = "idle" | "saving" | "saved";

/** Next setup tab after `current`, skipping Teams for singles leagues. */
export function getNextLeagueSetupSection(
  current: LeagueDetailSectionId,
  options?: { isSingles?: boolean },
): LeagueDetailSectionId | null {
  const flow: LeagueDetailSectionId[] = options?.isSingles
    ? ["rules", "players", "schedule"]
    : ["rules", "players", "teams", "schedule"];
  const index = flow.indexOf(current);

  if (index < 0 || index >= flow.length - 1) {
    return null;
  }

  return flow[index + 1] ?? null;
}

/** Setup sections that become read-only once League Night is started. */
export const LEAGUE_DETAIL_NIGHT_LOCKED_SECTIONS: ReadonlySet<LeagueDetailSectionId> =
  new Set([
    "overview",
    "rules",
    "players",
    "teams",
    "schedule",
    "matches",
  ]);

export function isLeagueDetailSectionLockedDuringNight(
  section: LeagueDetailSectionId,
): boolean {
  return LEAGUE_DETAIL_NIGHT_LOCKED_SECTIONS.has(section);
}

/** Results tabs — only after the league is published. */
export const LEAGUE_DETAIL_POST_PUBLISH_SECTIONS: ReadonlySet<LeagueDetailSectionId> =
  new Set(["matches", "standings", "statistics"]);

export function isLeagueNightSectionVisible(input: {
  isPublished: boolean;
  hasSchedule: boolean;
}): boolean {
  return input.isPublished && input.hasSchedule;
}

export function isLeaguePostPublishSectionVisible(input: {
  isPublished: boolean;
}): boolean {
  return input.isPublished;
}

export function getVisibleLeagueDetailSections(input: {
  isPublished: boolean;
  hasSchedule: boolean;
}): LeagueDetailSection[] {
  return LEAGUE_DETAIL_SECTIONS.filter((section) => {
    if (LEAGUE_DETAIL_POST_PUBLISH_SECTIONS.has(section.id)) {
      return isLeaguePostPublishSectionVisible(input);
    }
    if (section.id === "night") {
      return isLeagueNightSectionVisible(input);
    }
    return true;
  });
}

export function parseLeagueDetailSection(
  value: string | null | undefined,
  options?: {
    allowNight?: boolean;
    allowPostPublish?: boolean;
  },
): LeagueDetailSectionId {
  if (value === "night" && options && options.allowNight === false) {
    return DEFAULT_LEAGUE_DETAIL_SECTION;
  }

  if (
    value &&
    LEAGUE_DETAIL_POST_PUBLISH_SECTIONS.has(value as LeagueDetailSectionId) &&
    options &&
    options.allowPostPublish === false
  ) {
    return DEFAULT_LEAGUE_DETAIL_SECTION;
  }

  if (value && LEAGUE_DETAIL_SECTIONS.some((section) => section.id === value)) {
    return value as LeagueDetailSectionId;
  }

  return DEFAULT_LEAGUE_DETAIL_SECTION;
}
