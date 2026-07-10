"use client";

import type { Bobs27GameState } from "@/types/bobs-27";
import type { DartHit } from "@/types/dart";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { useBotClassicFormatTurn } from "@/features/bot/hooks/useBotClassicFormatTurn";
import {
  runBotBobs27Visit,
  type BotBobs27VisitFinishedResult,
} from "@/features/bot/lib/run-bot-bobs-27-visit";

interface UseBotBobs27TurnOptions {
  game: Bobs27GameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  getGame: () => Bobs27GameState | null;
  onBotVisitFinished?: (result: BotBobs27VisitFinishedResult) => void;
  onBotDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  enabled?: boolean;
}

export function useBotBobs27Turn(options: UseBotBobs27TurnOptions) {
  return useBotClassicFormatTurn({
    ...options,
    runBotVisit: runBotBobs27Visit,
    canBotTakeTurn: (game) => {
      const player = game.players[game.currentPlayerIndex];
      return isBotPlayer(player) && !player?.eliminated;
    },
  });
}

export type { BotBobs27VisitFinishedResult };
