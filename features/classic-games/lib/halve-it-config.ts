import type {
  HalveItGameLengthPreset,
  HalveItScoringMode,
  HalveItTarget,
  HalveItTargetSequenceId,
} from "@/types/halve-it";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const HALVE_IT_DEFAULT_STARTING_SCORE = 0;
export const HALVE_IT_MAX_STARTING_SCORE = 1000;
export const HALVE_IT_SHORT_ROUNDS = 7;
export const HALVE_IT_STANDARD_ROUNDS = 10;
export const HALVE_IT_MIN_CUSTOM_ROUNDS = 7;
export const HALVE_IT_MAX_CUSTOM_ROUNDS = 12;

export const HALVE_IT_GAME_LENGTH_OPTIONS: PillToggleOption<HalveItGameLengthPreset>[] = [
  { value: "short", label: "Short (7)" },
  { value: "standard", label: "Standard (10)" },
  { value: "custom", label: "Custom" },
];

export const HALVE_IT_TARGET_SEQUENCE_OPTIONS: PillToggleOption<HalveItTargetSequenceId>[] = [
  { value: "numbers", label: "Numbers" },
  { value: "doubles", label: "Doubles" },
  { value: "triples", label: "Triples" },
  { value: "classic", label: "Classic" },
];

export const HALVE_IT_SCORING_MODE_OPTIONS: PillToggleOption<HalveItScoringMode>[] = [
  { value: "target_only", label: "Target only" },
  { value: "open", label: "Open" },
];

function numberTarget(value: number): HalveItTarget {
  return {
    segment: value,
    label: String(value),
    displayLabel: String(value),
  };
}

function doubleTarget(value: number): HalveItTarget {
  return {
    segment: value,
    multiplier: "double",
    label: `D${value}`,
    displayLabel: `Double ${value}`,
  };
}

function tripleTarget(value: number): HalveItTarget {
  return {
    segment: value,
    multiplier: "triple",
    label: `T${value}`,
    displayLabel: `Treble ${value}`,
  };
}

function bullTarget(): HalveItTarget {
  return {
    segment: "bull",
    label: "Bull",
    displayLabel: "Bull",
  };
}

const BOARD_NUMBERS = [12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

export const HALVE_IT_NUMBERS_SEQUENCE: HalveItTarget[] = [
  ...BOARD_NUMBERS.map(numberTarget),
  bullTarget(),
];

export const HALVE_IT_DOUBLES_SEQUENCE: HalveItTarget[] = [
  ...BOARD_NUMBERS.map(doubleTarget),
  bullTarget(),
];

export const HALVE_IT_TRIPLES_SEQUENCE: HalveItTarget[] = BOARD_NUMBERS.map(tripleTarget);

export const HALVE_IT_CLASSIC_SEQUENCE: HalveItTarget[] = [
  numberTarget(20),
  numberTarget(19),
  numberTarget(18),
  numberTarget(17),
  numberTarget(16),
  numberTarget(15),
  bullTarget(),
  doubleTarget(16),
  doubleTarget(8),
  doubleTarget(4),
  doubleTarget(2),
  doubleTarget(1),
];

export function getHalveItSequenceTargets(sequenceId: HalveItTargetSequenceId): HalveItTarget[] {
  switch (sequenceId) {
    case "numbers":
      return HALVE_IT_NUMBERS_SEQUENCE;
    case "doubles":
      return HALVE_IT_DOUBLES_SEQUENCE;
    case "triples":
      return HALVE_IT_TRIPLES_SEQUENCE;
    case "classic":
      return HALVE_IT_CLASSIC_SEQUENCE;
  }
}

export function resolveHalveItRoundCount(
  preset: HalveItGameLengthPreset,
  customRoundCount: number,
): number {
  switch (preset) {
    case "short":
      return HALVE_IT_SHORT_ROUNDS;
    case "standard":
      return HALVE_IT_STANDARD_ROUNDS;
    case "custom":
      return Math.min(
        HALVE_IT_MAX_CUSTOM_ROUNDS,
        Math.max(HALVE_IT_MIN_CUSTOM_ROUNDS, customRoundCount),
      );
  }
}

export function buildHalveItTargetSequence(
  sequenceId: HalveItTargetSequenceId,
  roundCount: number,
): HalveItTarget[] {
  const source = getHalveItSequenceTargets(sequenceId);
  if (source.length >= roundCount) {
    return source.slice(0, roundCount);
  }

  const targets: HalveItTarget[] = [];
  for (let index = 0; index < roundCount; index += 1) {
    targets.push(source[index % source.length]!);
  }

  return targets;
}
