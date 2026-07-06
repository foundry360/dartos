import type { PracticeGameId } from "@/types/practice";
import { pickRandomTarget, type PracticeRandomTarget } from "@/features/practice/lib/random-targets";

export const THREE_IN_A_ROW_REQUIRED = 3;

export type ThreeInARowGameId =
  | "consecutive-singles"
  | "consecutive-doubles"
  | "consecutive-trebles";

export function isThreeInARowGame(gameId: PracticeGameId | null): gameId is ThreeInARowGameId {
  return (
    gameId === "consecutive-singles" ||
    gameId === "consecutive-doubles" ||
    gameId === "consecutive-trebles"
  );
}

function randomTargetGameForThreeInARow(
  gameId: ThreeInARowGameId,
): "random-singles" | "random-doubles" | "random-trebles" {
  switch (gameId) {
    case "consecutive-singles":
      return "random-singles";
    case "consecutive-doubles":
      return "random-doubles";
    case "consecutive-trebles":
      return "random-trebles";
  }
}

export function pickThreeInARowTarget(
  gameId: ThreeInARowGameId,
  exclude?: PracticeRandomTarget | null,
): PracticeRandomTarget {
  return pickRandomTarget(randomTargetGameForThreeInARow(gameId), exclude);
}
