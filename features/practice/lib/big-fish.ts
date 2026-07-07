import { getPreferredCheckoutPath, hasCheckoutPath } from "@/features/x01/lib/x01-checkout";
import { isValidCheckoutHit } from "@/features/x01/lib/x01-rules";
import type { PracticeTargetHighlight } from "@/features/practice/lib/practice-target-segments";
import type { DartHit } from "@/types/dart";
import type { PracticeGameId } from "@/types/practice";

export const BIG_FISH_GAME_ID = "big-fish" as const;
export const BIG_FISH_MIN_CHECKOUT = 100;
export const BIG_FISH_MAX_CHECKOUT = 170;

export type BigFishRoundCount = 10 | 20;

export type BigFishSessionGameId = "big-fish-10" | "big-fish-20" | "big-fish-ladder";

export type BigFishVisitOutcome = "playing" | "checkout" | "bust" | "missed";

export interface BigFishSequenceDart {
  label: string;
  score: number;
}

export interface BigFishSequence {
  darts: [BigFishSequenceDart, BigFishSequenceDart, BigFishSequenceDart];
  label: string;
}

export const BIG_FISH_DARTS_PER_VISIT = 3;

/** Fixed rungs for Big Fish Ladder — finish each in order to advance. */
export const BIG_FISH_LADDER_RUNGS = [100, 110, 120, 130, 140, 150, 160, 170] as const;

export type BigFishLadderRung = (typeof BIG_FISH_LADDER_RUNGS)[number];

/** Classic high finishes commonly called "big fish" targets. */
export const BIG_FISH_CLASSIC_CHECKOUTS = [
  170, 167, 164, 161, 160, 150, 140, 120,
] as const;

const BIG_FISH_ROUND_COUNTS: Record<"big-fish-10" | "big-fish-20", BigFishRoundCount> = {
  "big-fish-10": 10,
  "big-fish-20": 20,
};

function buildBigFishCheckoutPool(): number[] {
  const pool: number[] = [];

  for (let score = BIG_FISH_MIN_CHECKOUT; score <= BIG_FISH_MAX_CHECKOUT; score += 1) {
    if (hasCheckoutPath(score, "double_out", 3)) {
      pool.push(score);
    }
  }

  return pool;
}

const BIG_FISH_CHECKOUT_POOL = buildBigFishCheckoutPool();

export function isBigFishBaseGame(gameId: PracticeGameId | null): boolean {
  return gameId === BIG_FISH_GAME_ID;
}

export function isBigFishSessionGame(
  gameId: PracticeGameId | null,
): gameId is BigFishSessionGameId {
  return (
    gameId === "big-fish-10" ||
    gameId === "big-fish-20" ||
    gameId === "big-fish-ladder"
  );
}

export function isBigFishRandomSessionGame(
  gameId: PracticeGameId | null,
): gameId is "big-fish-10" | "big-fish-20" {
  return gameId === "big-fish-10" || gameId === "big-fish-20";
}

export function isBigFishLadderGame(
  gameId: PracticeGameId | null,
): gameId is "big-fish-ladder" {
  return gameId === "big-fish-ladder";
}

export function getBigFishLadderRungCount(): number {
  return BIG_FISH_LADDER_RUNGS.length;
}

export function getBigFishLadderRung(rungIndex: number): BigFishLadderRung {
  return BIG_FISH_LADDER_RUNGS[Math.min(Math.max(rungIndex, 0), BIG_FISH_LADDER_RUNGS.length - 1)]!;
}

export function getBigFishLadderStartingCheckout(): BigFishLadderRung {
  return BIG_FISH_LADDER_RUNGS[0]!;
}

export function isBigFishPickerActive(gameId: PracticeGameId | null): boolean {
  return isBigFishBaseGame(gameId) || isBigFishSessionGame(gameId);
}

export function getBigFishRoundCount(
  gameId: "big-fish-10" | "big-fish-20",
): BigFishRoundCount {
  return BIG_FISH_ROUND_COUNTS[gameId];
}

export function pickRandomBigFishCheckout(exclude?: number | null): number {
  const pool =
    exclude != null && BIG_FISH_CHECKOUT_POOL.length > 1
      ? BIG_FISH_CHECKOUT_POOL.filter((score) => score !== exclude)
      : BIG_FISH_CHECKOUT_POOL;

  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function getBigFishRemaining(checkoutTarget: number, visitDarts: DartHit[]): number {
  const scored = visitDarts.reduce((sum, dart) => sum + dart.score, 0);
  return checkoutTarget - scored;
}

export function evaluateBigFishDart(
  checkoutTarget: number,
  visitDarts: DartHit[],
  newDart: DartHit,
): { outcome: BigFishVisitOutcome; visitDarts: DartHit[] } {
  const remainingBefore = getBigFishRemaining(checkoutTarget, visitDarts);
  const remainingAfter = remainingBefore - newDart.score;
  const nextVisit = [...visitDarts, newDart];

  if (remainingAfter < 0 || remainingAfter === 1) {
    return { outcome: "bust", visitDarts: nextVisit };
  }

  if (remainingAfter === 0) {
    return {
      outcome: isValidCheckoutHit(newDart, "double_out") ? "checkout" : "bust",
      visitDarts: nextVisit,
    };
  }

  if (nextVisit.length >= 3) {
    return { outcome: "missed", visitDarts: nextVisit };
  }

  return { outcome: "playing", visitDarts: nextVisit };
}

export function isClassicBigFishCheckout(checkout: number): boolean {
  return (BIG_FISH_CLASSIC_CHECKOUTS as readonly number[]).includes(checkout);
}

function checkoutLabelToDart(label: string): BigFishSequenceDart {
  if (label === "25") {
    return { label, score: 25 };
  }

  if (label === "50") {
    return { label, score: 50 };
  }

  const match = label.match(/^([SDT])(\d+)$/);

  if (!match) {
    throw new Error(`Unknown checkout dart label: ${label}`);
  }

  const kind = match[1];
  const segment = Number(match[2]);
  const score = kind === "S" ? segment : kind === "D" ? segment * 2 : segment * 3;

  return { label, score };
}

export function buildBigFishSequence(
  checkoutTarget: number,
  visitDarts: DartHit[],
): BigFishSequence | "no-checkout" {
  const dartsRemaining = BIG_FISH_DARTS_PER_VISIT - visitDarts.length;
  const scoreRemaining = getBigFishRemaining(checkoutTarget, visitDarts);

  if (
    dartsRemaining <= 0 ||
    scoreRemaining <= 0 ||
    scoreRemaining === 1 ||
    !hasCheckoutPath(scoreRemaining, "double_out", dartsRemaining)
  ) {
    return "no-checkout";
  }

  const path = getPreferredCheckoutPath(scoreRemaining, dartsRemaining, "double_out");

  if (!path || path.length !== dartsRemaining) {
    return "no-checkout";
  }

  const fullDarts = [
    ...visitDarts.map((dart) => ({ label: dart.label, score: dart.score })),
    ...path.map(checkoutLabelToDart),
  ] as [BigFishSequenceDart, BigFishSequenceDart, BigFishSequenceDart];

  return {
    darts: fullDarts,
    label: fullDarts.map((dart) => dart.label).join(" · "),
  };
}

export function isBigFishSequenceDartMatch(
  thrown: DartHit,
  expected: BigFishSequenceDart,
): boolean {
  return thrown.label === expected.label;
}

export function bigFishSequenceDartToPracticeTarget(
  dart: BigFishSequenceDart,
): PracticeTargetHighlight {
  if (dart.label === "25") {
    return { segment: "bull", multiplier: "single" };
  }

  if (dart.label === "50") {
    return { segment: "bull", multiplier: "double" };
  }

  const match = dart.label.match(/^([SDT])(\d+)$/);

  if (!match) {
    throw new Error(`Unknown big fish dart label: ${dart.label}`);
  }

  const kind = match[1];
  const segment = Number(match[2]);

  return {
    segment,
    multiplier: kind === "S" ? "single" : kind === "D" ? "double" : "triple",
  };
}

export function getBigFishNextPracticeTarget(
  checkoutTarget: number,
  visitDarts: DartHit[],
  visitEnded: boolean,
): PracticeTargetHighlight | null {
  if (visitEnded || visitDarts.length >= BIG_FISH_DARTS_PER_VISIT) {
    return null;
  }

  const sequence = buildBigFishSequence(checkoutTarget, visitDarts);

  if (sequence === "no-checkout") {
    return null;
  }

  const nextDart = sequence.darts[visitDarts.length];

  if (!nextDart) {
    return null;
  }

  return bigFishSequenceDartToPracticeTarget(nextDart);
}
