import { DARTS_PER_VISIT } from "@/lib/constants";
import type { CricketTarget } from "@/lib/constants";
import { getCricketTargets } from "@/lib/constants";
import type { BotProfile } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { CricketGameState } from "@/types/cricket";
import {
  applyCricketDart,
  getCricketMark,
  isSegmentClosedForTarget,
} from "@/features/cricket/lib/cricket-engine";
import { simulateDart } from "@/features/bot/lib/dart-simulator";

export interface PlannedBotDart {
  aimLabel: string;
  hit: DartHit;
}

function targetToAimLabel(target: CricketTarget): string {
  if (target === "bull") {
    return "50";
  }

  return `T${target}`;
}

export function chooseCricketAimLabel(
  state: CricketGameState,
  playerIndex = state.currentPlayerIndex,
): string {
  const player = state.players[playerIndex];
  const targets = getCricketTargets(state.variant ?? "classic");

  if (!player) {
    return "T20";
  }

  for (const target of targets) {
    if (getCricketMark(player.marks, target) < 3) {
      return targetToAimLabel(target);
    }
  }

  for (const target of targets) {
    if (!isSegmentClosedForTarget(state.players, target)) {
      continue;
    }

    const canScore = state.players.some(
      (opponent, index) =>
        index !== playerIndex && getCricketMark(opponent.marks, target) < 3,
    );

    if (canScore) {
      return targetToAimLabel(target);
    }
  }

  return targetToAimLabel(targets[0] ?? 20);
}

export function planCricketVisit(
  game: CricketGameState,
  profile: BotProfile,
): PlannedBotDart[] {
  const plannedDarts: PlannedBotDart[] = [];
  let state = game;

  for (let dartIndex = 0; dartIndex < DARTS_PER_VISIT; dartIndex += 1) {
    if (state.status !== "playing") {
      break;
    }

    const aimLabel = chooseCricketAimLabel(state);
    const hit = simulateDart(aimLabel, profile);
    plannedDarts.push({ aimLabel, hit });
    state = applyCricketDart(state, hit);
  }

  return plannedDarts;
}
