import type { DartHit } from "@/types/dart";
import type { PracticeGameId } from "@/types/practice";

export const BULL_CHALLENGE_TARGET = 25;
export const BULL_CHALLENGE_GAME_ID = "25-bull-challenge" as const;

export interface BullChallengeStats {
  bullsHit: number;
  outerBulls: number;
  innerBulls: number;
  misses: number;
  dartsThrown: number;
}

export type BullChallengeDartInputKind = "miss" | "outer" | "inner";

export function isBullChallengeGame(gameId: PracticeGameId | null): gameId is typeof BULL_CHALLENGE_GAME_ID {
  return gameId === BULL_CHALLENGE_GAME_ID;
}

export function isBullChallengeHit(hit: DartHit): boolean {
  return hit.segment === "bull";
}

export function computeBullChallengeStats(darts: DartHit[]): BullChallengeStats {
  let outerBulls = 0;
  let innerBulls = 0;
  let misses = 0;

  for (const dart of darts) {
    if (dart.segment === "bull" && dart.multiplier === "double") {
      innerBulls += 1;
      continue;
    }

    if (dart.segment === "bull") {
      outerBulls += 1;
      continue;
    }

    if (dart.segment === "miss") {
      misses += 1;
    }
  }

  return {
    bullsHit: outerBulls + innerBulls,
    outerBulls,
    innerBulls,
    misses,
    dartsThrown: darts.length,
  };
}

export function createBullChallengeDartInput(kind: BullChallengeDartInputKind): DartHit {
  switch (kind) {
    case "outer":
      return { segment: "bull", multiplier: "single", score: 25, label: "25" };
    case "inner":
      return { segment: "bull", multiplier: "double", score: 50, label: "50" };
    case "miss":
      return { segment: "miss", multiplier: "miss", score: 0, label: "Miss" };
  }
}

export function formatBullChallengeElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
