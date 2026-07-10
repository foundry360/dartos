"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { Bobs27PlaySidebar } from "@/features/classic-games/components/Bobs27PlaySidebar";
import {
  formatBobs27Progress,
  getBobs27DartboardHighlight,
} from "@/features/classic-games/lib/bobs-27-engine";
import { useBobs27Store } from "@/features/classic-games/store/bobs-27-store";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { BOT_PLAY_HUB_PATH } from "@/features/bot/lib/bot-play-games";
import {
  useBotBobs27Turn,
  type BotBobs27VisitFinishedResult,
} from "@/features/bot/hooks/useBotBobs27Turn";
import { getX01DartboardHighlightFromHit } from "@/features/x01/lib/x01-dartboard-highlight";
import { getPlayerScorecardName } from "@/lib/player-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import {
  announceBobs27AfterTurn,
  announceBobs27MatchStart,
  primeBobs27Clips,
} from "@/utils/bobs-27-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { prefetchMatchPlayerVoices } from "@/utils/speech";
import { unlockVoicePlayback } from "@/utils/voice-playback";

export default function Bobs27PlayPage() {
  const router = useRouter();
  const game = useBobs27Store((state) => state.game);
  const throwDart = useBobs27Store((state) => state.throwDart);
  const finishTurn = useBobs27Store((state) => state.finishTurn);
  const undo = useBobs27Store((state) => state.undo);
  const rematch = useBobs27Store((state) => state.rematch);
  const reset = useBobs27Store((state) => state.reset);
  const [botHighlightHit, setBotHighlightHit] = useState<DartHit | null>(null);
  const [botHighlightPulseKey, setBotHighlightPulseKey] = useState(0);

  const handleBotDartHighlight = useCallback((hit: DartHit | null, pulseKey?: number) => {
    setBotHighlightHit(hit);

    if (pulseKey != null) {
      setBotHighlightPulseKey(pulseKey);
    }
  }, []);
  const { requestExit, endMatchConfirmDialog, matchExitInProgressRef } = useEndMatchExit({
    gameMode: "bobs-27",
    onReset: reset,
    exitHref: game?.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH,
  });

  useEffect(() => {
    if (!game && !matchExitInProgressRef.current) {
      router.replace("/classic-games/bobs-27/setup");
    }
  }, [game, matchExitInProgressRef, router]);

  useEffect(() => {
    if (!game?.matchId || !getMatchAudioPreferences().voice) {
      return;
    }

    if (game.isBotMatch) {
      prefetchMatchPlayerVoices(game.players.map(getPlayerScorecardName));
    }
  }, [game?.isBotMatch, game?.matchId, game?.players]);

  useMatchFullscreen(Boolean(game));

  const voiceReady = useMatchVoiceReady({
    enabled: Boolean(game),
    onUnlock: primeBobs27Clips,
  });

  const { matchIntroReady } = useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    resumeReady: voiceReady,
    onAfterAnnounce: () => {
      const activeGame = useBobs27Store.getState().game;
      if (!activeGame || !getMatchAudioPreferences().voice) {
        return;
      }

      announceBobs27MatchStart(activeGame);
    },
  });

  const handleBotVisitFinished = (result: BotBobs27VisitFinishedResult) => {
    if (!useBobs27Store.getState().game || !getMatchAudioPreferences().voice) {
      return;
    }

    unlockVoicePlayback();
    announceBobs27AfterTurn(
      result.gameBeforeFinish,
      result.gameAtEnd,
      result.completedPlayerIndex,
    );
  };

  const { isBotPlaying } = useBotBobs27Turn({
    game,
    throwDart,
    finishTurn,
    getGame: () => useBobs27Store.getState().game,
    onBotVisitFinished: handleBotVisitFinished,
    onBotDartHighlight: handleBotDartHighlight,
    enabled: matchIntroReady,
  });

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;
  const currentPlayer = game?.players[game.currentPlayerIndex ?? -1];
  const isBotTurn = isBotPlayer(currentPlayer) || isBotPlaying;

  const handleFinishTurn = useCallback(() => {
    const activeGame = useBobs27Store.getState().game;
    if (!activeGame || activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const activePlayer = activeGame.players[activeGame.currentPlayerIndex];
    if (isBotPlayer(activePlayer) || isBotPlaying) {
      return;
    }

    const before = activeGame;
    const completedPlayerIndex = before.currentPlayerIndex;
    unlockVoicePlayback();
    finishTurn();

    const after = useBobs27Store.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceBobs27AfterTurn(before, after, completedPlayerIndex);
  }, [finishTurn, isBotPlaying]);

  const dartboardHighlight = useMemo((): {
    practiceTarget?: import("@/features/practice/lib/practice-target-segments").PracticeTargetHighlight | null;
    practiceHighlightBulls?: boolean;
  } => {
    if (game && !visitFull && isBotPlaying && botHighlightHit) {
      return getX01DartboardHighlightFromHit(botHighlightHit);
    }

    return game ? getBobs27DartboardHighlight(game) : {};
  }, [botHighlightHit, game, isBotPlaying, visitFull]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull && !isBotTurn) {
        handleFinishTurn();
      }
    },
  });

  if (!game) {
    return null;
  }

  const canUndo = game.history.length > 0;
  const showMatchComplete = game.status === "finished" && game.winnerId != null;
  const winnerPlayer = game.players.find((player) => player.id === game.winnerId);
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";
  const currentPlayerEliminated = currentPlayer?.eliminated ?? false;

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
    throwDart(hit);
    const updatedGame = useBobs27Store.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) => activeGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
    );
  };

  const throwMiss = () => {
    if (visitFull || game.visitDarts.length === 0 || currentPlayerEliminated) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled:
      visitFull || game.visitDarts.length === 0 || currentPlayerEliminated || isBotTurn,
    onUndo: undo,
    onPrimary: handleFinishTurn,
    primaryLabel: "Finish Turn" as const,
    undoDisabled: !canUndo || isBotTurn,
    primaryDisabled: !visitFull || isBotTurn,
  };

  const handleMatchCompleteHome = () => {
    matchExitInProgressRef.current = true;
    reset();
    router.push(game.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH);
  };

  const handleMatchCompleteRematch = () => {
    rematch();
  };

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        actions={
          <ActionBar
            {...actionBarProps}
            className="scoring-layout__actions--portrait py-0 pb-0"
          />
        }
        sidebar={
          <Bobs27PlaySidebar
            game={game}
            headerTitle={
              currentPlayer && !currentPlayer.eliminated
                ? `${getPlayerScorecardName(currentPlayer)}'s Turn!`
                : "Turn!"
            }
            onBackClick={requestExit}
            actionBar={actionBarProps}
          />
        }
        boardHeader={
          <BoardGameTitle
            title="Bob's 27"
            subtitle={formatBobs27Progress(game)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={
              visitFull ||
              game.status === "finished" ||
              currentPlayerEliminated ||
              isBotTurn
            }
            showMissButton={false}
            practiceTarget={dartboardHighlight.practiceTarget ?? null}
            practiceHighlightBulls={"practiceHighlightBulls" in dartboardHighlight ? dartboardHighlight.practiceHighlightBulls ?? false : false}
            practiceTargetPulseKey={botHighlightPulseKey}
            practiceTargetHeavyPulse
          />
        }
        showFullscreenButton
      />
      <MatchCompletePanel
        open={showMatchComplete}
        winnerName={winnerName}
        onHome={handleMatchCompleteHome}
        onRematch={handleMatchCompleteRematch}
      />
    </>
  );
}
