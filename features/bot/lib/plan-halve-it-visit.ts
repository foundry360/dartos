import { DARTS_PER_VISIT } from "@/lib/constants";
import type { BotProfile } from "@/types/bot";
import type { HalveItGameState, HalveItTarget } from "@/types/halve-it";
import {
  applyHalveItDart,
  getHalveItCurrentTarget,
} from "@/features/classic-games/lib/halve-it-engine";
import { simulateDart } from "@/features/bot/lib/dart-simulator";
import type { PlannedBotDart } from "@/features/bot/lib/plan-cricket-visit";

function halveItTargetToAimLabel(target: HalveItTarget): string {
  if (target.segment === "bull") {
    return "50";
  }

  if (target.multiplier === "double") {
    return `D${target.segment}`;
  }

  if (target.multiplier === "triple") {
    return `T${target.segment}`;
  }

  return `T${target.segment}`;
}

export function planHalveItVisit(
  game: HalveItGameState,
  profile: BotProfile,
): PlannedBotDart[] {
  const plannedDarts: PlannedBotDart[] = [];
  let state = game;

  for (let dartIndex = 0; dartIndex < DARTS_PER_VISIT; dartIndex += 1) {
    if (state.status !== "playing") {
      break;
    }

    const target = getHalveItCurrentTarget(state);
    if (!target) {
      break;
    }

    const aimLabel = halveItTargetToAimLabel(target);
    const hit = simulateDart(aimLabel, profile);
    plannedDarts.push({ aimLabel, hit });
    state = applyHalveItDart(state, hit);
  }

  return plannedDarts;
}
