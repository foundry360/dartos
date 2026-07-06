import type { DartHit } from "@/types/dart";
import type { PracticeGameId, Treble20DartLimit, Treble20OnlyGameId } from "@/types/practice";
import type { PracticeTargetDisplay } from "@/features/practice/lib/round-the-clock";

export const TREBLE_20_TARGET: PracticeTargetDisplay = {
  segment: 20,
  multiplier: "triple",
  label: "T20",
  displayLabel: "Treble 20",
};

export type Treble20DartKind = "t20" | "s20" | "d20" | "miss";

export type Treble20DartInputKind = Treble20DartKind;

export interface Treble20OnlyStats {
  t20Hits: number;
  s20Hits: number;
  d20Hits: number;
  misses: number;
  currentStreak: number;
  bestStreak: number;
  totalScore: number;
  dartsThrown: number;
}

const TREBLE_20_DART_LIMITS: Record<Treble20OnlyGameId, Treble20DartLimit> = {
  "treble-20-only-30": 30,
  "treble-20-only-60": 60,
  "treble-20-only-90": 90,
};

export function isTreble20OnlyBaseGame(gameId: PracticeGameId | null): boolean {
  return gameId === "treble-20-only";
}

export function isTreble20OnlySessionGame(
  gameId: PracticeGameId | null,
): gameId is Treble20OnlyGameId {
  return (
    gameId === "treble-20-only-30" ||
    gameId === "treble-20-only-60" ||
    gameId === "treble-20-only-90"
  );
}

export function isTreble20OnlyPickerActive(gameId: PracticeGameId | null): boolean {
  return isTreble20OnlyBaseGame(gameId) || isTreble20OnlySessionGame(gameId);
}

export function getTreble20DartLimit(gameId: Treble20OnlyGameId): Treble20DartLimit {
  return TREBLE_20_DART_LIMITS[gameId];
}

export function createTreble20DartInput(kind: Treble20DartInputKind): DartHit {
  switch (kind) {
    case "t20":
      return { segment: 20, multiplier: "triple", score: 60, label: "T20" };
    case "s20":
      return { segment: 20, multiplier: "single", score: 20, label: "S20" };
    case "d20":
      return { segment: 20, multiplier: "double", score: 40, label: "D20" };
    case "miss":
      return { segment: "miss", multiplier: "miss", score: 0, label: "Miss" };
  }
}

export function classifyTreble20Dart(hit: DartHit): Treble20DartKind {
  if (hit.segment === 20 && hit.multiplier === "triple") {
    return "t20";
  }

  if (hit.segment === 20 && hit.multiplier === "single") {
    return "s20";
  }

  if (hit.segment === 20 && hit.multiplier === "double") {
    return "d20";
  }

  return "miss";
}

export function computeTreble20Stats(darts: DartHit[]): Treble20OnlyStats {
  let t20Hits = 0;
  let s20Hits = 0;
  let d20Hits = 0;
  let misses = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let totalScore = 0;

  for (const dart of darts) {
    const kind = classifyTreble20Dart(dart);

    if (kind === "t20") {
      t20Hits += 1;
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      if (kind === "s20") {
        s20Hits += 1;
      } else if (kind === "d20") {
        d20Hits += 1;
      } else {
        misses += 1;
      }

      currentStreak = 0;
    }

    totalScore += dart.score;
  }

  return {
    t20Hits,
    s20Hits,
    d20Hits,
    misses,
    currentStreak,
    bestStreak,
    totalScore,
    dartsThrown: darts.length,
  };
}

export function getTreble20HitPercentage(stats: Treble20OnlyStats): number {
  if (stats.dartsThrown === 0) {
    return 0;
  }

  return (stats.t20Hits / stats.dartsThrown) * 100;
}

export function getTreble20AverageScorePerDart(stats: Treble20OnlyStats): number {
  if (stats.dartsThrown === 0) {
    return 0;
  }

  return stats.totalScore / stats.dartsThrown;
}

export function formatTreble20Percentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatTreble20Average(value: number): string {
  return value.toFixed(1);
}
