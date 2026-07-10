import type { HalveItGameState } from "@/types/halve-it";
import type { DartHit } from "@/types/dart";
import { planHalveItVisit } from "@/features/bot/lib/plan-halve-it-visit";
import {
  runBotClassicFormatVisit,
  type BotClassicVisitFinishedResult,
} from "@/features/bot/lib/run-bot-classic-format-visit";

export type BotHalveItVisitFinishedResult = BotClassicVisitFinishedResult<HalveItGameState>;

interface RunBotHalveItVisitOptions {
  getGame: () => HalveItGameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  completeBotVisit: (result: BotHalveItVisitFinishedResult) => void;
  onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
}

export function runBotHalveItVisit(options: RunBotHalveItVisitOptions): Promise<boolean> {
  return runBotClassicFormatVisit<HalveItGameState>({
    ...options,
    planVisit: planHalveItVisit,
  });
}
