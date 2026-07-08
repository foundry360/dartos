import type { Checkout121AttemptDarts, Checkout121OutRule } from "@/types/checkout-121";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const CHECKOUT_121_DEFAULT_START_SCORE = 121;
export const CHECKOUT_121_MIN_START_SCORE = 121;
export const CHECKOUT_121_MAX_START_SCORE = 250;
export const CHECKOUT_121_DEFAULT_FINISH_SCORE = 170;
export const CHECKOUT_121_MAX_FINISH_SCORE = 250;
export const CHECKOUT_121_DEFAULT_DARTS_PER_ATTEMPT: Checkout121AttemptDarts = 3;

export const CHECKOUT_121_ATTEMPT_OPTIONS: PillToggleOption<`${Checkout121AttemptDarts}`>[] = [
  { value: "3", label: "3" },
  { value: "6", label: "6" },
  { value: "9", label: "9" },
  { value: "12", label: "12" },
];

export const CHECKOUT_121_OUT_RULE_OPTIONS: PillToggleOption<Checkout121OutRule>[] = [
  { value: "double_out", label: "Double out" },
  { value: "master_out", label: "Bull finish" },
];

export function parseCheckout121AttemptDarts(value: string): Checkout121AttemptDarts {
  const parsed = Number(value);
  if (parsed === 3 || parsed === 6 || parsed === 9 || parsed === 12) {
    return parsed;
  }

  return CHECKOUT_121_DEFAULT_DARTS_PER_ATTEMPT;
}

export function clampCheckout121FinishScore(
  finishScore: number,
  startScore: number,
): number {
  return Math.min(
    CHECKOUT_121_MAX_FINISH_SCORE,
    Math.max(finishScore, startScore),
  );
}
