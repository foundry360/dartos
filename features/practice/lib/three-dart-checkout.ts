import { isExactThreeDartCheckout } from "@/features/x01/lib/x01-checkout";
import {
  buildRandomCheckoutSequence,
  evaluateRandomCheckoutDart,
  getRandomCheckoutNextPracticeTarget,
  isRandomCheckoutSequenceDartMatch,
  RANDOM_CHECKOUT_DARTS_PER_VISIT,
  type RandomCheckoutSequenceDart,
  type RandomCheckoutVisitOutcome,
} from "@/features/practice/lib/random-checkout";
import type { DartHit } from "@/types/dart";
import type {
  PracticeGameId,
  ThreeDartCheckoutAttemptCount,
  ThreeDartCheckoutSessionGameId,
} from "@/types/practice";

export const THREE_DART_CHECKOUT_GAME_ID = "three-dart-checkout-challenge" as const;

export const THREE_DART_CHECKOUT_OUT_RULE = "double_out" as const;

export type ThreeDartCheckoutVisitOutcome = RandomCheckoutVisitOutcome;

export const THREE_DART_CHECKOUT_ATTEMPT_OPTIONS: ThreeDartCheckoutAttemptCount[] = [10, 20, 50];

const THREE_DART_CHECKOUT_ATTEMPT_COUNTS: Record<
  ThreeDartCheckoutSessionGameId,
  ThreeDartCheckoutAttemptCount
> = {
  "three-dart-checkout-10": 10,
  "three-dart-checkout-20": 20,
  "three-dart-checkout-50": 50,
};

const THREE_DART_ONLY_CHECKOUT_POOL = buildThreeDartOnlyCheckoutPool();

function buildThreeDartOnlyCheckoutPool(): number[] {
  const pool: number[] = [];

  for (let score = 2; score <= 170; score += 1) {
    if (isExactThreeDartCheckout(score, THREE_DART_CHECKOUT_OUT_RULE)) {
      pool.push(score);
    }
  }

  return pool;
}

export function isThreeDartCheckoutBaseGame(gameId: PracticeGameId | null): boolean {
  return gameId === THREE_DART_CHECKOUT_GAME_ID;
}

export function isThreeDartCheckoutSessionGame(
  gameId: PracticeGameId | null,
): gameId is ThreeDartCheckoutSessionGameId {
  return (
    gameId === "three-dart-checkout-10" ||
    gameId === "three-dart-checkout-20" ||
    gameId === "three-dart-checkout-50"
  );
}

export function getThreeDartCheckoutAttemptCount(
  gameId: ThreeDartCheckoutSessionGameId,
): ThreeDartCheckoutAttemptCount {
  return THREE_DART_CHECKOUT_ATTEMPT_COUNTS[gameId];
}

export function pickRandomThreeDartCheckoutTarget(exclude?: number | null): number {
  const pool = THREE_DART_ONLY_CHECKOUT_POOL;

  if (pool.length === 0) {
    return 170;
  }

  const candidates =
    exclude != null && pool.length > 1 ? pool.filter((score) => score !== exclude) : pool;

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export function getThreeDartCheckoutRemaining(
  checkoutTarget: number,
  visitDarts: DartHit[],
): number {
  const scored = visitDarts.reduce((sum, dart) => sum + dart.score, 0);
  return checkoutTarget - scored;
}

export function buildThreeDartCheckoutSequence(
  checkoutTarget: number,
  visitDarts: DartHit[],
) {
  return buildRandomCheckoutSequence(
    checkoutTarget,
    visitDarts,
    THREE_DART_CHECKOUT_OUT_RULE,
  );
}

export function isThreeDartCheckoutSequenceDartMatch(
  thrown: DartHit,
  expected: RandomCheckoutSequenceDart,
): boolean {
  return isRandomCheckoutSequenceDartMatch(thrown, expected);
}

export function getThreeDartCheckoutNextPracticeTarget(
  checkoutTarget: number,
  visitDarts: DartHit[],
  visitEnded: boolean,
) {
  return getRandomCheckoutNextPracticeTarget(
    checkoutTarget,
    visitDarts,
    THREE_DART_CHECKOUT_OUT_RULE,
    visitEnded,
  );
}

export function evaluateThreeDartCheckoutDart(
  checkoutTarget: number,
  visitDarts: DartHit[],
  newDart: DartHit,
) {
  return evaluateRandomCheckoutDart(
    checkoutTarget,
    visitDarts,
    newDart,
    THREE_DART_CHECKOUT_OUT_RULE,
  );
}

export { RANDOM_CHECKOUT_DARTS_PER_VISIT as THREE_DART_CHECKOUT_DARTS_PER_VISIT };
