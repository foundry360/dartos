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
import { Checkout121PlaySidebar } from "@/features/classic-games/components/Checkout121PlaySidebar";
import {
  formatCheckout121Progress,
  getCheckout121DartsRemainingInAttempt,
} from "@/features/classic-games/lib/checkout-121-engine";
import { useCheckout121Store } from "@/features/classic-games/store/checkout-121-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import {
  announceCheckout121AfterDart,
  announceCheckout121AfterVisit,
  announceCheckout121MatchStart,
  primeCheckout121Clips,
} from "@/utils/checkout-121-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function Checkout121PlayPage() {
  const router = useRouter();
  const game = useCheckout121Store((state) => state.game);
  const throwDart = useCheckout121Store((state) => state.throwDart);
  const finishTurn = useCheckout121Store((state) => state.finishTurn);
  const undo = useCheckout121Store((state) => state.undo);
  const rematch = useCheckout121Store((state) => state.rematch);
  const reset = useCheckout121Store((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "checkout-121",
    onReset: reset,
  });

  useEffect(() => {
    if (!game) {
      router.replace("/classic-games/121-checkout/setup");
    }
  }, [game, router]);

  useMatchFullscreen(Boolean(game));

  const voiceReady = useMatchVoiceReady({
    enabled: Boolean(game),
    onUnlock: primeCheckout121Clips,
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
      const activeGame = useCheckout121Store.getState().game;
      if (!activeGame || !getMatchAudioPreferences().voice) {
        return;
      }

      announceCheckout121MatchStart(activeGame);
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
  const dartsRemainingInAttempt = getCheckout121DartsRemainingInAttempt(game);
  const attemptBlocked = dartsRemainingInAttempt <= 0;
  const canUndo = game.history.length > 0;
  const showMatchComplete = game.status === "finished" && game.winnerId != null;
  const winnerPlayer = game.players.find((player) => player.id === game.winnerId);
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";

  const handleDartHit = (hit: DartHit) => {
    const before = useCheckout121Store.getState().game;
    if (!before) {
      return;
    }

    const dartsRemainingBefore = getCheckout121DartsRemainingInAttempt(before);
    unlockVoicePlayback();
    throwDart(hit);
    const after = useCheckout121Store.getState().game;
    celebrateAfterDartThrow(
      hit,
      after,
      (activeGame) => activeGame?.visitDarts.reduce((total, dart) => total + dart.score, 0) ?? 0,
    );

    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceCheckout121AfterDart(before, after, dartsRemainingBefore);
  };

  const handleFinishTurn = () => {
    if (!visitFull || !game) {
      return;
    }

    const before = game;
    const completedPlayerIndex = before.currentPlayerIndex;
    unlockVoicePlayback();
    finishTurn();

    const after = useCheckout121Store.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceCheckout121AfterVisit(before, after, completedPlayerIndex);
  };

  const throwMiss = () => {
    if (visitFull || attemptBlocked || game.visitDarts.length === 0) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled: visitFull || attemptBlocked || game.visitDarts.length === 0,
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
          <Checkout121PlaySidebar
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
            title="121 Checkout"
            subtitle={formatCheckout121Progress(game)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={visitFull || attemptBlocked || game.status === "finished"}
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
