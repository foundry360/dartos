import type { DartHit } from "@/types/dart";
import type { PracticeGameId } from "@/types/practice";

export type RandomTargetGameId = "random-singles" | "random-doubles" | "random-trebles";

export interface PracticeRandomTarget {
  segment: number;
  multiplier: "single" | "double" | "triple";
  label: string;
  displayLabel: string;
}

const BOARD_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
] as const;

export function isRandomTargetGame(gameId: PracticeGameId | null): gameId is RandomTargetGameId {
  return (
    gameId === "random-singles" ||
    gameId === "random-doubles" ||
    gameId === "random-trebles"
  );
}

function multiplierForGame(gameId: RandomTargetGameId): PracticeRandomTarget["multiplier"] {
  switch (gameId) {
    case "random-singles":
      return "single";
    case "random-doubles":
      return "double";
    case "random-trebles":
      return "triple";
  }
}

function formatTargetLabel(
  segment: number,
  multiplier: PracticeRandomTarget["multiplier"],
): Pick<PracticeRandomTarget, "label" | "displayLabel"> {
  const prefix = multiplier === "single" ? "S" : multiplier === "double" ? "D" : "T";

  return {
    label: `${prefix}${segment}`,
    displayLabel:
      multiplier === "single"
        ? `Single ${segment}`
        : multiplier === "double"
          ? `Double ${segment}`
          : `Treble ${segment}`,
  };
}

export function pickRandomTarget(
  gameId: RandomTargetGameId,
  exclude?: PracticeRandomTarget | null,
): PracticeRandomTarget {
  const multiplier = multiplierForGame(gameId);
  let segment = BOARD_NUMBERS[Math.floor(Math.random() * BOARD_NUMBERS.length)]!;

  if (exclude && BOARD_NUMBERS.length > 1) {
    let attempts = 0;

    while (exclude.segment === segment && exclude.multiplier === multiplier && attempts < 8) {
      segment = BOARD_NUMBERS[Math.floor(Math.random() * BOARD_NUMBERS.length)]!;
      attempts += 1;
    }
  }

  return {
    segment,
    multiplier,
    ...formatTargetLabel(segment, multiplier),
  };
}

export function doesHitMatchTarget(hit: DartHit, target: PracticeRandomTarget): boolean {
  return hit.segment === target.segment && hit.multiplier === target.multiplier;
}
