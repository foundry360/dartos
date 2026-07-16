export type LeagueDetailSectionId =
  | "overview"
  | "rules"
  | "players"
  | "teams"
  | "schedule"
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
];

export const DEFAULT_LEAGUE_DETAIL_SECTION: LeagueDetailSectionId = "overview";

export function parseLeagueDetailSection(
  value: string | null | undefined,
): LeagueDetailSectionId {
  if (value && LEAGUE_DETAIL_SECTIONS.some((section) => section.id === value)) {
    return value as LeagueDetailSectionId;
  }

  return DEFAULT_LEAGUE_DETAIL_SECTION;
}
