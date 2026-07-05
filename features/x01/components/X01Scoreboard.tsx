"use client";

import type { X01PlayerState } from "@/types/x01";
import type { DartHit } from "@/types/dart";
import {
  calculateThreeDartAverage,
  getCheckoutSuggestions,
  getLastVisitScore,
} from "@/features/x01/lib/x01-engine";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/utils/cn";

interface X01ScoreboardProps {
  players: X01PlayerState[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  gameType: number;
  compact?: boolean;
}

export function X01Scoreboard({
  players,
  currentPlayerIndex,
  visitDarts,
  gameType,
  compact = false,
}: X01ScoreboardProps) {
  const currentPlayer = players[currentPlayerIndex];
  const lastVisit = getLastVisitScore(visitDarts);
  const average = currentPlayer ? calculateThreeDartAverage(currentPlayer) : 0;
  const checkoutPaths = currentPlayer
    ? getCheckoutSuggestions(currentPlayer.remaining)
    : [];

  return (
    <div className={cn("space-y-2", compact ? "px-0" : "space-y-4 px-4")}>
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {players.map((player, index) => {
            const isActive = index === currentPlayerIndex;

            return (
              <GlassPanel
                key={player.id}
                className={cn(
                  compact ? "min-w-[100px] p-3" : "min-w-[120px] flex-1",
                  isActive && "ring-2 ring-accent shadow-glow",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="truncate font-bold">{player.name}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Legs {player.legsWon}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </div>

      {currentPlayer ? (
        <GlassPanel className={cn("text-center", compact && "p-3")}>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {currentPlayer.name} · {gameType}
          </p>
          <p
            className={cn(
              "mt-1 font-black tabular-nums tracking-tight",
              compact ? "text-5xl" : "mt-2 text-7xl",
            )}
          >
            {currentPlayer.remaining}
          </p>
          <div className={cn("grid grid-cols-3 gap-2 text-sm", compact ? "mt-2" : "mt-4 gap-3")}>
            <Stat label="Last visit" value={String(lastVisit)} />
            <Stat label="3-dart avg" value={average.toFixed(2)} />
            <Stat
              label="Darts"
              value={`${visitDarts.length}/3`}
            />
          </div>
          {checkoutPaths.length > 0 ? (
            <div className={cn("rounded-2xl bg-accent/10 px-3 py-2", compact ? "mt-2" : "mt-4 px-4 py-3")}>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Checkout
              </p>
              <p className="mt-1 text-lg font-bold">
                {checkoutPaths[0]?.join(" · ") ?? ""}
              </p>
            </div>
          ) : null}
        </GlassPanel>
      ) : null}

      {visitDarts.length > 0 ? (
        <div className="flex justify-center gap-2">
          {visitDarts.map((dart, index) => (
            <span
              key={`${dart.label}-${index}`}
              className="rounded-2xl bg-surface-elevated px-4 py-2 text-lg font-bold"
            >
              {dart.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
