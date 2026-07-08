import type {
  Bobs27GameLengthPreset,
  Bobs27Target,
  Bobs27TargetTypeId,
} from "@/types/bobs-27";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const BOBS_27_DEFAULT_STARTING_SCORE = 27;
export const BOBS_27_MAX_STARTING_SCORE = 100;
export const BOBS_27_SHORT_ROUNDS = 10;
export const BOBS_27_STANDARD_DOUBLES_ROUNDS = 20;
export const BOBS_27_STANDARD_DOUBLES_BULL_ROUNDS = 21;
export const BOBS_27_MIN_CUSTOM_ROUNDS = 1;
export const BOBS_27_MAX_CUSTOM_ROUNDS = 40;

export const BOBS_27_GAME_LENGTH_OPTIONS: PillToggleOption<Bobs27GameLengthPreset>[] = [
  { value: "short", label: "Short (D1–D10)" },
  { value: "standard", label: "Standard" },
  { value: "custom", label: "Custom" },
];

export const BOBS_27_TARGET_TYPE_OPTIONS: PillToggleOption<Bobs27TargetTypeId>[] = [
  { value: "doubles", label: "Doubles" },
  { value: "doubles_bull", label: "+ Bull" },
  { value: "doubles_trebles", label: "+ Trebles" },
];

export const BOBS_27_PLAYER_MODE_OPTIONS: PillToggleOption<"solo" | "multiplayer">[] = [
  { value: "solo", label: "Solo" },
  { value: "multiplayer", label: "Multiplayer" },
];

function doubleTarget(value: number): Bobs27Target {
  return {
    segment: value,
    multiplier: "double",
    label: `D${value}`,
    displayLabel: `Double ${value}`,
    penaltyValue: value * 2,
  };
}

function tripleTarget(value: number): Bobs27Target {
  return {
    segment: value,
    multiplier: "triple",
    label: `T${value}`,
    displayLabel: `Treble ${value}`,
    penaltyValue: value * 3,
  };
}

function bullDoubleTarget(): Bobs27Target {
  return {
    segment: "bull",
    multiplier: "double",
    label: "DB",
    displayLabel: "Double Bull",
    penaltyValue: 50,
  };
}

export const BOBS_27_DOUBLES_SEQUENCE: Bobs27Target[] = Array.from({ length: 20 }, (_, index) =>
  doubleTarget(index + 1),
);

export const BOBS_27_TREBLES_SEQUENCE: Bobs27Target[] = Array.from({ length: 20 }, (_, index) =>
  tripleTarget(index + 1),
);

export function getBobs27FullSequence(targetTypeId: Bobs27TargetTypeId): Bobs27Target[] {
  switch (targetTypeId) {
    case "doubles":
      return BOBS_27_DOUBLES_SEQUENCE;
    case "doubles_bull":
      return [...BOBS_27_DOUBLES_SEQUENCE, bullDoubleTarget()];
    case "doubles_trebles":
      return [...BOBS_27_DOUBLES_SEQUENCE, ...BOBS_27_TREBLES_SEQUENCE];
  }
}

export function resolveBobs27RoundCount(
  preset: Bobs27GameLengthPreset,
  targetTypeId: Bobs27TargetTypeId,
  customRoundCount: number,
): number {
  const fullLength = getBobs27FullSequence(targetTypeId).length;

  switch (preset) {
    case "short":
      return Math.min(BOBS_27_SHORT_ROUNDS, fullLength);
    case "standard":
      return targetTypeId === "doubles"
        ? BOBS_27_STANDARD_DOUBLES_ROUNDS
        : targetTypeId === "doubles_bull"
          ? BOBS_27_STANDARD_DOUBLES_BULL_ROUNDS
          : fullLength;
    case "custom":
      return Math.min(
        fullLength,
        Math.max(BOBS_27_MIN_CUSTOM_ROUNDS, customRoundCount),
      );
  }
}

export function buildBobs27TargetSequence(
  targetTypeId: Bobs27TargetTypeId,
  roundCount: number,
): Bobs27Target[] {
  return getBobs27FullSequence(targetTypeId).slice(0, roundCount);
}
