export type HelpSectionId =
  | "overview"
  | "matches"
  | "practice"
  | "stats"
  | "players"
  | "customize";

export interface HelpSection {
  id: HelpSectionId;
  label: string;
  description: string;
  body: string;
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Your complete darts companion for scoring, practice, competition, and improving your game.",
    body: "",
  },
  {
    id: "matches",
    label: "Match play",
    description: "Competitive darts made simple for leagues, tournaments, and head-to-head play.",
    body: "",
  },
  {
    id: "practice",
    label: "Practice",
    description: "Improve your game one throw at a time with focused training drills.",
    body: "",
  },
  {
    id: "stats",
    label: "Statistics",
    description: "Understand your game and improve your performance with scoring and match insights.",
    body: "",
  },
  {
    id: "players",
    label: "Players",
    description: "Manage player profiles, competitors, and performance over time.",
    body: "",
  },
  {
    id: "customize",
    label: "Customize",
    description: "Board themes, gameplay feedback, and profile preferences to make DartOS yours.",
    body: "",
  },
];

export const DEFAULT_HELP_SECTION: HelpSectionId = "overview";
