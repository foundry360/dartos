import { DARTS_PER_VISIT } from "@/lib/constants";
import type { BotProfile } from "@/types/bot";
import type { Bobs27GameState, Bobs27Target } from "@/types/bobs-27";
import {
  applyBobs27Dart,
  getBobs27CurrentTarget,
} from "@/features/classic-games/lib/bobs-27-engine";
import { simulateDart } from "@/features/bot/lib/dart-simulator";
import type { PlannedBotDart } from "@/features/bot/lib/plan-cricket-visit";

function bobs27TargetToAimLabel(target: Bobs27Target): string {
  if (target.label === "DB") {
    return "50";
  }

  return target.label;
}

export function planBobs27Visit(
  game: Bobs27GameState,
  profile: BotProfile,
): PlannedBotDart[] {
  const plannedDarts: PlannedBotDart[] = [];
  let state = game;

  for (let dartIndex = 0; dartIndex < DARTS_PER_VISIT; dartIndex += 1) {
    if (state.status !== "playing") {
      break;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.eliminated) {
      break;
    }

    const target = getBobs27CurrentTarget(state);
    if (!target) {
      break;
    }

    const aimLabel = bobs27TargetToAimLabel(target);
    const hit = simulateDart(aimLabel, profile);
    plannedDarts.push({ aimLabel, hit });
    state = applyBobs27Dart(state, hit);
  }

  return plannedDarts;
}
