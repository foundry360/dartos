"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { AppShell } from "@/components/layout/AppShell";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { X01Scoreboard } from "@/features/x01/components/X01Scoreboard";
import { isX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function X01PlayPage() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const game = useX01Store((state) => state.game);
  const throwDart = useX01Store((state) => state.throwDart);
  const nextPlayer = useX01Store((state) => state.nextPlayer);
  const undo = useX01Store((state) => state.undo);

  useEffect(() => {
    if (!game) {
      const gameParam = params.game;
      if (isX01GameType(gameParam)) {
        router.replace(`/x01/${gameParam}/setup`);
      } else {
        router.replace("/");
      }
    }
  }, [game, params.game, router]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: nextPlayer,
  });

  if (!game) {
    return null;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const canUndo = game.history.length > 0;
  const visitFull = game.visitDarts.length >= DARTS_PER_VISIT;

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
          <header className="flex items-center gap-3 px-3 pb-2 pt-safe-top">
            <Link
              href="/"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-muted-foreground"
              aria-label="Go back"
            >
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">{game.gameType}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {currentPlayer ? `${currentPlayer.name}'s turn` : "In progress"}
              </p>
            </div>
          </header>
          <X01Scoreboard
            players={game.players}
            currentPlayerIndex={game.currentPlayerIndex}
            visitDarts={game.visitDarts}
            gameType={game.gameType}
            compact
          />
        </>
      }
      board={
        <Dartboard
          onHit={throwDart}
          recentHits={game.visitDarts}
          disabled={visitFull}
        />
      }
      actions={
        <ActionBar
          onUndo={undo}
          onPrimary={nextPlayer}
          primaryLabel="Next Player"
          undoDisabled={!canUndo}
          primaryDisabled={game.visitDarts.length === 0}
        />
      }
    />
  );
}
