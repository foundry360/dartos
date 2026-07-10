import { DARTS_PER_VISIT } from "@/lib/constants";
import type { BotProfile } from "@/types/bot";
import type { ShanghaiGameState, ShanghaiTarget } from "@/types/shanghai";
import {
  applyShanghaiDart,
  getShanghaiCurrentTarget,
} from "@/features/classic-games/lib/shanghai-engine";
import { simulateDart } from "@/features/bot/lib/dart-simulator";
import type { PlannedBotDart } from "@/features/bot/lib/plan-cricket-visit";

function shanghaiTargetToAimLabel(target: ShanghaiTarget): string {
  if (target.segment === "bull") {
    return "50";
  }

  return `T${target.segment}`;
}

export function planShanghaiVisit(
  game: ShanghaiGameState,
  profile: BotProfile,
): PlannedBotDart[] {
  const plannedDarts: PlannedBotDart[] = [];
  let state = game;

  for (let dartIndex = 0; dartIndex < DARTS_PER_VISIT; dartIndex += 1) {
    if (state.status !== "playing") {
      break;
    }

    const target = getShanghaiCurrentTarget(state);
    if (!target) {
      break;
    }

    const aimLabel = shanghaiTargetToAimLabel(target);
    const hit = simulateDart(aimLabel, profile);
    plannedDarts.push({ aimLabel, hit });
    state = applyShanghaiDart(state, hit);
  }

  return plannedDarts;
}
