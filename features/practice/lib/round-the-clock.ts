import type { DartHit } from "@/types/dart";
import type { PracticeGameId, PracticeSetupRoutine, PracticeTargetCategory } from "@/types/practice";

export type RoundTheClockMode = Extract<PracticeTargetCategory, "singles" | "doubles" | "trebles">;

export interface RoundTheClockTarget {
  segment: DartHit["segment"];
  multiplier: Exclude<DartHit["multiplier"], "miss">;
  label: string;
  displayLabel: string;
}

export function isRoundTheClockGame(gameId: PracticeGameId | null): boolean {
  return gameId === "round-the-clock";
}

export function isSequentialTargetGame(gameId: PracticeGameId | null): boolean {
  return isRoundTheClockGame(gameId);
}

export function getSequentialTargetMode(
  setupRoutine: PracticeSetupRoutine,
  gameId: PracticeGameId,
): RoundTheClockMode | null {
  if (gameId === "round-the-clock") {
    return getRoundTheClockMode(setupRoutine);
  }

  return null;
}

export type PracticeTargetDisplay = RoundTheClockTarget;

export function getRoundTheClockMode(
  setupRoutine: PracticeSetupRoutine,
): RoundTheClockMode | null {
  if (setupRoutine.category !== "target") {
    return null;
  }

  const { targetCategory } = setupRoutine;

  if (
    targetCategory === "singles" ||
    targetCategory === "doubles" ||
    targetCategory === "trebles"
  ) {
    return targetCategory;
  }

  return null;
}

function createNumberTarget(number: number, mode: RoundTheClockMode): RoundTheClockTarget {
  const multiplier =
    mode === "singles" ? "single" : mode === "doubles" ? "double" : "triple";
  const prefix = mode === "singles" ? "S" : mode === "doubles" ? "D" : "T";

  return {
    segment: number,
    multiplier,
    label: `${prefix}${number}`,
    displayLabel:
      mode === "singles"
        ? `Single ${number}`
        : mode === "doubles"
          ? `Double ${number}`
          : `Treble ${number}`,
  };
}

export function buildRoundTheClockSequence(mode: RoundTheClockMode): RoundTheClockTarget[] {
  const sequence = Array.from({ length: 20 }, (_, index) =>
    createNumberTarget(index + 1, mode),
  );

  if (mode === "singles") {
    sequence.push({
      segment: "bull",
      multiplier: "single",
      label: "25",
      displayLabel: "Bull",
    });
  } else if (mode === "doubles") {
    sequence.push({
      segment: "bull",
      multiplier: "double",
      label: "50",
      displayLabel: "Bull",
    });
  }

  return sequence;
}

export function doesHitMatchRoundTheClockTarget(
  hit: DartHit,
  target: RoundTheClockTarget,
): boolean {
  return hit.segment === target.segment && hit.multiplier === target.multiplier;
}
