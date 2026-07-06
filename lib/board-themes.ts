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
  /** Primary wedges get white scoring rings; other wedges get the primary color. */
  segmentMatchedScoringRings?: boolean;
  /** Which single color gets white scoring rings. Defaults to segmentSecondary. */
  whiteScoringRingsOn?: "segmentPrimary" | "segmentSecondary";
  /** Scoring ring color on non-white wedges. Defaults to segmentSecondary. */
  scoringRingPrimary?: string;
  /** Explicit scoring ring colors per wedge when both are set. */
  scoringRingOnSegmentPrimary?: string;
  scoringRingOnSegmentSecondary?: string;
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
    description: "Navy surround with blue wedges and white scoring rings",
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
      segmentMatchedScoringRings: true,
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
      triple: "#ffffff",
      double: "#ffffff",
      bullOuter: "#D7A22A",
      bullInner: "#b91c3a",
      wire: "#9F792C",
      wireDark: "#050810",
      label: "#ffffff",
      alternateScoringRings: true,
      scoringRingAccent: "#D7A22A",
      playerColors: ["#006778", "#D7A22A"],
      markColor: "#D7A22A",
    },
  },
  {
    id: "yankees",
    name: "Yankees",
    description: "Midnight navy and silver wedges with white and blue scoring rings",
    colors: {
      boardBase: "#0C2340",
      segmentPrimary: "#0C2340",
      segmentSecondary: "#C4CED4",
      triple: "#ffffff",
      double: "#ffffff",
      bullOuter: "#C4CED4",
      bullInner: "#b91c3a",
      wire: "#C4CED4",
      wireDark: "#001A33",
      label: "#ffffff",
      segmentMatchedScoringRings: true,
      whiteScoringRingsOn: "segmentPrimary",
      playerColors: ["#C4CED4", "#003087"],
      markColor: "#C4CED4",
    },
  },
  {
    id: "gators",
    name: "Gators",
    description: "Gator blue surround with orange wedges and white scoring rings",
    colors: {
      boardBase: "#0021A5",
      segmentPrimary: "#0021A5",
      segmentSecondary: "#FA4616",
      triple: "#ffffff",
      double: "#ffffff",
      bullOuter: "#0021A5",
      bullInner: "#b91c3a",
      wire: "#FA4616",
      wireDark: "#001233",
      label: "#ffffff",
      segmentMatchedScoringRings: true,
      playerColors: ["#FA4616", "#0021A5"],
      markColor: "#FA4616",
    },
  },
  {
    id: "golden-knights",
    name: "Golden Knights",
    description: "Black and gold wedges with gold and red scoring rings",
    colors: {
      boardBase: "#1A1A1A",
      segmentPrimary: "#1A1A1A",
      segmentSecondary: "#B4975A",
      triple: "#ffffff",
      double: "#ffffff",
      bullOuter: "#B4975A",
      bullInner: "#b91c3a",
      wire: "#B4975A",
      wireDark: "#0A0A0A",
      label: "#ffffff",
      segmentMatchedScoringRings: true,
      scoringRingOnSegmentPrimary: "#B4975A",
      scoringRingOnSegmentSecondary: "#C8102E",
      playerColors: ["#B4975A", "#C8102E"],
      markColor: "#B4975A",
    },
  },
  {
    id: "ohio-state",
    name: "Ohio State",
    description: "Charcoal surround with scarlet wedges and white scoring rings",
    colors: {
      boardBase: "#2B2B2B",
      segmentPrimary: "#666666",
      segmentSecondary: "#BB0000",
      triple: "#ffffff",
      double: "#ffffff",
      bullOuter: "#666666",
      bullInner: "#b91c3a",
      wire: "#A7B1B7",
      wireDark: "#1A1A1A",
      label: "#ffffff",
      segmentMatchedScoringRings: true,
      playerColors: ["#BB0000", "#666666"],
      markColor: "#BB0000",
    },
  },
  {
    id: "lsu",
    name: "LSU",
    description: "Purple surround with gold wedges and purple scoring rings",
    colors: {
      boardBase: "#461D7C",
      segmentPrimary: "#461D7C",
      segmentSecondary: "#FDD023",
      triple: "#461D7C",
      double: "#461D7C",
      bullOuter: "#FDD023",
      bullInner: "#b91c3a",
      wire: "#FDD023",
      wireDark: "#2E1250",
      label: "#ffffff",
      segmentMatchedScoringRings: true,
      scoringRingOnSegmentPrimary: "#FDD023",
      scoringRingOnSegmentSecondary: "#461D7C",
      playerColors: ["#FDD023", "#461D7C"],
      markColor: "#FDD023",
    },
  },
];

const themeMap = new Map(BOARD_THEMES.map((theme) => [theme.id, theme]));

/** Built-in themes ship with the app; remote rows only add themes not in the bundle. */
export function mergeBoardThemes(remoteThemes: BoardTheme[]): BoardTheme[] {
  if (remoteThemes.length === 0) {
    return BOARD_THEMES;
  }

  const merged = [...BOARD_THEMES];

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

export function getBoardThemeWireColor(colors: BoardThemeColors): string {
  return colors.wire;
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
