import { DARTS_PER_VISIT } from "@/lib/constants";
import type { BotProfile } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import { applyX01Dart } from "@/features/x01/lib/x01-engine";
import { getPreferredCheckoutPath } from "@/features/x01/lib/x01-checkout";
import { isPlayerScoredIn } from "@/features/x01/lib/x01-rules";
import { simulateDart } from "@/features/bot/lib/dart-simulator";

function chooseAimLabel(state: X01GameState): string {
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

export function planX01Visit(game: X01GameState, profile: BotProfile): DartHit[] {
  const hits: DartHit[] = [];
  let state = game;

  for (let dartIndex = 0; dartIndex < DARTS_PER_VISIT; dartIndex += 1) {
    if (state.status !== "playing") {
      break;
    }

    const player = state.players[state.currentPlayerIndex];

    if (!player) {
      break;
    }

    const aimLabel = chooseAimLabel(state);
    const hit = simulateDart(aimLabel, profile);
    hits.push(hit);

    state = applyX01Dart(state, hit);

    const lastEntry = state.history.at(-1);

    if (lastEntry?.bust) {
      break;
    }

    const updatedPlayer = state.players[state.currentPlayerIndex];

    if (updatedPlayer?.remaining === 0) {
      break;
    }

    if (state.status !== "playing") {
      break;
    }
  }

  return hits;
}
