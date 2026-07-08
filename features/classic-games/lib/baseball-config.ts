import type {
  BaseballGameLengthPreset,
  BaseballInningTarget,
  BaseballScoringMode,
  BaseballTargetSequenceId,
  BaseballTieBreaker,
} from "@/types/baseball";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const BASEBALL_DEFAULT_STARTING_RUNS = 0;
export const BASEBALL_STANDARD_INNINGS = 9;
export const BASEBALL_SHORT_INNINGS = 6;
export const BASEBALL_MIN_CUSTOM_INNINGS = 3;
export const BASEBALL_MAX_CUSTOM_INNINGS = 9;
export const BASEBALL_MAX_RUNS_PER_INNING = 9;

export const BASEBALL_GAME_LENGTH_OPTIONS: PillToggleOption<BaseballGameLengthPreset>[] = [
  { value: "standard", label: "9 innings" },
  { value: "short", label: "6 innings" },
  { value: "custom", label: "Custom" },
];

export const BASEBALL_TARGET_SEQUENCE_OPTIONS: PillToggleOption<BaseballTargetSequenceId>[] = [
  { value: "1-9", label: "1–9" },
  { value: "11-19", label: "11–19" },
  { value: "custom", label: "Custom" },
];

export const BASEBALL_SCORING_OPTIONS: PillToggleOption<BaseballScoringMode>[] = [
  { value: "baseball", label: "Baseball (1/2/3)" },
  { value: "standard", label: "Standard points" },
];

export const BASEBALL_TIE_BREAKER_OPTIONS: PillToggleOption<BaseballTieBreaker>[] = [
  { value: "extra_inning", label: "Extra inning" },
  { value: "bull_shootout", label: "Bull shootout" },
];

export function resolveBaseballInningCount(
  preset: BaseballGameLengthPreset,
  customInningCount: number,
): number {
  switch (preset) {
    case "standard":
      return BASEBALL_STANDARD_INNINGS;
    case "short":
      return BASEBALL_SHORT_INNINGS;
    case "custom":
      return Math.min(
        BASEBALL_MAX_CUSTOM_INNINGS,
        Math.max(BASEBALL_MIN_CUSTOM_INNINGS, customInningCount),
      );
  }
}

function inningTarget(segment: number | "bull", inningNumber: number): BaseballInningTarget {
  const label = segment === "bull" ? "Bull" : String(segment);
  return {
    segment,
    label,
    displayLabel: label,
    inningNumber,
  };
}

export function buildBaseballTargetSequence(
  sequenceId: BaseballTargetSequenceId,
  inningCount: number,
): BaseballInningTarget[] {
  const targets: BaseballInningTarget[] = [];

  for (let index = 0; index < inningCount; index += 1) {
    const inningNumber = index + 1;
    let segment: number;

    if (sequenceId === "11-19") {
      segment = 11 + index;
    } else {
      segment = index + 1;
    }

    targets.push(inningTarget(segment, inningNumber));
  }

  return targets;
}

export function buildExtraBaseballInningTarget(
  sequenceId: BaseballTargetSequenceId,
  inningNumber: number,
  extraInningCount: number,
): BaseballInningTarget {
  if (sequenceId === "11-19") {
    const segment = Math.min(20, 11 + inningNumber + extraInningCount - 1);
    return inningTarget(segment, inningNumber);
  }

  const segment = Math.min(20, inningNumber + extraInningCount);
  return inningTarget(segment, inningNumber);
}

export function buildBullShootoutTarget(shootoutRound: number): BaseballInningTarget {
  return {
    segment: "bull",
    label: "Bull",
    displayLabel: shootoutRound > 1 ? `Bull (${shootoutRound})` : "Bull",
    inningNumber: shootoutRound,
  };
}
