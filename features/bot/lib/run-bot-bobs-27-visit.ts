import type { Bobs27GameState } from "@/types/bobs-27";
import type { DartHit } from "@/types/dart";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { planBobs27Visit } from "@/features/bot/lib/plan-bobs-27-visit";
import {
  runBotClassicFormatVisit,
  type BotClassicVisitFinishedResult,
} from "@/features/bot/lib/run-bot-classic-format-visit";

export type BotBobs27VisitFinishedResult = BotClassicVisitFinishedResult<Bobs27GameState>;

interface RunBotBobs27VisitOptions {
  getGame: () => Bobs27GameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  completeBotVisit: (result: BotBobs27VisitFinishedResult) => void;
  onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
}

export function runBotBobs27Visit(options: RunBotBobs27VisitOptions): Promise<boolean> {
  return runBotClassicFormatVisit<Bobs27GameState>({
    ...options,
    planVisit: planBobs27Visit,
    canBotTakeTurn: (game) => {
      const player = game.players[game.currentPlayerIndex];
      return isBotPlayer(player) && !player?.eliminated;
    },
  });
}
