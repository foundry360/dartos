import type { DartHit } from "@/types/dart";
import type { PracticeGameId } from "@/types/practice";

export const BULL_COUNT_GAME_ID = "bull-count" as const;
export const BULL_COUNT_DART_LIMIT = 75;
export const BULL_COUNT_VISIT_LIMIT = 25;
export const BULL_COUNT_DARTS_PER_VISIT = 3;

export interface BullCountStats {
  bullsHit: number;
  outerBulls: number;
  innerBulls: number;
  misses: number;
  currentStreak: number;
  bestStreak: number;
  dartsThrown: number;
  visitsCompleted: number;
}

export function isBullCountGame(gameId: PracticeGameId | null): gameId is typeof BULL_COUNT_GAME_ID {
  return gameId === BULL_COUNT_GAME_ID;
}

export function computeBullCountStats(darts: DartHit[]): BullCountStats {
  let outerBulls = 0;
  let innerBulls = 0;
  let misses = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  for (const dart of darts) {
    if (dart.segment === "bull" && dart.multiplier === "double") {
      innerBulls += 1;
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      continue;
    }

    if (dart.segment === "bull") {
      outerBulls += 1;
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      continue;
    }

    misses += 1;
    currentStreak = 0;
  }

  return {
    bullsHit: outerBulls + innerBulls,
    outerBulls,
    innerBulls,
    misses,
    currentStreak,
    bestStreak,
    dartsThrown: darts.length,
    visitsCompleted: Math.floor(darts.length / BULL_COUNT_DARTS_PER_VISIT),
  };
}

export function getBullCountPercentage(hits: number, dartsThrown: number): number {
  if (dartsThrown === 0) {
    return 0;
  }

  return (hits / dartsThrown) * 100;
}

export function formatBullCountPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCurrentBullCountVisit(dartsThrown: number): number {
  return Math.min(
    BULL_COUNT_VISIT_LIMIT,
    Math.floor(dartsThrown / BULL_COUNT_DARTS_PER_VISIT) + 1,
  );
}
