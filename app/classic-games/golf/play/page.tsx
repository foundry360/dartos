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
import { GolfPlaySidebar } from "@/features/classic-games/components/GolfPlaySidebar";
import {
  formatGolfProgress,
  getGolfCurrentHole,
  getGolfDartboardHighlight,
} from "@/features/classic-games/lib/golf-engine";
import { useGolfStore } from "@/features/classic-games/store/golf-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import {
  announceGolfAfterTurn,
  announceGolfHole,
  primeGolfClips,
} from "@/utils/golf-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";

export default function GolfPlayPage() {
  const router = useRouter();
  const game = useGolfStore((state) => state.game);
  const throwDart = useGolfStore((state) => state.throwDart);
  const finishTurn = useGolfStore((state) => state.finishTurn);
  const undo = useGolfStore((state) => state.undo);
  const rematch = useGolfStore((state) => state.rematch);
  const reset = useGolfStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "golf",
    onReset: reset,
  });

  useEffect(() => {
    if (!game) {
      router.replace("/classic-games/golf/setup");
    }
  }, [game, router]);

  useEffect(() => {
    if (!game?.matchId) {
      return;
    }

    primeGolfClips();
  }, [game?.matchId]);

  useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    onAfterAnnounce: () => {
      const activeGame = useGolfStore.getState().game;
      if (!activeGame) {
        return;
      }

      const hole = getGolfCurrentHole(activeGame);
      if (hole) {
        announceGolfHole(hole.holeNumber, hole.displayLabel, hole.segment);
      }
    },
  });

  useMatchFullscreen(Boolean(game));

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull) {
        finishTurn();
      }
    },
  });

  if (!game) {
    return null;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const canUndo = game.history.length > 0;
  const showMatchComplete = game.status === "finished" && game.winnerId != null;
  const winnerPlayer = game.players.find((player) => player.id === game.winnerId);
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";
  const dartboardHighlight = getGolfDartboardHighlight(game);

  const handleDartHit = (hit: DartHit) => {
    throwDart(hit);
    const updatedGame = useGolfStore.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) => activeGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
    );
  };

  const handleFinishTurn = () => {
    if (!visitFull || !game) {
      return;
    }

    const before = game;
    const completedPlayerIndex = before.currentPlayerIndex;
    finishTurn();

    const after = useGolfStore.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceGolfAfterTurn(before, after, completedPlayerIndex);
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
          <GolfPlaySidebar
            game={game}
            headerTitle={
              currentPlayer
                ? `${getPlayerScorecardName(currentPlayer)}'s Turn!`
                : "Turn!"
            }
            onBackClick={requestExit}
            actionBar={actionBarProps}
          />
        }
        boardHeader={
          <BoardGameTitle
            title="Golf"
            subtitle={formatGolfProgress(game)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={visitFull || game.status === "finished"}
            showMissButton={false}
            practiceHighlightSegment={dartboardHighlight.practiceHighlightSegment ?? null}
            practiceHighlightBulls={dartboardHighlight.practiceHighlightBulls ?? false}
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
