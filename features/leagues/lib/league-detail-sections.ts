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

export function isLeagueNightSectionVisible(input: {
  isPublished: boolean;
  hasSchedule: boolean;
}): boolean {
  return input.isPublished && input.hasSchedule;
}

export function getVisibleLeagueDetailSections(input: {
  isPublished: boolean;
  hasSchedule: boolean;
}): LeagueDetailSection[] {
  return LEAGUE_DETAIL_SECTIONS.filter((section) => {
    if (section.id !== "night") {
      return true;
    }
    return isLeagueNightSectionVisible(input);
  });
}

export function parseLeagueDetailSection(
  value: string | null | undefined,
  options?: { allowNight?: boolean },
): LeagueDetailSectionId {
  if (value === "night" && options && options.allowNight === false) {
    return DEFAULT_LEAGUE_DETAIL_SECTION;
  }

  if (value && LEAGUE_DETAIL_SECTIONS.some((section) => section.id === value)) {
    return value as LeagueDetailSectionId;
  }

  return DEFAULT_LEAGUE_DETAIL_SECTION;
}
