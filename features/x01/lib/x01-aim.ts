import { DARTS_PER_VISIT } from "@/lib/constants";
import type { X01GameState } from "@/types/x01";
import { getPreferredCheckoutPath } from "@/features/x01/lib/x01-checkout";
import { isPlayerScoredIn } from "@/features/x01/lib/x01-rules";

/** Preferred aim label for the current dart in an X01 visit. */
export function chooseX01AimLabel(state: X01GameState): string {
  const player = state.players[state.currentPlayerIndex];

  if (!player) {
    return "T20";
  }

  const remaining = player.remaining;
  const dartsAvailable = DARTS_PER_VISIT - state.visitDarts.length;

  if (
    state.inRule === "double_in" &&
    !isPlayerScoredIn(state.inRule, player.scoredIn)
  ) {
    return "D20";
  }

  const checkoutPath = getPreferredCheckoutPath(
    remaining,
    dartsAvailable,
    state.outRule,
  );

  if (checkoutPath?.[0]) {
    return checkoutPath[0];
  }

  if (remaining > 180) {
    return "T20";
  }

  if (remaining > 120) {
    return "T20";
  }

  if (remaining > 60) {
    return "S20";
  }

  if (remaining > 40) {
    return "S20";
  }

  if (remaining > 20) {
    return "S10";
  }

  if (remaining > 2) {
    return remaining % 2 === 0 ? "S1" : "S19";
  }

  return "D1";
}
