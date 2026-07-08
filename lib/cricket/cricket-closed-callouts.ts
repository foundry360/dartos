import type { CricketTarget, CricketVariant } from "@/lib/constants";
import { getCricketTargets } from "@/lib/constants";

const SHARED_CLOSED_PHRASES: Record<20 | 19 | 18 | 17 | 16 | 15 | "bull", string> = {
  20: "Twenties closed",
  19: "Nineteens closed",
  18: "Eighteens closed",
  17: "Seventeens closed",
  16: "Sixteens closed",
  15: "Fifteens closed",
  bull: "Bull closed",
};

const TACTICS_LOW_CLOSED_PHRASES: Record<10 | 11 | 12 | 13 | 14, string> = {
  10: "10 closed",
  11: "11 closed",
  12: "12 closed",
  13: "13 closed",
  14: "14 closed",
};

export function isCricketClosedTargetForVariant(
  target: CricketTarget,
  variant: CricketVariant,
): boolean {
  return getCricketTargets(variant).includes(target);
}

export function buildCricketClosedPhrase(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): string {
  if (
    variant === "tactics" &&
    typeof target === "number" &&
    target >= 10 &&
    target <= 14
  ) {
    return TACTICS_LOW_CLOSED_PHRASES[target as 10 | 11 | 12 | 13 | 14];
  }

  return SHARED_CLOSED_PHRASES[target as keyof typeof SHARED_CLOSED_PHRASES];
}

export function buildCricketClosedSlug(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): string {
  if (target === "bull") {
    return "bull-closed";
  }

  if (variant === "tactics" && typeof target === "number" && target >= 10 && target <= 14) {
    return `${target}-closed`;
  }

  return buildCricketClosedPhrase(target, variant).toLowerCase().replace(/\s+/g, "-");
}

export function buildCricketClosedClipPath(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): string {
  return `/sounds/cricket-closed/${buildCricketClosedSlug(target, variant)}.wav`;
}

export function getCricketClosedClipEntries(
  variant: CricketVariant = "classic",
): Array<{ slug: string; phrase: string }> {
  return getCricketTargets(variant).map((target) => ({
    slug: buildCricketClosedSlug(target, variant),
    phrase: buildCricketClosedPhrase(target, variant),
  }));
}
