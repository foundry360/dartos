import {
  getPreferredCheckoutPath,
  hasCheckoutPath,
  type CheckoutFinishRule,
} from "@/features/x01/lib/x01-checkout";
import { isValidPracticeCheckoutHit } from "@/features/practice/lib/practice-checkout-rules";
import type { PracticeTargetHighlight } from "@/features/practice/lib/practice-target-segments";
import type { DartHit } from "@/types/dart";
import type { PracticeGameId } from "@/types/practice";
import type {
  PracticeCheckoutOutRule,
  RandomCheckoutAttemptCount,
  RandomCheckoutRangeId,
  RandomCheckoutSessionConfig,
} from "@/types/practice";

export const RANDOM_CHECKOUT_GAME_ID = "random-checkout" as const;
export const RANDOM_CHECKOUT_DARTS_PER_VISIT = 3;

export type RandomCheckoutVisitOutcome = "playing" | "checkout" | "bust" | "missed";

export interface RandomCheckoutSequenceDart {
  label: string;
  score: number;
}

export interface RandomCheckoutSequence {
  darts: [
    RandomCheckoutSequenceDart,
    RandomCheckoutSequenceDart,
    RandomCheckoutSequenceDart,
  ];
  label: string;
}

export const RANDOM_CHECKOUT_RANGE_OPTIONS: Array<{
  id: RandomCheckoutRangeId;
  label: string;
  min: number;
  max: number;
}> = [
  { id: "2-40", label: "2–40", min: 2, max: 40 },
  { id: "41-80", label: "41–80", min: 41, max: 80 },
  { id: "81-120", label: "81–120", min: 81, max: 120 },
  { id: "121-170", label: "121–170", min: 121, max: 170 },
  { id: "full", label: "Full range", min: 2, max: 170 },
];

export const RANDOM_CHECKOUT_ATTEMPT_OPTIONS: RandomCheckoutAttemptCount[] = [10, 20, 50];

export const RANDOM_CHECKOUT_OUT_RULE_OPTIONS: Array<{
  id: PracticeCheckoutOutRule;
  label: string;
}> = [
  { id: "double_out", label: "Double out" },
  { id: "master_out", label: "Master out" },
];

const CHECKOUT_POOLS = new Map<string, number[]>();

function toCheckoutFinishRule(outRule: PracticeCheckoutOutRule): CheckoutFinishRule {
  return outRule;
}

function getRangeBounds(range: RandomCheckoutRangeId) {
  return RANDOM_CHECKOUT_RANGE_OPTIONS.find((option) => option.id === range)!;
}

function getCheckoutPoolKey(range: RandomCheckoutRangeId, outRule: PracticeCheckoutOutRule) {
  return `${range}:${outRule}`;
}

function buildCheckoutPool(range: RandomCheckoutRangeId, outRule: PracticeCheckoutOutRule): number[] {
  const { min, max } = getRangeBounds(range);
  const finishRule = toCheckoutFinishRule(outRule);
  const pool: number[] = [];

  for (let score = min; score <= max; score += 1) {
    if (hasCheckoutPath(score, finishRule, RANDOM_CHECKOUT_DARTS_PER_VISIT)) {
      pool.push(score);
    }
  }

  return pool;
}

export function getRandomCheckoutPool(
  range: RandomCheckoutRangeId,
  outRule: PracticeCheckoutOutRule,
): number[] {
  const key = getCheckoutPoolKey(range, outRule);
  const cached = CHECKOUT_POOLS.get(key);

  if (cached) {
    return cached;
  }

  const pool = buildCheckoutPool(range, outRule);
  CHECKOUT_POOLS.set(key, pool);
  return pool;
}

export function isRandomCheckoutBaseGame(gameId: PracticeGameId | null): boolean {
  return gameId === RANDOM_CHECKOUT_GAME_ID;
}

export function isRandomCheckoutConfigured(
  gameId: PracticeGameId | null,
  config: RandomCheckoutSessionConfig | null | undefined,
): boolean {
  return isRandomCheckoutBaseGame(gameId) && config != null;
}

export function getRandomCheckoutRangeLabel(range: RandomCheckoutRangeId): string {
  return getRangeBounds(range).label;
}

export function getRandomCheckoutSessionLabel(config: RandomCheckoutSessionConfig): string {
  return `${getRandomCheckoutRangeLabel(config.range)} · ${config.attempts} attempts · ${config.outRule === "double_out" ? "Double out" : "Master out"}`;
}

export function pickRandomCheckoutTarget(
  config: RandomCheckoutSessionConfig,
  exclude?: number | null,
): number {
  const pool = getRandomCheckoutPool(config.range, config.outRule);

  if (pool.length === 0) {
    return getRangeBounds(config.range).max;
  }

  const candidates =
    exclude != null && pool.length > 1 ? pool.filter((score) => score !== exclude) : pool;

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export function getRandomCheckoutRemaining(checkoutTarget: number, visitDarts: DartHit[]): number {
  const scored = visitDarts.reduce((sum, dart) => sum + dart.score, 0);
  return checkoutTarget - scored;
}

function checkoutLabelToDart(label: string): RandomCheckoutSequenceDart {
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

export function buildRandomCheckoutSequence(
  checkoutTarget: number,
  visitDarts: DartHit[],
  outRule: PracticeCheckoutOutRule,
): RandomCheckoutSequence | "no-checkout" {
  const dartsRemaining = RANDOM_CHECKOUT_DARTS_PER_VISIT - visitDarts.length;
  const scoreRemaining = getRandomCheckoutRemaining(checkoutTarget, visitDarts);
  const finishRule = toCheckoutFinishRule(outRule);

  if (
    dartsRemaining <= 0 ||
    scoreRemaining <= 0 ||
    scoreRemaining === 1 ||
    !hasCheckoutPath(scoreRemaining, finishRule, dartsRemaining)
  ) {
    return "no-checkout";
  }

  const path = getPreferredCheckoutPath(scoreRemaining, dartsRemaining, finishRule);

  if (!path || path.length !== dartsRemaining) {
    return "no-checkout";
  }

  const fullDarts = [
    ...visitDarts.map((dart) => ({ label: dart.label, score: dart.score })),
    ...path.map(checkoutLabelToDart),
  ] as [
    RandomCheckoutSequenceDart,
    RandomCheckoutSequenceDart,
    RandomCheckoutSequenceDart,
  ];

  return {
    darts: fullDarts,
    label: fullDarts.map((dart) => dart.label).join(" · "),
  };
}

export function isRandomCheckoutSequenceDartMatch(
  thrown: DartHit,
  expected: RandomCheckoutSequenceDart,
): boolean {
  return thrown.label === expected.label;
}

export function randomCheckoutSequenceDartToPracticeTarget(
  dart: RandomCheckoutSequenceDart,
): PracticeTargetHighlight {
  if (dart.label === "25") {
    return { segment: "bull", multiplier: "single" };
  }

  if (dart.label === "50") {
    return { segment: "bull", multiplier: "double" };
  }

  const match = dart.label.match(/^([SDT])(\d+)$/);

  if (!match) {
    throw new Error(`Unknown random checkout dart label: ${dart.label}`);
  }

  const kind = match[1];
  const segment = Number(match[2]);

  return {
    segment,
    multiplier: kind === "S" ? "single" : kind === "D" ? "double" : "triple",
  };
}

export function getRandomCheckoutNextPracticeTarget(
  checkoutTarget: number,
  visitDarts: DartHit[],
  outRule: PracticeCheckoutOutRule,
  visitEnded: boolean,
): PracticeTargetHighlight | null {
  if (visitEnded || visitDarts.length >= RANDOM_CHECKOUT_DARTS_PER_VISIT) {
    return null;
  }

  const sequence = buildRandomCheckoutSequence(checkoutTarget, visitDarts, outRule);

  if (sequence === "no-checkout") {
    return null;
  }

  const nextDart = sequence.darts[visitDarts.length];

  if (!nextDart) {
    return null;
  }

  return randomCheckoutSequenceDartToPracticeTarget(nextDart);
}

export function evaluateRandomCheckoutDart(
  checkoutTarget: number,
  visitDarts: DartHit[],
  newDart: DartHit,
  outRule: PracticeCheckoutOutRule,
): { outcome: RandomCheckoutVisitOutcome; visitDarts: DartHit[] } {
  const remainingBefore = getRandomCheckoutRemaining(checkoutTarget, visitDarts);
  const remainingAfter = remainingBefore - newDart.score;
  const nextVisit = [...visitDarts, newDart];

  if (remainingAfter < 0 || remainingAfter === 1) {
    return { outcome: "bust", visitDarts: nextVisit };
  }

  if (remainingAfter === 0) {
    return {
      outcome: isValidPracticeCheckoutHit(newDart, outRule) ? "checkout" : "bust",
      visitDarts: nextVisit,
    };
  }

  if (nextVisit.length >= RANDOM_CHECKOUT_DARTS_PER_VISIT) {
    return { outcome: "missed", visitDarts: nextVisit };
  }

  return { outcome: "playing", visitDarts: nextVisit };
}
