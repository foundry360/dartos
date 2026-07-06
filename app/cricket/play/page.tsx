"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { CricketMatchAnalyticsButton } from "@/features/cricket/components/CricketMatchAnalyticsButton";
import { CricketMatchStats } from "@/features/cricket/components/CricketMatchStats";
import { CricketPlayerStatsSlidePanel } from "@/features/cricket/components/CricketPlayerStatsSlidePanel";
import { computeCricketMatchStatsFromGame } from "@/features/cricket/lib/cricket-stats";
import { CricketScoreboard } from "@/features/cricket/components/CricketScoreboard";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import {
  formatCricketMatchResultLines,
  formatCricketWinnerLabel,
} from "@/features/cricket/lib/team-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { MobileAppShell } from "@/components/layout/MobileAppShell";

export default function CricketPlayPage() {
  const router = useRouter();
  const game = useCricketStore((state) => state.game);
  const throwDart = useCricketStore((state) => state.throwDart);
  const finishTurn = useCricketStore((state) => state.finishTurn);
  const undo = useCricketStore((state) => state.undo);
  const reset = useCricketStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({ onReset: reset });
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);

  useEffect(() => {
    if (!game) {
      router.replace("/cricket/setup");
    }
  }, [game, router]);

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
  const matchStats = computeCricketMatchStatsFromGame(game);
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
    onPrimary: finishTurn,
    primaryLabel: "Finish Turn" as const,
    undoDisabled: !canUndo,
    primaryDisabled: !visitFull,
  };

  const actionBar = <ActionBar {...actionBarProps} />;
  const sidebarActionBar = <ActionBar {...actionBarProps} className="py-0 pb-0" />;

  if (game.status === "finished" && game.winnerId) {
    return (
      <MobileAppShell className="pb-safe-bottom">
        <div className="flex flex-1 flex-col justify-center px-4">
          <MatchCompletePanel
          winnerName={formatCricketWinnerLabel(game)}
          summary={
            <>
              {formatCricketMatchResultLines(game.players, game.teamsEnabled).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          }
          onHome={() => router.push(APP_HOME_PATH)}
        />
        </div>
      </MobileAppShell>
    );
  }

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        mainToolbar={
          <CricketMatchAnalyticsButton onClick={() => setStatsPanelOpen(true)} />
        }
        sidebar={
          <>
            <PlayScreenHeader
              title={
                currentPlayer
                  ? `${getPlayerScorecardName(currentPlayer)}'s Turn!`
                  : "Turn!"
              }
              onBackClick={requestExit}
            />
          <div className="flex flex-col gap-2">
            <CricketScoreboard
              players={game.players}
              currentPlayerIndex={game.currentPlayerIndex}
              variant={game.variant}
              teamsEnabled={game.teamsEnabled}
              compact
            />
            <div className="hidden landscape:block">{sidebarActionBar}</div>
            <CricketMatchStats game={game} compact />
          </div>
        </>
      }
      boardHeader={
        <BoardGameTitle
          title={formatCricketVariantLabel(game.variant ?? "classic")}
          subtitle={formatCricketMatchProgress(game.players)}
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
      actions={<div className="landscape:hidden">{actionBar}</div>}
      />
      <CricketPlayerStatsSlidePanel
        open={statsPanelOpen}
        game={game}
        stats={matchStats}
        focusPlayerId={currentPlayer?.id ?? null}
        onClose={() => setStatsPanelOpen(false)}
      />
    </>
  );
}
