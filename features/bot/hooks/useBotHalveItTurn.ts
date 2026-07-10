"use client";

import type { HalveItGameState } from "@/types/halve-it";
import type { DartHit } from "@/types/dart";
import { useBotClassicFormatTurn } from "@/features/bot/hooks/useBotClassicFormatTurn";
import {
  runBotHalveItVisit,
  type BotHalveItVisitFinishedResult,
} from "@/features/bot/lib/run-bot-halve-it-visit";

interface UseBotHalveItTurnOptions {
  game: HalveItGameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  getGame: () => HalveItGameState | null;
  onBotVisitFinished?: (result: BotHalveItVisitFinishedResult) => void;
  onBotDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  enabled?: boolean;
}

export function useBotHalveItTurn(options: UseBotHalveItTurnOptions) {
  return useBotClassicFormatTurn({
    ...options,
    runBotVisit: runBotHalveItVisit,
  });
}

export type { BotHalveItVisitFinishedResult };
