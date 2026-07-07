import type { DartHit } from "@/types/dart";
import type { PracticeGameId } from "@/types/practice";

export const CONSECUTIVE_BULLS_GAME_ID = "consecutive-bulls" as const;

export type ConsecutiveBullsStreakTarget = 3 | 5 | 10;

export type ConsecutiveBullsSessionGameId =
  | "consecutive-bulls-3"
  | "consecutive-bulls-5"
  | "consecutive-bulls-10";

export interface ConsecutiveBullsStats {
  setsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  averageStreak: number;
  longestMissFreeRun: number;
  bullsHit: number;
  misses: number;
  dartsThrown: number;
}

const CONSECUTIVE_BULLS_STREAK_TARGETS: Record<
  ConsecutiveBullsSessionGameId,
  ConsecutiveBullsStreakTarget
> = {
  "consecutive-bulls-3": 3,
  "consecutive-bulls-5": 5,
  "consecutive-bulls-10": 10,
};

export function isConsecutiveBullsBaseGame(gameId: PracticeGameId | null): boolean {
  return gameId === CONSECUTIVE_BULLS_GAME_ID;
}

export function isConsecutiveBullsSessionGame(
  gameId: PracticeGameId | null,
): gameId is ConsecutiveBullsSessionGameId {
  return (
    gameId === "consecutive-bulls-3" ||
    gameId === "consecutive-bulls-5" ||
    gameId === "consecutive-bulls-10"
  );
}

export function isConsecutiveBullsPickerActive(gameId: PracticeGameId | null): boolean {
  return isConsecutiveBullsBaseGame(gameId) || isConsecutiveBullsSessionGame(gameId);
}

export function getConsecutiveBullsStreakTarget(
  gameId: ConsecutiveBullsSessionGameId,
): ConsecutiveBullsStreakTarget {
  return CONSECUTIVE_BULLS_STREAK_TARGETS[gameId];
}

export function computeConsecutiveBullsStats(
  darts: DartHit[],
  required: ConsecutiveBullsStreakTarget,
): ConsecutiveBullsStats {
  let currentStreak = 0;
  let bestStreak = 0;
  let missFreeRun = 0;
  let longestMissFreeRun = 0;
  let setsCompleted = 0;
  let bullsHit = 0;
  let misses = 0;
  const bullRunsEndingOnMiss: number[] = [];

  for (const dart of darts) {
    if (dart.segment === "bull") {
      bullsHit += 1;
      currentStreak += 1;
      missFreeRun += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      longestMissFreeRun = Math.max(longestMissFreeRun, missFreeRun);

      if (currentStreak >= required) {
        setsCompleted += 1;
        currentStreak = 0;
      }

      continue;
    }

    misses += 1;

    if (missFreeRun > 0) {
      bullRunsEndingOnMiss.push(missFreeRun);
    }

    missFreeRun = 0;
    currentStreak = 0;
  }

  const averageStreak =
    bullRunsEndingOnMiss.length > 0
      ? bullRunsEndingOnMiss.reduce((sum, value) => sum + value, 0) / bullRunsEndingOnMiss.length
      : 0;

  return {
    setsCompleted,
    currentStreak,
    bestStreak,
    averageStreak,
    longestMissFreeRun,
    bullsHit,
    misses,
    dartsThrown: darts.length,
  };
}

export function formatConsecutiveBullsAverage(value: number): string {
  return value.toFixed(1);
}
