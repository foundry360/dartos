import type { DartHit } from "@/types/dart";

export const MISS_DART_HIT: DartHit = {
  segment: "miss",
  multiplier: "miss",
  score: 0,
  label: "Miss",
};

export function dartHitFromLabel(label: string): DartHit {
  if (label === "50") {
    return { segment: "bull", multiplier: "double", score: 50, label: "50" };
  }

  if (label === "25") {
    return { segment: "bull", multiplier: "single", score: 25, label: "25" };
  }

  if (label.startsWith("T")) {
    const segment = Number(label.slice(1));
    return {
      segment,
      multiplier: "triple",
      score: segment * 3,
      label,
    };
  }

  if (label.startsWith("D")) {
    const segment = Number(label.slice(1));
    return {
      segment,
      multiplier: "double",
      score: segment * 2,
      label,
    };
  }

  if (label.startsWith("S")) {
    const segment = Number(label.slice(1));
    return {
      segment,
      multiplier: "single",
      score: segment,
      label,
    };
  }

  throw new Error(`Unknown dart label: ${label}`);
}

export function parseSegmentFromLabel(label: string): number | "bull" | null {
  if (label === "50" || label === "25") {
    return "bull";
  }

  if (label.startsWith("T") || label.startsWith("D") || label.startsWith("S")) {
    return Number(label.slice(1));
  }

  return null;
}
