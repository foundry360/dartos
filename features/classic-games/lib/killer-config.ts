import type {
  KillerAssignedNumber,
  KillerGameType,
  KillerHitRules,
  KillerNumberAssignment,
  KillerStartingLivesPreset,
  KillerTargetRules,
} from "@/types/killer";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const KILLER_DEFAULT_STARTING_LIVES = 3;
export const KILLER_MIN_STARTING_LIVES = 1;
export const KILLER_MAX_STARTING_LIVES = 9;

export const KILLER_GAME_TYPE_OPTIONS: PillToggleOption<KillerGameType>[] = [
  { value: "classic", label: "Classic Killer" },
  { value: "team", label: "Team Killer" },
];

export const KILLER_NUMBER_ASSIGNMENT_OPTIONS: PillToggleOption<KillerNumberAssignment>[] = [
  { value: "random", label: "Random" },
  { value: "player_chosen", label: "Player chosen" },
  { value: "first_dart", label: "First dart" },
];

export const KILLER_STARTING_LIVES_OPTIONS: PillToggleOption<KillerStartingLivesPreset>[] = [
  { value: "3", label: "3 lives" },
  { value: "5", label: "5 lives" },
  { value: "custom", label: "Custom" },
];

export const KILLER_TARGET_RULES_OPTIONS: PillToggleOption<KillerTargetRules>[] = [
  { value: "numbers_only", label: "Numbers only" },
  { value: "include_bull", label: "Include Bull" },
];

export const KILLER_HIT_RULES_OPTIONS: PillToggleOption<KillerHitRules>[] = [
  { value: "classic", label: "Classic (S/D/T)" },
  { value: "flat", label: "Any hit = 1" },
];

export const KILLER_BOARD_NUMBERS = Array.from({ length: 20 }, (_, index) => index + 1);

export function resolveKillerStartingLives(
  preset: KillerStartingLivesPreset,
  customStartingLives: number,
): number {
  switch (preset) {
    case "3":
      return 3;
    case "5":
      return 5;
    case "custom":
      return Math.min(
        KILLER_MAX_STARTING_LIVES,
        Math.max(KILLER_MIN_STARTING_LIVES, customStartingLives),
      );
  }
}

export function getKillerAvailableTargets(
  targetRules: KillerTargetRules,
): KillerAssignedNumber[] {
  if (targetRules === "include_bull") {
    return [...KILLER_BOARD_NUMBERS, "bull"];
  }

  return [...KILLER_BOARD_NUMBERS];
}

export function formatKillerAssignedNumber(value: KillerAssignedNumber): string {
  return value === "bull" ? "Bull" : String(value);
}

export function shuffleKillerNumbers(values: KillerAssignedNumber[]): KillerAssignedNumber[] {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]!] = [copy[swapIndex]!, copy[index]!];
  }

  return copy;
}

export function assignRandomKillerNumbers(
  playerCount: number,
  targetRules: KillerTargetRules,
): KillerAssignedNumber[] {
  const pool = shuffleKillerNumbers(getKillerAvailableTargets(targetRules));
  return pool.slice(0, playerCount);
}
