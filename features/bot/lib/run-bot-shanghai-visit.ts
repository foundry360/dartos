import type { ShanghaiGameState } from "@/types/shanghai";
import type { DartHit } from "@/types/dart";
import { planShanghaiVisit } from "@/features/bot/lib/plan-shanghai-visit";
import {
  runBotClassicFormatVisit,
  type BotClassicVisitFinishedResult,
} from "@/features/bot/lib/run-bot-classic-format-visit";

export type BotShanghaiVisitFinishedResult = BotClassicVisitFinishedResult<ShanghaiGameState>;

interface RunBotShanghaiVisitOptions {
  getGame: () => ShanghaiGameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  completeBotVisit: (result: BotShanghaiVisitFinishedResult) => void;
  onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
}

export function runBotShanghaiVisit(options: RunBotShanghaiVisitOptions): Promise<boolean> {
  return runBotClassicFormatVisit<ShanghaiGameState>({
    ...options,
    planVisit: planShanghaiVisit,
  });
}
