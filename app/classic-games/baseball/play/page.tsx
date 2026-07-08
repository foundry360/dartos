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
import { BaseballPlaySidebar } from "@/features/classic-games/components/BaseballPlaySidebar";
import {
  formatBaseballProgress,
  getBaseballCurrentTarget,
  getBaseballDartboardHighlight,
} from "@/features/classic-games/lib/baseball-engine";
import { useBaseballStore } from "@/features/classic-games/store/baseball-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import {
  announceBaseballAfterTurn,
  announceBaseballInning,
  primeBaseballClips,
} from "@/utils/baseball-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";

export default function BaseballPlayPage() {
  const router = useRouter();
  const game = useBaseballStore((state) => state.game);
  const throwDart = useBaseballStore((state) => state.throwDart);
  const finishTurn = useBaseballStore((state) => state.finishTurn);
  const undo = useBaseballStore((state) => state.undo);
  const rematch = useBaseballStore((state) => state.rematch);
  const reset = useBaseballStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "baseball",
    onReset: reset,
  });

  useEffect(() => {
    if (!game) {
      router.replace("/classic-games/baseball/setup");
    }
  }, [game, router]);

  useEffect(() => {
    if (!game?.matchId) {
      return;
    }

    primeBaseballClips();
  }, [game?.matchId]);

  useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    onAfterAnnounce: () => {
      const activeGame = useBaseballStore.getState().game;
      if (!activeGame) {
        return;
      }

      const target = getBaseballCurrentTarget(activeGame);
      if (target) {
        announceBaseballInning(target.inningNumber, target.displayLabel, target.segment);
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
  const dartboardHighlight = getBaseballDartboardHighlight(game);

  const handleDartHit = (hit: DartHit) => {
    throwDart(hit);
    const updatedGame = useBaseballStore.getState().game;
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

    const after = useBaseballStore.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceBaseballAfterTurn(before, after, completedPlayerIndex);
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
          <BaseballPlaySidebar
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
            title="Baseball"
            subtitle={formatBaseballProgress(game)}
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
