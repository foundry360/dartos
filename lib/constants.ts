/** Minimum touch target size per Apple HIG (points). */
export const TOUCH_MIN_SIZE_PX = 52;

/** Maximum darts thrown per visit. */
export const DARTS_PER_VISIT = 3;

/** Supported player count range for multiplayer matches. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** Standard classic cricket target numbers plus bull (15–20). */
export const CLASSIC_CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, "bull"] as const;

/** Tactics cricket targets (10–20 plus bull). */
export const TACTICS_CRICKET_TARGETS = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, "bull",
] as const;

/** @deprecated Use getCricketTargets(variant) instead. */
export const CRICKET_TARGETS = CLASSIC_CRICKET_TARGETS;

export type CricketVariant = "classic" | "tactics";

export type CricketTarget = (typeof TACTICS_CRICKET_TARGETS)[number];

export function getCricketTargets(
  variant: CricketVariant = "classic",
): readonly CricketTarget[] {
  return variant === "tactics" ? TACTICS_CRICKET_TARGETS : CLASSIC_CRICKET_TARGETS;
}

export function getCricketTargetCount(variant: CricketVariant = "classic"): number {
  return getCricketTargets(variant).length;
}

export function formatCricketVariantLabel(variant: CricketVariant): string {
  return variant === "tactics" ? "Tactics" : "Cricket";
}

export function formatCricketVariantRange(variant: CricketVariant): string {
  return variant === "tactics" ? "10–20 & Bull" : "15–20 & Bull";
}

/** X01 starting scores available from setup. */
export const X01_GAME_TYPES = [201, 301, 501, 701] as const;

/** Default legs per set in X01 matches. */
export const DEFAULT_LEGS = 3;
export const DEFAULT_SETS = 1;

/** Animation durations (ms). */
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  hitPulse: 1000,
} as const;

/** Z-index layers for consistent stacking. */
export const Z_INDEX = {
  base: 0,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;

export type X01GameType = (typeof X01_GAME_TYPES)[number];
