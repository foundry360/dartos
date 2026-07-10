"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DartHit } from "@/types/dart";
import type { CricketGameState } from "@/types/cricket";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { buildBotTurnKey } from "@/features/bot/lib/bot-turn-key";
import {
  runBotCricketVisit,
  type BotCricketVisitFinishedResult,
} from "@/features/bot/lib/run-bot-cricket-visit";

interface UseBotCricketTurnOptions {
  game: CricketGameState | null;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  getGame: () => CricketGameState | null;
  onBotVisitFinished?: (result: BotCricketVisitFinishedResult) => void;
  onBotDartHighlight?: (hit: DartHit | null, pulseKey?: number) => void;
  enabled?: boolean;
}

export function useBotCricketTurn({
  game,
  throwDart,
  finishTurn,
  getGame,
  onBotVisitFinished,
  onBotDartHighlight,
  enabled = true,
}: UseBotCricketTurnOptions) {
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

    void runBotCricketVisit({
      getGame,
      throwDart,
      finishTurn,
      onDartHighlight: (hit, pulseKey) => {
        onBotDartHighlightRef.current?.(hit, pulseKey);
      },
      completeBotVisit: (result) => {
        const activeGame = getGame();

        if (!activeGame?.isBotMatch || activeGame.status !== "playing") {
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
          activeGame.visitDarts.length > 0
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
  }, [enabled, finishTurn, getGame, throwDart]);

  useEffect(() => {
    if (!enabled || !game?.isBotMatch || game.status !== "playing") {
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];

    if (!isBotPlayer(currentPlayer) || game.visitDarts.length > 0) {
      return;
    }

    requestBotVisit();
  }, [
    enabled,
    game?.isBotMatch,
    game?.status,
    game?.currentPlayerIndex,
    game?.visitDarts.length,
    game?.legsPlayed,
    game?.matchId,
    game?.history.length,
    requestBotVisit,
  ]);

  return { isBotPlaying, requestBotVisit };
}

export type { BotCricketVisitFinishedResult };
