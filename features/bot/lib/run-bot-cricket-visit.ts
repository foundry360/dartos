import { DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { CricketGameState } from "@/types/cricket";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { planCricketVisit } from "@/features/bot/lib/plan-cricket-visit";
import { getCricketVisitPointsScored } from "@/features/cricket/lib/cricket-engine";
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

export interface BotCricketVisitFinishedResult {
  visitTotal: number;
  gameBeforeFinish: CricketGameState;
  gameAtEnd: CricketGameState;
}

interface RunBotCricketVisitOptions {
  getGame: () => CricketGameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  completeBotVisit: (result: BotCricketVisitFinishedResult) => void;
  onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  postVoiceDelayMs?: number;
}

function snapshotGame(game: CricketGameState): CricketGameState {
  return structuredClone(game);
}

export async function runBotCricketVisit({
  getGame,
  throwDart,
  finishTurn,
  completeBotVisit,
  onDartHighlight,
  postVoiceDelayMs = BOT_POST_VOICE_DELAY_MS,
}: RunBotCricketVisitOptions): Promise<boolean> {
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
  const plannedDarts = planCricketVisit(activeGame, profile);

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

    if (!activeGame || activeGame.status !== "playing") {
      onDartHighlight?.(null);
      return threwDart;
    }

    if (activeGame.visitDarts.length >= DARTS_PER_VISIT) {
      break;
    }

    await pauseAfterBotDart();
  }

  const gameBeforeFinish = getGame();

  if (!gameBeforeFinish || gameBeforeFinish.visitDarts.length < DARTS_PER_VISIT) {
    onDartHighlight?.(null);
    return threwDart;
  }

  const visitTotal = getCricketVisitPointsScored(gameBeforeFinish);
  prefetchVisitScoreClip(visitTotal, false);
  await ensureVisitScoreClipReady(visitTotal, false);
  onDartHighlight?.(null);
  await pauseBeforeEndBotVisit();
  await unlockVoicePlayback();
  finishTurn();
  const gameAtEnd = getGame();

  if (!gameAtEnd) {
    return threwDart;
  }

  completeBotVisit({
    visitTotal,
    gameBeforeFinish: snapshotGame(gameBeforeFinish),
    gameAtEnd: snapshotGame(gameAtEnd),
  });

  return true;
}
