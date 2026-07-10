import type { PracticeTargetHighlight } from "@/features/practice/lib/practice-target-segments";
import type { DartHit } from "@/types/dart";
import { chooseX01AimLabel } from "@/features/x01/lib/x01-aim";
import type { X01GameState } from "@/types/x01";

export function aimLabelToPracticeTarget(label: string): PracticeTargetHighlight | null {
  if (label === "50") {
    return { segment: "bull", multiplier: "double" };
  }

  if (label === "25") {
    return { segment: "bull", multiplier: "single" };
  }

  if (label.startsWith("T")) {
    return { segment: Number(label.slice(1)), multiplier: "triple" };
  }

  if (label.startsWith("D")) {
    return { segment: Number(label.slice(1)), multiplier: "double" };
  }

  if (label.startsWith("S")) {
    return { segment: Number(label.slice(1)), multiplier: "single" };
  }

  return null;
}

export function dartHitToPracticeTarget(hit: DartHit): PracticeTargetHighlight | null {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return null;
  }

  if (hit.segment === "bull") {
    return {
      segment: "bull",
      multiplier: hit.multiplier === "double" ? "double" : "single",
    };
  }

  if (
    hit.multiplier === "single" ||
    hit.multiplier === "double" ||
    hit.multiplier === "triple"
  ) {
    return { segment: hit.segment, multiplier: hit.multiplier };
  }

  return null;
}

export function getX01DartboardHighlightFromHit(hit: DartHit): {
  practiceTarget?: PracticeTargetHighlight;
} {
  const practiceTarget = dartHitToPracticeTarget(hit);

  if (!practiceTarget) {
    return {};
  }

  return { practiceTarget };
}

export function getX01DartboardHighlightFromAimLabel(aimLabel: string): {
  practiceTarget?: PracticeTargetHighlight;
} {
  const practiceTarget = aimLabelToPracticeTarget(aimLabel);

  if (!practiceTarget) {
    return {};
  }

  return { practiceTarget };
}

export function getX01DartboardHighlight(game: X01GameState | null): {
  practiceTarget?: PracticeTargetHighlight;
} {
  if (!game || game.status !== "playing") {
    return {};
  }

  return getX01DartboardHighlightFromAimLabel(chooseX01AimLabel(game));
}
