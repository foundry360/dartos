import { isValidCheckoutHit } from "@/features/x01/lib/x01-rules";
import type { DartHit } from "@/types/dart";
import type { PracticeCheckoutOutRule } from "@/types/practice";

export function isValidPracticeCheckoutHit(
  hit: DartHit,
  outRule: PracticeCheckoutOutRule,
): boolean {
  if (outRule === "double_out") {
    return isValidCheckoutHit(hit, "double_out");
  }

  if (hit.segment === "miss" || hit.score <= 0) {
    return false;
  }

  if (hit.segment === "bull") {
    return true;
  }

  return hit.multiplier === "double";
}

export function getPracticeCheckoutOutRuleLabel(outRule: PracticeCheckoutOutRule): string {
  return outRule === "double_out" ? "Double out" : "Master out";
}
