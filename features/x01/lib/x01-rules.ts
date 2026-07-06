import type { DartHit } from "@/types/dart";
import type { X01InRule, X01OutRule } from "@/types/x01";

export const X01_IN_RULE_OPTIONS: Array<{
  value: X01InRule;
  label: string;
  description: string;
}> = [
  {
    value: "straight_in",
    label: "Straight in",
    description: "Any dart starts scoring immediately.",
  },
  {
    value: "double_in",
    label: "Double in",
    description: "Must hit a double before any score counts.",
  },
];

export const X01_OUT_RULE_OPTIONS: Array<{
  value: X01OutRule;
  label: string;
  description: string;
}> = [
  {
    value: "straight_out",
    label: "Straight out",
    description: "Finish on any dart that reaches exactly zero.",
  },
  {
    value: "double_out",
    label: "Double out",
    description: "Must finish on a double or double bull.",
  },
];

export function isPlayerScoredIn(inRule: X01InRule, scoredIn: boolean | undefined) {
  return inRule === "straight_in" || scoredIn === true;
}

export function isQualifyingInHit(hit: DartHit, inRule: X01InRule): boolean {
  if (inRule === "straight_in" || hit.segment === "miss") {
    return inRule === "straight_in";
  }

  if (hit.segment === "bull") {
    return hit.multiplier === "double";
  }

  return hit.multiplier === "double";
}

export function isValidCheckoutHit(hit: DartHit, outRule: X01OutRule): boolean {
  if (hit.segment === "miss" || hit.score <= 0) {
    return false;
  }

  if (outRule === "straight_out") {
    return true;
  }

  if (hit.segment === "bull") {
    return hit.multiplier === "double";
  }

  return hit.multiplier === "double";
}

export function getEffectiveDartScore(
  hit: DartHit,
  inRule: X01InRule,
  scoredIn: boolean | undefined,
): { effectiveScore: number; scoredInAfter: boolean } {
  if (isPlayerScoredIn(inRule, scoredIn)) {
    return { effectiveScore: hit.score, scoredInAfter: true };
  }

  if (isQualifyingInHit(hit, inRule)) {
    return { effectiveScore: hit.score, scoredInAfter: true };
  }

  return { effectiveScore: 0, scoredInAfter: false };
}
