/** Minimum touch target size per Apple HIG (points). */
export const TOUCH_MIN_SIZE_PX = 52;

/** Maximum darts thrown per visit. */
export const DARTS_PER_VISIT = 3;

/** Supported player count range for multiplayer games. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/** Standard cricket target numbers plus bull. */
export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, "bull"] as const;

/** X01 starting scores available from the home screen. */
export const X01_GAME_TYPES = [301, 501, 701] as const;

/** Default legs per set in X01 matches. */
export const DEFAULT_LEGS = 3;
export const DEFAULT_SETS = 1;

/** Animation durations (ms). */
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** Z-index layers for consistent stacking. */
export const Z_INDEX = {
  base: 0,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;

export type X01GameType = (typeof X01_GAME_TYPES)[number];
export type CricketTarget = (typeof CRICKET_TARGETS)[number];
