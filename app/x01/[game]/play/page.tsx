"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
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
import { isX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { getTeamName } from "@/features/players/lib/team-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function X01PlayPage() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const game = useX01Store((state) => state.game);
  const throwDart = useX01Store((state) => state.throwDart);
  const nextPlayer = useX01Store((state) => state.nextPlayer);
  const undo = useX01Store((state) => state.undo);
  const reset = useX01Store((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({ onReset: reset });
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);

  useEffect(() => {
    if (!game) {
      const gameParam = params.game;
      if (isX01GameType(gameParam)) {
        router.replace(`/x01/${gameParam}/setup`);
      } else {
        router.replace(APP_HOME_PATH);
      }
    }
  }, [game, params.game, router]);

  useMatchFullscreen(Boolean(game));

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull) {
        nextPlayer();
      }
    },
  });

  if (!game) {
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
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled: visitFull,
    onUndo: undo,
    onPrimary: nextPlayer,
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
            onHit={throwDart}
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
