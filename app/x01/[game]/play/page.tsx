"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { MatchAnalyticsButton } from "@/components/play/MatchAnalyticsButton";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { X01PlaySidebar } from "@/features/x01/components/X01PlaySidebar";
import { X01PlayerStatsSlidePanel } from "@/features/x01/components/X01PlayerStatsSlidePanel";
import { computeX01MatchStatsFromGame } from "@/features/x01/lib/x01-stats";
import { formatX01MatchProgress } from "@/features/x01/lib/match-format";
import { finishX01Turn, isX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { announcePlayerTurn } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { getTeamName } from "@/features/players/lib/team-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useResumeActiveMatchFromCloud } from "@/features/match-play/hooks/useResumeActiveMatchFromCloud";

export default function X01PlayPage() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const gameParam = params.game;
  const game = useX01Store((state) => state.game);
  const throwDart = useX01Store((state) => state.throwDart);
  const nextPlayer = useX01Store((state) => state.nextPlayer);
  const undo = useX01Store((state) => state.undo);
  const reset = useX01Store((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({ onReset: reset });
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const { ready: resumeReady } = useResumeActiveMatchFromCloud({
    gameMode: "x01",
    x01GameType: isX01GameType(gameParam) ? gameParam : undefined,
  });

  useEffect(() => {
    if (!resumeReady || game) {
      return;
    }

    router.replace(APP_HOME_PATH);
  }, [game, resumeReady, router]);

  useMatchFullscreen(Boolean(game));

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const handleDartHit = (hit: DartHit) => {
    throwDart(hit);
    const updatedGame = useX01Store.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) => getX01VisitEffectiveScore(activeGame, activeGame.visitDarts.length),
    );
  };

  const handleFinishTurn = () => {
    const activeGame = useX01Store.getState().game;
    if (!activeGame || activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const audio = getMatchAudioPreferences();
    const nextGame = finishX01Turn(activeGame);

    if (audio.voice && nextGame.status === "playing") {
      const nextPlayer = nextGame.players[nextGame.currentPlayerIndex];
      if (nextPlayer) {
        announcePlayerTurn(getPlayerScorecardName(nextPlayer));
      }
    }

    nextPlayer();
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull) {
        handleFinishTurn();
      }
    },
  });

  if (!resumeReady || !game) {
    return null;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const matchStats = computeX01MatchStatsFromGame(game);
  const canUndo = game.history.length > 0;

  const throwMiss = () => {
    if (visitFull) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled: visitFull,
    onUndo: undo,
    onPrimary: handleFinishTurn,
    primaryLabel: "Finish Turn" as const,
    undoDisabled: !canUndo,
    primaryDisabled: !visitFull,
  };

  if (game.status === "finished" && game.winnerId) {
    const winner = game.players.find((player) => player.id === game.winnerId);
    const winnerLabel =
      game.teamsEnabled && winner?.teamId != null
        ? `${getTeamName(game.teamNames, winner.teamId)} (${getPlayerScorecardName(winner)})`
        : winner
          ? getPlayerScorecardName(winner)
          : "Player";

    return (
      <MobileAppShell className="pb-safe-bottom">
        <div className="flex flex-1 flex-col justify-center px-4">
          <MatchCompletePanel winnerName={winnerLabel} onHome={() => router.push(APP_HOME_PATH)} />
        </div>
      </MobileAppShell>
    );
  }

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        mainToolbar={<MatchAnalyticsButton onClick={() => setStatsPanelOpen(true)} />}
        sidebar={
          <X01PlaySidebar
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
            title={String(game.gameType)}
            subtitle={formatX01MatchProgress(game.players)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={visitFull}
            showMissButton={false}
          />
        }
      />
      <X01PlayerStatsSlidePanel
        open={statsPanelOpen}
        game={game}
        stats={matchStats}
        focusPlayerId={currentPlayer?.id ?? null}
        onClose={() => setStatsPanelOpen(false)}
      />
    </>
  );
}
