"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { KillerPlaySidebar } from "@/features/classic-games/components/KillerPlaySidebar";
import {
  formatKillerProgress,
  getKillerDartboardHighlight,
  getKillerVisitLimit,
} from "@/features/classic-games/lib/killer-engine";
import { useKillerStore } from "@/features/classic-games/store/killer-store";
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
  announceKillerAfterTurn,
  announceKillerCallouts,
  primeKillerClips,
  resolveKillerPreAssignedTargetAnnouncements,
} from "@/utils/killer-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockVoicePlayback } from "@/utils/voice-playback";

export default function KillerPlayPage() {
  const router = useRouter();
  const game = useKillerStore((state) => state.game);
  const throwDart = useKillerStore((state) => state.throwDart);
  const finishTurn = useKillerStore((state) => state.finishTurn);
  const undo = useKillerStore((state) => state.undo);
  const rematch = useKillerStore((state) => state.rematch);
  const reset = useKillerStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "killer",
    onReset: reset,
  });

  useEffect(() => {
    if (!game) {
      router.replace("/classic-games/killer/setup");
    }
  }, [game, router]);

  useMatchFullscreen(Boolean(game));

  const voiceReady = useMatchVoiceReady({
    enabled: Boolean(game),
    onUnlock: primeKillerClips,
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
      const activeGame = useKillerStore.getState().game;
      if (!activeGame || !getMatchAudioPreferences().voice) {
        return;
      }

      const callouts = resolveKillerPreAssignedTargetAnnouncements(activeGame);
      if (callouts.length > 0) {
        void announceKillerCallouts(callouts);
      }
    },
  });

  const visitLimit = game ? getKillerVisitLimit(game) : 3;
  const visitFull = (game?.visitDarts.length ?? 0) >= visitLimit;

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
  const showMatchComplete = game.status === "finished" && game.winnerId != null;
  const winnerPlayer = game.players.find((player) => player.id === game.winnerId);
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";
  const dartboardHighlight = getKillerDartboardHighlight(game);

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
    throwDart(hit);
    const updatedGame = useKillerStore.getState().game;
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
    const visitDarts = [...before.visitDarts];
    unlockVoicePlayback();
    finishTurn();

    const after = useKillerStore.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceKillerAfterTurn(before, after, completedPlayerIndex, visitDarts);
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
          <KillerPlaySidebar
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
            title="Killer"
            subtitle={formatKillerProgress(game)}
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
