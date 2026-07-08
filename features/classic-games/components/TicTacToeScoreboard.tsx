"use client";

import { getPlayerScorecardName } from "@/lib/player-display";
import { getTicTacToeWinningLine } from "@/features/classic-games/lib/tic-tac-toe-engine";
import type { TicTacToeGameState } from "@/types/tic-tac-toe";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { cn } from "@/utils/cn";

interface TicTacToeScoreboardProps {
  game: TicTacToeGameState;
  compact?: boolean;
  fillHeight?: boolean;
}

export function TicTacToeScoreboard({
  game,
  compact = false,
  fillHeight = false,
}: TicTacToeScoreboardProps) {
  const winningLine = getTicTacToeWinningLine(game);
  const winningSet = new Set(winningLine ?? []);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-3",
        fillHeight && "h-full",
        compact && "gap-2",
      )}
    >
      <div className="grid grid-cols-2 gap-2 px-3">
        {game.players.map((player, index) => (
          <article
            key={player.id}
            className={cn(
              "scorecard-panel rounded-xl px-3 py-2",
              index === game.currentPlayerIndex &&
                game.status === "playing" &&
                "ring-2 ring-[var(--primary)]",
            )}
          >
            <div className="flex items-center gap-2">
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarUrl={player.avatarUrl}
                isGuest={player.isGuest && !player.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {getPlayerScorecardName(player)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.symbol}
                  {game.gamesToWin > 1 ? ` · ${player.gamesWon} won` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "text-xl font-bold",
                  player.symbol === "X" ? "text-[var(--primary)]" : "text-sky-400",
                )}
              >
                {player.symbol}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center px-3 pb-2">
        <div className="grid w-full max-w-[18rem] grid-cols-3 gap-2">
          {game.cells.map((cell, index) => {
            const isWinner = winningSet.has(index);

            return (
              <div
                key={`${cell.row}-${cell.col}-${cell.segment}`}
                className={cn(
                  "tic-tac-toe-cell aspect-square rounded-xl border border-white/10 bg-black/20",
                  "flex flex-col items-center justify-center gap-1",
                  isWinner && "border-[var(--primary)] bg-[var(--primary)]/15",
                )}
              >
                <span className="text-xs text-muted-foreground">T{cell.segment}</span>
                <span
                  className={cn(
                    "text-2xl font-bold leading-none",
                    cell.owner === "X" && "text-[var(--primary)]",
                    cell.owner === "O" && "text-sky-400",
                    !cell.owner && "text-transparent",
                  )}
                >
                  {cell.owner ?? "·"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
