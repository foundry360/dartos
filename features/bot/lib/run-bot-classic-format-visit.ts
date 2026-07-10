import { DARTS_PER_VISIT } from "@/lib/constants";
import type { BotDifficultyId, BotProfile } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import type { PlannedBotDart } from "@/features/bot/lib/plan-cricket-visit";
import { playDartHitSound } from "@/utils/sound-effects";
import { dartHitToPracticeTarget } from "@/features/x01/lib/x01-dartboard-highlight";
import {
  BOT_POST_VOICE_DELAY_MS,
  pauseAfterBotDart,
  pauseBeforeEndBotVisit,
  pauseForBotAimHighlight,
} from "@/features/bot/lib/bot-turn-timing";
import { awaitVoicePlaybackQueue } from "@/utils/voice-playback";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export interface BotClassicVisitFinishedResult<TGame> {
  completedPlayerIndex: number;
  gameBeforeFinish: TGame;
  gameAtEnd: TGame;
}

interface ClassicBotGameSnapshot {
  status: string;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  players: Array<{
    playerKind?: "human" | "bot";
    botDifficultyId?: BotDifficultyId;
    eliminated?: boolean;
  }>;
}

interface RunBotClassicFormatVisitOptions<TGame extends ClassicBotGameSnapshot> {
  getGame: () => TGame | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  completeBotVisit: (result: BotClassicVisitFinishedResult<TGame>) => void;
  onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  planVisit: (game: TGame, profile: BotProfile) => PlannedBotDart[];
  canBotTakeTurn?: (game: TGame) => boolean;
  postVoiceDelayMs?: number;
}

function snapshotGame<TGame>(game: TGame): TGame {
  return structuredClone(game);
}

export async function runBotClassicFormatVisit<TGame extends ClassicBotGameSnapshot>({
  getGame,
  throwDart,
  finishTurn,
  completeBotVisit,
  onDartHighlight,
  planVisit,
  canBotTakeTurn,
  postVoiceDelayMs = BOT_POST_VOICE_DELAY_MS,
}: RunBotClassicFormatVisitOptions<TGame>): Promise<boolean> {
  await awaitVoicePlaybackQueue();
  await delay(postVoiceDelayMs);

  let activeGame = getGame();

  if (!activeGame || activeGame.status !== "playing") {
    onDartHighlight?.(null);
    return false;
  }

  if (canBotTakeTurn && !canBotTakeTurn(activeGame)) {
    onDartHighlight?.(null);
    return false;
  }

  const botPlayer = activeGame.players[activeGame.currentPlayerIndex];

  if (!botPlayer || !isBotPlayer(botPlayer)) {
    onDartHighlight?.(null);
    return false;
  }

  const profile = getBotProfile(botPlayer.botDifficultyId);
  const plannedDarts = planVisit(activeGame, profile);

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

  const completedPlayerIndex = gameBeforeFinish.currentPlayerIndex;
  onDartHighlight?.(null);
  await pauseBeforeEndBotVisit();
  finishTurn();
  const gameAtEnd = getGame();

  if (!gameAtEnd) {
    return threwDart;
  }

  completeBotVisit({
    completedPlayerIndex,
    gameBeforeFinish: snapshotGame(gameBeforeFinish),
    gameAtEnd: snapshotGame(gameAtEnd),
  });

  return true;
}
