import { DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { isBotPlayer } from "@/features/bot/lib/build-bot-x01-setup";
import { planX01Visit } from "@/features/bot/lib/plan-x01-visit";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import { playDartHitSound } from "@/utils/sound-effects";
import {
  BOT_POST_VOICE_DELAY_MS,
  pauseAfterBotDart,
  pauseBeforeEndBotVisit,
} from "@/features/bot/lib/bot-turn-timing";
import { awaitVoicePlaybackQueue } from "@/utils/voice-playback";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export interface BotVisitFinishedResult {
  visitTotal: number;
  busted: boolean;
}

interface RunBotX01VisitOptions {
  getGame: () => X01GameState | null;
  throwDart: (hit: DartHit) => void;
  finishBotTurn: (activeGame: X01GameState) => void;
  postVoiceDelayMs?: number;
}

export function buildBotTurnKey(game: X01GameState): string {
  return [
    game.matchId,
    game.legsPlayed,
    game.currentPlayerIndex,
    game.history.length,
  ].join(":");
}

export async function runBotX01Visit({
  getGame,
  throwDart,
  finishBotTurn,
  postVoiceDelayMs = BOT_POST_VOICE_DELAY_MS,
}: RunBotX01VisitOptions): Promise<boolean> {
  await awaitVoicePlaybackQueue();
  await delay(postVoiceDelayMs);

  let activeGame = getGame();

  if (!activeGame || activeGame.status !== "playing") {
    return false;
  }

  const botPlayer = activeGame.players[activeGame.currentPlayerIndex];

  if (!botPlayer || !isBotPlayer(botPlayer)) {
    return false;
  }

  const profile = getBotProfile(botPlayer.botDifficultyId);
  const plannedHits = planX01Visit(activeGame, profile);

  if (plannedHits.length === 0) {
    return false;
  }

  let threwDart = false;

  for (const hit of plannedHits) {
    playDartHitSound(hit);
    throwDart(hit);
    threwDart = true;

    activeGame = getGame();

    if (!activeGame || activeGame.status !== "playing") {
      return threwDart;
    }

    const lastEntry = activeGame.history.at(-1);

    if (lastEntry?.bust) {
      await pauseBeforeEndBotVisit();
      finishBotTurn(activeGame);
      return true;
    }

    const updatedPlayer = activeGame.players[activeGame.currentPlayerIndex];

    if (updatedPlayer?.remaining === 0) {
      await pauseBeforeEndBotVisit();
      return true;
    }

    if (activeGame.visitDarts.length >= DARTS_PER_VISIT) {
      await pauseBeforeEndBotVisit();
      finishBotTurn(activeGame);
      return true;
    }

    await pauseAfterBotDart();
  }

  return threwDart;
}

export function getBotVisitResult(game: X01GameState): BotVisitFinishedResult {
  const visitTotal = getX01VisitEffectiveScore(game, game.visitDarts.length);
  const busted = game.history
    .slice(-game.visitDarts.length)
    .some((entry) => entry.bust);

  return { visitTotal, busted };
}
