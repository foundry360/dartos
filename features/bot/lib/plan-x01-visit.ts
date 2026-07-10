import { DARTS_PER_VISIT } from "@/lib/constants";
import type { BotProfile } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import { applyX01Dart } from "@/features/x01/lib/x01-engine";
import { chooseX01AimLabel } from "@/features/x01/lib/x01-aim";
import { simulateDart } from "@/features/bot/lib/dart-simulator";

export interface PlannedBotDart {
  aimLabel: string;
  hit: DartHit;
}

export function planX01Visit(game: X01GameState, profile: BotProfile): PlannedBotDart[] {
  const plannedDarts: PlannedBotDart[] = [];
  let state = game;

  for (let dartIndex = 0; dartIndex < DARTS_PER_VISIT; dartIndex += 1) {
    if (state.status !== "playing") {
      break;
    }

    const player = state.players[state.currentPlayerIndex];

    if (!player) {
      break;
    }

    const aimLabel = chooseX01AimLabel(state);
    const hit = simulateDart(aimLabel, profile);
    plannedDarts.push({ aimLabel, hit });

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

  return plannedDarts;
}
