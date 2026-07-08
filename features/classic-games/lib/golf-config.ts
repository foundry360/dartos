import type {
  GolfGameLengthPreset,
  GolfHoleTarget,
  GolfScoringMode,
  GolfTargetSequenceId,
  GolfTieBreaker,
} from "@/types/golf";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const GOLF_DEFAULT_STARTING_STROKES = 0;
export const GOLF_SHORT_HOLES = 9;
export const GOLF_STANDARD_HOLES = 18;
export const GOLF_MISSED_HOLE_PENALTY = 4;

export const GOLF_GAME_LENGTH_OPTIONS: PillToggleOption<GolfGameLengthPreset>[] = [
  { value: "short", label: "9 holes" },
  { value: "standard", label: "18 holes" },
];

export const GOLF_TARGET_SEQUENCE_OPTIONS: PillToggleOption<GolfTargetSequenceId>[] = [
  { value: "1-18", label: "1–18" },
  { value: "random", label: "Random" },
  { value: "custom", label: "Custom" },
];

export const GOLF_SCORING_OPTIONS: PillToggleOption<GolfScoringMode>[] = [
  { value: "strokes", label: "Strokes" },
  { value: "golf_scoring", label: "Birdie/Eagle" },
];

export const GOLF_TIE_BREAKER_OPTIONS: PillToggleOption<GolfTieBreaker>[] = [
  { value: "sudden_death", label: "Sudden death" },
  { value: "closest_to_bull", label: "Closest to Bull" },
];

export function resolveGolfHoleCount(preset: GolfGameLengthPreset): number {
  return preset === "standard" ? GOLF_STANDARD_HOLES : GOLF_SHORT_HOLES;
}

function holeTarget(segment: number | "bull", holeNumber: number): GolfHoleTarget {
  const label = segment === "bull" ? "Bull" : String(segment);
  return {
    segment,
    label,
    displayLabel: label,
    holeNumber,
  };
}

function shuffleSegments(segments: number[]): number[] {
  const copy = [...segments];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]!] = [copy[swapIndex]!, copy[index]!];
  }

  return copy;
}

export function buildGolfHoleSequence(
  sequenceId: GolfTargetSequenceId,
  holeCount: number,
): GolfHoleTarget[] {
  let segments: number[];

  if (sequenceId === "random") {
    segments = shuffleSegments(Array.from({ length: 18 }, (_, index) => index + 1)).slice(
      0,
      holeCount,
    );
  } else {
    segments = Array.from({ length: holeCount }, (_, index) => index + 1);
  }

  return segments.map((segment, index) => holeTarget(segment, index + 1));
}

export function buildSuddenDeathHole(
  round: number,
  sequenceId: GolfTargetSequenceId,
  regulationHoleCount: number,
): GolfHoleTarget {
  if (sequenceId === "random") {
    const segment = Math.floor(Math.random() * 18) + 1;
    return holeTarget(segment, regulationHoleCount + round);
  }

  const segment = Math.min(20, regulationHoleCount + round);
  return holeTarget(segment, regulationHoleCount + round);
}

export function buildBullTiebreakHole(round: number): GolfHoleTarget {
  return {
    segment: "bull",
    label: "Bull",
    displayLabel: round > 1 ? `Bull (${round})` : "Bull",
    holeNumber: round,
  };
}

export function formatGolfHoleResultLabel(
  holeStrokes: number,
  scoringMode: GolfScoringMode,
): string {
  if (scoringMode === "strokes") {
    return holeStrokes >= GOLF_MISSED_HOLE_PENALTY ? "Penalty" : `${holeStrokes} stroke${holeStrokes === 1 ? "" : "s"}`;
  }

  switch (holeStrokes) {
    case -2:
      return "Eagle";
    case -1:
      return "Birdie";
    case 0:
      return "Par";
    case 1:
      return "Bogey";
    default:
      return String(holeStrokes);
  }
}
