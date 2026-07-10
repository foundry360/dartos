"use client";

import type { ShanghaiGameState } from "@/types/shanghai";
import type { DartHit } from "@/types/dart";
import { useBotClassicFormatTurn } from "@/features/bot/hooks/useBotClassicFormatTurn";
import {
  runBotShanghaiVisit,
  type BotShanghaiVisitFinishedResult,
} from "@/features/bot/lib/run-bot-shanghai-visit";

interface UseBotShanghaiTurnOptions {
  game: ShanghaiGameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  getGame: () => ShanghaiGameState | null;
  onBotVisitFinished?: (result: BotShanghaiVisitFinishedResult) => void;
  onBotDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  enabled?: boolean;
}

export function useBotShanghaiTurn(options: UseBotShanghaiTurnOptions) {
  return useBotClassicFormatTurn({
    ...options,
    runBotVisit: runBotShanghaiVisit,
  });
}

export type { BotShanghaiVisitFinishedResult };
