"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DartHit } from "@/types/dart";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { buildBotTurnKey } from "@/features/bot/lib/bot-turn-key";
import type { BotClassicVisitFinishedResult } from "@/features/bot/lib/run-bot-classic-format-visit";

interface ClassicBotGameState {
  isBotMatch?: boolean;
  status: "playing" | "finished";
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  roundIndex: number;
  matchId?: string;
  history: { length: number };
  players: Array<{
    playerKind?: "human" | "bot";
    botDifficultyId?: string;
    eliminated?: boolean;
  }>;
}

interface UseBotClassicFormatTurnOptions<TGame extends ClassicBotGameState> {
  game: TGame | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  getGame: () => TGame | null;
  runBotVisit: (options: {
    getGame: () => TGame | null;
    throwDart: (hit: DartHit) => void;
    finishTurn: () => void;
    completeBotVisit: (result: BotClassicVisitFinishedResult<TGame>) => void;
    onDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  }) => Promise<boolean>;
  onBotVisitFinished?: (result: BotClassicVisitFinishedResult<TGame>) => void;
  onBotDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  canBotTakeTurn?: (game: TGame) => boolean;
  enabled?: boolean;
}

export function useBotClassicFormatTurn<TGame extends ClassicBotGameState>({
  game,
  throwDart,
  finishTurn,
  getGame,
  runBotVisit,
  onBotVisitFinished,
  onBotDartHighlight,
  canBotTakeTurn,
  enabled = true,
}: UseBotClassicFormatTurnOptions<TGame>) {
  const [isBotPlaying, setIsBotPlaying] = useState(false);
  const runningTurnKeyRef = useRef<string | null>(null);
  const botVisitRetryCountRef = useRef(0);
  const onBotVisitFinishedRef = useRef(onBotVisitFinished);
  onBotVisitFinishedRef.current = onBotVisitFinished;
  const onBotDartHighlightRef = useRef(onBotDartHighlight);
  onBotDartHighlightRef.current = onBotDartHighlight;

  const requestBotVisit = useCallback(() => {
    const activeGame = getGame();

    if (!enabled || !activeGame?.isBotMatch || activeGame.status !== "playing") {
      return;
    }

    if (canBotTakeTurn && !canBotTakeTurn(activeGame)) {
      return;
    }

    const botPlayer = activeGame.players[activeGame.currentPlayerIndex];

    if (!isBotPlayer(botPlayer) || activeGame.visitDarts.length > 0) {
      return;
    }

    const turnKey = buildBotTurnKey(activeGame);

    if (runningTurnKeyRef.current === turnKey) {
      return;
    }

    runningTurnKeyRef.current = turnKey;
    setIsBotPlaying(true);

    void runBotVisit({
      getGame,
      throwDart,
      finishTurn,
      onDartHighlight: (hit, pulseKey) => {
        onBotDartHighlightRef.current?.(hit, pulseKey);
      },
      completeBotVisit: (result) => {
        if (!getGame()?.isBotMatch) {
          return;
        }

        botVisitRetryCountRef.current = 0;
        onBotVisitFinishedRef.current?.(result);
      },
    })
      .then((threwDart) => {
        if (threwDart) {
          botVisitRetryCountRef.current = 0;
          return;
        }

        const activeGame = getGame();
        const currentPlayer = activeGame?.players[activeGame.currentPlayerIndex ?? -1];

        if (
          botVisitRetryCountRef.current >= 3 ||
          !activeGame?.isBotMatch ||
          activeGame.status !== "playing" ||
          !isBotPlayer(currentPlayer) ||
          activeGame.visitDarts.length > 0 ||
          (canBotTakeTurn && activeGame && !canBotTakeTurn(activeGame))
        ) {
          botVisitRetryCountRef.current = 0;
          return;
        }

        botVisitRetryCountRef.current += 1;
        runningTurnKeyRef.current = null;
        window.setTimeout(() => requestBotVisit(), 300);
      })
      .finally(() => {
        onBotDartHighlightRef.current?.(null);

        if (runningTurnKeyRef.current === turnKey) {
          runningTurnKeyRef.current = null;
        }

        setIsBotPlaying(false);
      });
  }, [canBotTakeTurn, enabled, finishTurn, getGame, runBotVisit, throwDart]);

  useEffect(() => {
    if (!enabled || !game?.isBotMatch || game.status !== "playing") {
      return;
    }

    if (canBotTakeTurn && !canBotTakeTurn(game)) {
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];

    if (!isBotPlayer(currentPlayer) || game.visitDarts.length > 0) {
      return;
    }

    requestBotVisit();
  }, [
    canBotTakeTurn,
    enabled,
    game?.isBotMatch,
    game?.status,
    game?.currentPlayerIndex,
    game?.visitDarts.length,
    game?.roundIndex,
    game?.matchId,
    game?.history.length,
    requestBotVisit,
  ]);

  return { isBotPlaying, requestBotVisit };
}

export type { BotClassicVisitFinishedResult };
