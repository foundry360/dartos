"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { CricketMatchStats } from "@/features/cricket/components/CricketMatchStats";
import { CricketScoreboard } from "@/features/cricket/components/CricketScoreboard";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { AppShell } from "@/components/layout/AppShell";

export default function CricketPlayPage() {
  const router = useRouter();
  const game = useCricketStore((state) => state.game);
  const throwDart = useCricketStore((state) => state.throwDart);
  const finishTurn = useCricketStore((state) => state.finishTurn);
  const undo = useCricketStore((state) => state.undo);
  const reset = useCricketStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({ onReset: reset });

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
    const winner = game.players.find((player) => player.id === game.winnerId);

    return (
      <AppShell className="justify-center px-4 pb-safe-bottom">
        <MatchCompletePanel
          winnerName={winner?.name ?? "Player"}
          summary={
            <>
              {game.players.map((player) => (
                <p key={player.id}>
                  {player.name}: {player.setsWon} set{player.setsWon === 1 ? "" : "s"}
                </p>
              ))}
            </>
          }
          onHome={() => router.push(APP_HOME_PATH)}
        />
      </AppShell>
    );
  }

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        sidebar={
          <>
            <PlayScreenHeader
              title={currentPlayer ? `${currentPlayer.name}'s Turn!` : "Turn!"}
              subtitle={formatCricketMatchProgress(game.players)}
              onBackClick={requestExit}
            />
          <div className="flex flex-col gap-2">
            <CricketScoreboard
              players={game.players}
              currentPlayerIndex={game.currentPlayerIndex}
              compact
            />
            <div className="hidden landscape:block">{sidebarActionBar}</div>
            <CricketMatchStats game={game} compact />
          </div>
        </>
      }
      boardHeader={<BoardGameTitle title="Cricket" />}
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
    </>
  );
}
