"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { TicTacToePlaySidebar } from "@/features/classic-games/components/TicTacToePlaySidebar";
import { formatTicTacToeProgress } from "@/features/classic-games/lib/tic-tac-toe-engine";
import { useTicTacToeStore } from "@/features/classic-games/store/tic-tac-toe-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import {
  announceTicTacToeAfterVisit,
  announceTicTacToeMatchStart,
  primeTicTacToeClips,
} from "@/utils/tic-tac-toe-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function TicTacToePlayPage() {
  const router = useRouter();
  const game = useTicTacToeStore((state) => state.game);
  const throwDart = useTicTacToeStore((state) => state.throwDart);
  const finishTurn = useTicTacToeStore((state) => state.finishTurn);
  const undo = useTicTacToeStore((state) => state.undo);
  const rematch = useTicTacToeStore((state) => state.rematch);
  const reset = useTicTacToeStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "tic-tac-toe",
    onReset: reset,
  });

  useEffect(() => {
    if (!game) {
      router.replace("/classic-games/tic-tac-toe/setup");
    }
  }, [game, router]);

  useMatchFullscreen(Boolean(game));

  const voiceReady = useMatchVoiceReady({
    enabled: Boolean(game),
    onUnlock: primeTicTacToeClips,
  });

  useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    resumeReady: voiceReady,
    onAfterAnnounce: () => {
      const activeGame = useTicTacToeStore.getState().game;
      if (!activeGame || !getMatchAudioPreferences().voice) {
        return;
      }

      announceTicTacToeMatchStart(activeGame);
    },
  });

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull) {
        handleFinishTurn();
      }
    },
  });

  if (!game) {
    return null;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const canUndo = game.history.length > 0;
  const showMatchComplete =
    (game.status === "finished" && game.winnerId != null) || game.status === "draw";
  const winnerPlayer =
    game.status === "finished"
      ? game.players.find((player) => player.id === game.winnerId)
      : null;
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Draw";

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
    throwDart(hit);
    const updatedGame = useTicTacToeStore.getState().game;
    if (updatedGame?.status === "playing") {
      celebrateAfterDartThrow(
        hit,
        {
          status: updatedGame.status,
          visitDarts: updatedGame.visitDarts,
        },
        () =>
          updatedGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
      );
    }
  };

  const handleFinishTurn = () => {
    if (!visitFull) {
      return;
    }

    const before = game;
    const completedPlayerIndex = before.currentPlayerIndex;
    unlockVoicePlayback();
    finishTurn();

    const after = useTicTacToeStore.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceTicTacToeAfterVisit(before, after, completedPlayerIndex);
  };

  const throwMiss = () => {
    if (visitFull || game.visitDarts.length === 0) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled: visitFull || game.visitDarts.length === 0,
    onUndo: undo,
    onPrimary: handleFinishTurn,
    primaryLabel: "Finish Turn" as const,
    undoDisabled: !canUndo,
    primaryDisabled: !visitFull,
  };

  const handleMatchCompleteHome = () => {
    reset();
    router.push(APP_HOME_PATH);
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
          <TicTacToePlaySidebar
            game={game}
            headerTitle={
              currentPlayer
                ? `${getPlayerScorecardName(currentPlayer)} (${currentPlayer.symbol})`
                : "Turn!"
            }
            onBackClick={requestExit}
            actionBar={actionBarProps}
          />
        }
        boardHeader={
          <BoardGameTitle
            title="Tic Tac Toe"
            subtitle={formatTicTacToeProgress(game)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={visitFull || game.status !== "playing"}
            showMissButton={false}
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
