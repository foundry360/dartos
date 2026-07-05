/** Standard dartboard segment order clockwise from the top (20). */
export const SEGMENT_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

/** Angular width of each scoring wedge (degrees). */
export const SEGMENT_ANGLE = 360 / SEGMENT_ORDER.length;

/** Normalized board radii relative to the outer double ring. */
export const BOARD_RADII = {
  outer: 1,
  doubleOuter: 1,
  doubleInner: 0.953,
  tripleOuter: 0.629,
  tripleInner: 0.582,
  bullOuter: 0.094,
  bullInner: 0.037,
} as const;

export const BOARD_SIZE = 400;
export const BOARD_CENTER = BOARD_SIZE / 2;

/** Padding between the outermost graphic and the SVG viewBox edge. */
export const VIEWBOX_PADDING = 6;

/** Sisal surround width outside the double ring. */
export const BOARD_SURROUND = 7;

/** Distance from double-ring outer edge to number label center. */
export const LABEL_OUTSET_FROM_DOUBLE = 7;

/** Keep in sync with Dartboard label font size. */
export const LABEL_FONT_SIZE = 11;

/** Space reserved outside the double ring for labels and outer rim. */
export const OUTER_RING_RESERVE = Math.max(
  BOARD_SURROUND,
  LABEL_OUTSET_FROM_DOUBLE + LABEL_FONT_SIZE * 0.7,
);

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

/** Colors matching a tournament-style sisal board with strong contrast. */
export const BOARD_COLORS = {
  /** Sisal backing visible between wires and under segments. */
  boardBase: "#5a3d28",
  /** Dark wedge (even numbers). */
  black: "#1e1812",
  /** Light wedge (odd numbers). */
  cream: "#f2e8cf",
  red: "#b91c3a",
  green: "#15803d",
  /** Wire dividers — light enough to read on dark and light wedges. */
  wire: "#9ca3af",
  wireDark: "#374151",
} as const;

export const PLAYER_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f97316",
] as const;
