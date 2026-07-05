"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { CricketMatchStats } from "@/features/cricket/components/CricketMatchStats";
import { CricketScoreboard } from "@/features/cricket/components/CricketScoreboard";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { AppShell } from "@/components/layout/AppShell";

export default function CricketPlayPage() {
  const router = useRouter();
  const game = useCricketStore((state) => state.game);
  const throwDart = useCricketStore((state) => state.throwDart);
  const finishTurn = useCricketStore((state) => state.finishTurn);
  const undo = useCricketStore((state) => state.undo);

  useEffect(() => {
    if (!game) {
      router.replace("/cricket/setup");
    }
  }, [game, router]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: finishTurn,
  });

  if (!game) {
    return null;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const canUndo = game.history.length > 0;
  const visitFull = game.visitDarts.length >= DARTS_PER_VISIT;

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
  };

  const actionBar = <ActionBar {...actionBarProps} />;
  const sidebarActionBar = <ActionBar {...actionBarProps} className="py-0 pb-0" />;

  if (game.status === "finished" && game.winnerId) {
    const winner = game.players.find((player) => player.id === game.winnerId);
    return (
      <AppShell className="justify-center px-4 pb-safe-bottom">
        <GlassPanel className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Match complete
          </p>
          <h2 className="mt-3 text-4xl font-black">{winner?.name} wins</h2>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 min-h-[52px] w-full rounded-2xl bg-accent px-6 text-lg font-bold text-accent-foreground"
          >
            Back to Home
          </button>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <ScoringLayout
      swipeHandlers={swipeHandlers}
      sidebar={
        <>
          <header className="flex items-center gap-2 px-0 pb-2 pt-safe-top">
            <Link
              href="/"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-muted-foreground"
              aria-label="Go back"
            >
              ←
            </Link>
            <h1 className="min-w-0 truncate text-lg font-bold leading-tight">
              {currentPlayer
                ? `${currentPlayer.name}'s Turn to Throw!`
                : "Turn to Throw!"}
            </h1>
          </header>
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
  );
}
