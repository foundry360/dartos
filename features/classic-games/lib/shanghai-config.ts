import type {
  ShanghaiGameLengthPreset,
  ShanghaiRule,
  ShanghaiTarget,
  ShanghaiWinningMode,
} from "@/types/shanghai";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const SHANGHAI_DEFAULT_STARTING_SCORE = 0;
export const SHANGHAI_MIN_CUSTOM_ROUNDS = 3;
export const SHANGHAI_MAX_NUMBER_ROUNDS = 20;

export const SHANGHAI_GAME_LENGTH_OPTIONS: PillToggleOption<ShanghaiGameLengthPreset>[] = [
  { value: "full", label: "Full (1–20 + Bull)" },
  { value: "classic", label: "Classic (1–20)" },
  { value: "short", label: "Short (1–10)" },
  { value: "custom", label: "Custom" },
];

export const SHANGHAI_RULE_OPTIONS: PillToggleOption<ShanghaiRule>[] = [
  { value: "instant_win", label: "Instant win" },
  { value: "bonus_points", label: "Bonus points" },
  { value: "disabled", label: "Disabled" },
];

export const SHANGHAI_WINNING_MODE_OPTIONS: PillToggleOption<ShanghaiWinningMode>[] = [
  { value: "highest_score", label: "Highest score" },
  { value: "race_to_shanghai", label: "Race to Shanghai" },
];

function numberTarget(value: number): ShanghaiTarget {
  return {
    segment: value,
    label: String(value),
    displayLabel: String(value),
  };
}

function bullTarget(): ShanghaiTarget {
  return {
    segment: "bull",
    label: "Bull",
    displayLabel: "Bull",
  };
}

export function resolveShanghaiNumberRounds(
  preset: ShanghaiGameLengthPreset,
  customRoundCount: number,
): number {
  switch (preset) {
    case "full":
    case "classic":
      return SHANGHAI_MAX_NUMBER_ROUNDS;
    case "short":
      return 10;
    case "custom":
      return Math.min(
        SHANGHAI_MAX_NUMBER_ROUNDS,
        Math.max(SHANGHAI_MIN_CUSTOM_ROUNDS, customRoundCount),
      );
  }
}

export function resolveShanghaiBullIncluded(
  preset: ShanghaiGameLengthPreset,
  bullRoundIncluded: boolean,
): boolean {
  if (preset === "full") {
    return true;
  }

  return bullRoundIncluded;
}

export function buildShanghaiTargetSequence(
  preset: ShanghaiGameLengthPreset,
  customRoundCount: number,
  bullRoundIncluded: boolean,
): ShanghaiTarget[] {
  const numberRounds = resolveShanghaiNumberRounds(preset, customRoundCount);
  const includeBull = resolveShanghaiBullIncluded(preset, bullRoundIncluded);
  const targets: ShanghaiTarget[] = [];

  for (let value = 1; value <= numberRounds; value += 1) {
    targets.push(numberTarget(value));
  }

  if (includeBull) {
    targets.push(bullTarget());
  }

  return targets;
}
