"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { X01Scoreboard } from "@/features/x01/components/X01Scoreboard";
import { isX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
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
      <MobileAppShell className="pb-safe-bottom">
        <div className="flex flex-1 flex-col justify-center px-4">
          <MatchCompletePanel
          winnerName={winner?.name ?? "Player"}
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
        sidebar={
          <>
            <PlayScreenHeader
              title={currentPlayer ? `${currentPlayer.name}'s Turn!` : "Turn!"}
              subtitle={String(game.gameType)}
              onBackClick={requestExit}
            />
            <X01Scoreboard
              players={game.players}
              currentPlayerIndex={game.currentPlayerIndex}
              visitDarts={game.visitDarts}
              gameType={game.gameType}
              compact
            />
          </>
        }
      boardHeader={<BoardGameTitle title={String(game.gameType)} />}
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
    </>
  );
}
