import type { DartHit, DartMultiplier, DartSegment } from "@/types/dart";

export function buildDartHit(
  segment: Exclude<DartSegment, "miss">,
  multiplier: Exclude<DartMultiplier, "miss">,
): DartHit {
  if (segment === "bull") {
    // Outer bull = single 25; inner bull = double 50. No triple bull.
    if (multiplier === "triple" || multiplier === "double") {
      return { segment: "bull", multiplier: "double", score: 50, label: "50" };
    }
    return { segment: "bull", multiplier: "single", score: 25, label: "25" };
  }

  const factor = multiplier === "triple" ? 3 : multiplier === "double" ? 2 : 1;
  const prefix = multiplier === "triple" ? "T" : multiplier === "double" ? "D" : "S";

  return {
    segment,
    multiplier,
    score: segment * factor,
    label: `${prefix}${segment}`,
  };
}

export function buildMissHit(): DartHit {
  return { segment: "miss", multiplier: "miss", score: 0, label: "Miss" };
}
