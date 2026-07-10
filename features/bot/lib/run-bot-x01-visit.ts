import { DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { planX01Visit } from "@/features/bot/lib/plan-x01-visit";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import { playDartHitSound } from "@/utils/sound-effects";
import { dartHitToPracticeTarget } from "@/features/x01/lib/x01-dartboard-highlight";
import {
  BOT_POST_VOICE_DELAY_MS,
  pauseAfterBotDart,
  pauseBeforeEndBotVisit,
  pauseForBotAimHighlight,
} from "@/features/bot/lib/bot-turn-timing";
import { awaitVoicePlaybackQueue, unlockVoicePlayback } from "@/utils/voice-playback";
import { ensureVisitScoreClipReady, prefetchVisitScoreClip } from "@/utils/score-audio";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export interface BotVisitFinishedResult {
  visitTotal: number;
  busted: boolean;
  gameBeforeFinalDart: X01GameState;
  gameAtEnd: X01GameState;
  /** When true, the hook should call nextPlayer() before announcing. */
  advanceTurn: boolean;
}

interface RunBotX01VisitOptions {
  getGame: () => X01GameState | null;
  throwDart: (hit: DartHit) => void;
  completeBotVisit: (result: BotVisitFinishedResult) => void;
  onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  postVoiceDelayMs?: number;
}

export function getBotVisitResult(game: X01GameState): Pick<BotVisitFinishedResult, "visitTotal" | "busted"> {
  const visitTotal = getX01VisitEffectiveScore(game, game.visitDarts.length);
  const busted = game.history
    .slice(-game.visitDarts.length)
    .some((entry) => entry.bust);

  return { visitTotal, busted };
}

function snapshotGame(game: X01GameState): X01GameState {
  return structuredClone(game);
}

function buildBotVisitFinishedResult(
  gameBeforeFinalDart: X01GameState,
  gameAtEnd: X01GameState,
  advanceTurn: boolean,
): BotVisitFinishedResult {
  const gameSnapshot = snapshotGame(gameAtEnd);

  return {
    ...getBotVisitResult(gameSnapshot),
    gameBeforeFinalDart: snapshotGame(gameBeforeFinalDart),
    gameAtEnd: gameSnapshot,
    advanceTurn,
  };
}

export async function runBotX01Visit({
  getGame,
  throwDart,
  completeBotVisit,
  onDartHighlight,
  postVoiceDelayMs = BOT_POST_VOICE_DELAY_MS,
}: RunBotX01VisitOptions): Promise<boolean> {
  await awaitVoicePlaybackQueue();
  await delay(postVoiceDelayMs);

  let activeGame = getGame();

  if (!activeGame || activeGame.status !== "playing") {
    onDartHighlight?.(null);
    return false;
  }

  const botPlayer = activeGame.players[activeGame.currentPlayerIndex];

  if (!botPlayer || !isBotPlayer(botPlayer)) {
    onDartHighlight?.(null);
    return false;
  }

  const profile = getBotProfile(botPlayer.botDifficultyId);
  const plannedDarts = planX01Visit(activeGame, profile);

  if (plannedDarts.length === 0) {
    onDartHighlight?.(null);
    return false;
  }

  let threwDart = false;
  let dartPulseKey = 0;
  let lastHighlightKey: string | null = null;

  for (const plannedDart of plannedDarts) {
    const gameBeforeDart = getGame();

    if (!gameBeforeDart) {
      onDartHighlight?.(null);
      return threwDart;
    }

    const practiceTarget = dartHitToPracticeTarget(plannedDart.hit);
    const highlightKey = practiceTarget
      ? `${practiceTarget.segment}:${practiceTarget.multiplier}`
      : null;

    if (highlightKey && highlightKey !== lastHighlightKey) {
      dartPulseKey += 1;
    }

    onDartHighlight?.(plannedDart.hit, highlightKey ? dartPulseKey : undefined);
    lastHighlightKey = highlightKey;
    await pauseForBotAimHighlight();

    playDartHitSound(plannedDart.hit);
    throwDart(plannedDart.hit);
    onDartHighlight?.(null);
    lastHighlightKey = null;
    threwDart = true;

    activeGame = getGame();

    if (!activeGame) {
      return threwDart;
    }

    const lastEntry = activeGame.history.at(-1);

    if (lastEntry?.bust) {
      onDartHighlight?.(null);
      await pauseBeforeEndBotVisit();
      const finishedResult = buildBotVisitFinishedResult(gameBeforeDart, activeGame, true);
      prefetchVisitScoreClip(finishedResult.visitTotal, finishedResult.busted);
      await ensureVisitScoreClipReady(finishedResult.visitTotal, finishedResult.busted);
      await unlockVoicePlayback();
      completeBotVisit(finishedResult);
      return true;
    }

    const updatedPlayer = activeGame.players[activeGame.currentPlayerIndex];

    if (updatedPlayer?.remaining === 0) {
      onDartHighlight?.(null);
      await pauseBeforeEndBotVisit();
      completeBotVisit(buildBotVisitFinishedResult(gameBeforeDart, activeGame, false));
      return true;
    }

    if (activeGame.status !== "playing") {
      onDartHighlight?.(null);
      await pauseBeforeEndBotVisit();
      completeBotVisit(buildBotVisitFinishedResult(gameBeforeDart, activeGame, false));
      return true;
    }

    if (activeGame.visitDarts.length >= DARTS_PER_VISIT) {
      onDartHighlight?.(null);
      await pauseBeforeEndBotVisit();
      const finishedResult = buildBotVisitFinishedResult(gameBeforeDart, activeGame, true);
      prefetchVisitScoreClip(finishedResult.visitTotal, finishedResult.busted);
      await ensureVisitScoreClipReady(finishedResult.visitTotal, finishedResult.busted);
      await unlockVoicePlayback();
      completeBotVisit(finishedResult);
      return true;
    }

    await pauseAfterBotDart();
  }

  return threwDart;
}
