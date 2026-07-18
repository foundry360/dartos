/** Standard dartboard segment order clockwise from the top (20). */
export const SEGMENT_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

/** Angular width of each scoring wedge (degrees). */
export const SEGMENT_ANGLE = 360 / SEGMENT_ORDER.length;

/** Normalized board radii relative to the outer double ring.
 * Double / treble / outer bull are thickened vs tournament geometry
 * to make touch scoring easier on tablets.
 */
export const BOARD_RADII = {
  outer: 1,
  doubleOuter: 1,
  doubleInner: 0.91,
  tripleOuter: 0.652,
  tripleInner: 0.558,
  bullOuter: 0.145,
  bullInner: 0.065,
} as const;

export const BOARD_SIZE = 400;
export const BOARD_CENTER = BOARD_SIZE / 2;

/** Tournament-standard double bull (inner bull) color on every board theme. */
export const INNER_BULL_COLOR = "#b91c3a";

/** Padding between the outermost graphic and the SVG viewBox edge. */
export const VIEWBOX_PADDING = 8;

/** Keep in sync with Dartboard label font size. */
export const LABEL_FONT_SIZE = 11;

/** Gap between the double ring and segment number centers. */
export const LABEL_OUTSET_FROM_DOUBLE = 9;

/** Radial space needed for the full glyph (covers bold two-digit numbers). */
export const LABEL_RADIAL_EXTENT = LABEL_FONT_SIZE * 0.72;

/** Sisal rim beyond the outermost label edge. */
export const SURROUND_BEYOND_LABELS = 5;

/** Space reserved outside the double ring for labels and outer sisal rim. */
export const OUTER_RING_RESERVE =
  LABEL_OUTSET_FROM_DOUBLE + LABEL_RADIAL_EXTENT + SURROUND_BEYOND_LABELS;

/** Outer edge of the sisal surround — encompasses segment numbers. */
export const BOARD_SURROUND = OUTER_RING_RESERVE;

/** Scoring area radius (outer edge of the double ring). */
export function getScoringBoardRadius(): number {
  return BOARD_CENTER - VIEWBOX_PADDING - OUTER_RING_RESERVE;
}

/** Outer edge of the sisal surround / board rim. */
export function getBoardSurroundRadius(boardRadius: number = getScoringBoardRadius()): number {
  return boardRadius + BOARD_SURROUND;
}

/** Render order: back layers first, front layers last. */
export const RING_RENDER_ORDER = [
  "single-inner",
  "triple",
  "single-outer",
  "double",
  "bull-outer",
  "bull-inner",
] as const;

/** @deprecated Use getBoardThemeColors from @/lib/board-themes instead. */
export const BOARD_COLORS = {
  boardBase: "#5a3d28",
  black: "#1e1812",
  cream: "#f2e8cf",
  red: "#b91c3a",
  green: "#15803d",
  wire: "#9ca3af",
  wireDark: "#374151",
} as const;

export const PLAYER_COLORS = [
  "#84C126",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f97316",
] as const;
