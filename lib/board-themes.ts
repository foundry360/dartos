import { PLAYER_COLORS } from "@/utils/dartboard/constants";

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
  /** Optional per-theme default player colors (index order). */
  playerColors?: string[];
  /** Cricket marks and scoring UI accent when this theme is active. */
  markColor?: string;
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
  {
    id: "patriot",
    name: "Patriot",
    description: "Navy surround with blue wedges and red scoring rings",
    colors: {
      boardBase: "#002A5B",
      segmentPrimary: "#002A5B",
      segmentSecondary: "#4093D0",
      triple: "#ffffff",
      double: "#ffffff",
      bullOuter: "#ffffff",
      bullInner: "#D12328",
      wire: "#cbd5e1",
      wireDark: "#001833",
      label: "#ffffff",
      alternateScoringRings: true,
      scoringRingAccent: "#D12328",
      playerColors: ["#4093D0", "#002A5B"],
      markColor: "#D12328",
    },
  },
  {
    id: "jaguars",
    name: "Jaguars",
    description: "Black surround with teal wedges and gold scoring rings",
    colors: {
      boardBase: "#101820",
      segmentPrimary: "#101820",
      segmentSecondary: "#006778",
      triple: "#D7A22A",
      double: "#D7A22A",
      bullOuter: "#D7A22A",
      bullInner: "#006778",
      wire: "#9F792C",
      wireDark: "#050810",
      label: "#ffffff",
      alternateScoringRings: true,
      scoringRingAccent: "#9F792C",
      playerColors: ["#006778", "#D7A22A"],
      markColor: "#D7A22A",
    },
  },
];

const themeMap = new Map(BOARD_THEMES.map((theme) => [theme.id, theme]));

/** Remote Supabase themes override matching ids; local-only themes (e.g. patriot) stay available. */
export function mergeBoardThemes(remoteThemes: BoardTheme[]): BoardTheme[] {
  if (remoteThemes.length === 0) {
    return BOARD_THEMES;
  }

  const remoteById = new Map(remoteThemes.map((theme) => [theme.id, theme]));
  const merged = BOARD_THEMES.map((local) => remoteById.get(local.id) ?? local);

  for (const remote of remoteThemes) {
    if (!themeMap.has(remote.id as BoardThemeId)) {
      merged.push(remote);
    }
  }

  return merged;
}

export function getBoardTheme(id: BoardThemeId): BoardTheme {
  return themeMap.get(id) ?? themeMap.get(DEFAULT_BOARD_THEME_ID)!;
}

export function getBoardThemeColors(id: BoardThemeId): BoardThemeColors {
  return getBoardTheme(id).colors;
}

/** Primary UI accent derived from the active board palette (highlight wedge). */
export function getBoardThemePrimaryColor(colors: BoardThemeColors): string {
  return colors.segmentSecondary;
}

export function getBoardThemeMarkColor(colors: BoardThemeColors): string {
  return colors.markColor ?? getBoardThemePrimaryColor(colors);
}

export function getBoardThemePlayerColors(colors: BoardThemeColors): string[] {
  if (colors.playerColors?.length) {
    return colors.playerColors;
  }

  return [...PLAYER_COLORS];
}

export function isBoardThemeId(value: string): value is BoardThemeId {
  return themeMap.has(value as BoardThemeId);
}
