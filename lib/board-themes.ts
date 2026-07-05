export type BoardThemeId = string;

export interface BoardThemeColors {
  /** Sisal surround / board background. */
  boardBase: string;
  /** First alternating single-segment color. */
  segmentPrimary: string;
  /** Second alternating single-segment color. */
  segmentSecondary: string;
  /** Treble ring color (or even wedge when alternating). */
  triple: string;
  /** Double ring color (or even wedge when alternating). */
  double: string;
  bullOuter: string;
  bullInner: string;
  wire: string;
  wireDark: string;
  label: string;
  /** Classic-style green/red alternation on treble & double rings. */
  alternateScoringRings?: boolean;
  /** Odd-wedge color when alternateScoringRings is enabled. */
  scoringRingAccent?: string;
}

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  description: string;
  colors: BoardThemeColors;
}

export const DEFAULT_BOARD_THEME_ID: BoardThemeId = "classic";

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional sisal tournament board",
    colors: {
      boardBase: "#5a3d28",
      segmentPrimary: "#1e1812",
      segmentSecondary: "#f2e8cf",
      triple: "#15803d",
      double: "#15803d",
      bullOuter: "#15803d",
      bullInner: "#b91c3a",
      wire: "#9ca3af",
      wireDark: "#374151",
      label: "#f2e8cf",
      alternateScoringRings: true,
      scoringRingAccent: "#b91c3a",
    },
  },
  {
    id: "gold",
    name: "Gold",
    description: "Rich gold wedges on a deep charcoal base",
    colors: {
      boardBase: "#14100a",
      segmentPrimary: "#1f1810",
      segmentSecondary: "#c9a227",
      triple: "#f5d547",
      double: "#a67c00",
      bullOuter: "#f5d547",
      bullInner: "#8b6914",
      wire: "#d4af37",
      wireDark: "#3d3018",
      label: "#f8ecc8",
    },
  },
  {
    id: "teal",
    name: "Teal",
    description: "Cool teal singles with bright aqua scoring rings",
    colors: {
      boardBase: "#071418",
      segmentPrimary: "#0c2229",
      segmentSecondary: "#5eead4",
      triple: "#2dd4bf",
      double: "#0f766e",
      bullOuter: "#14b8a6",
      bullInner: "#115e59",
      wire: "#5eead4",
      wireDark: "#134e4a",
      label: "#ccfbf1",
    },
  },
  {
    id: "black",
    name: "Black",
    description: "Monochrome singles with silver scoring rings",
    colors: {
      boardBase: "#050505",
      segmentPrimary: "#121212",
      segmentSecondary: "#3f3f46",
      triple: "#71717a",
      double: "#a1a1aa",
      bullOuter: "#52525b",
      bullInner: "#d4d4d8",
      wire: "#737373",
      wireDark: "#262626",
      label: "#e4e4e7",
    },
  },
];

const themeMap = new Map(BOARD_THEMES.map((theme) => [theme.id, theme]));

export function getBoardTheme(id: BoardThemeId): BoardTheme {
  return themeMap.get(id) ?? themeMap.get(DEFAULT_BOARD_THEME_ID)!;
}

export function getBoardThemeColors(id: BoardThemeId): BoardThemeColors {
  return getBoardTheme(id).colors;
}

export function isBoardThemeId(value: string): value is BoardThemeId {
  return themeMap.has(value as BoardThemeId);
}
