"use client";

import { CRICKET_TARGETS } from "@/lib/constants";
import type { CricketPlayerState } from "@/types/cricket";
import { formatCricketMark } from "@/features/cricket/lib/cricket-engine";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/utils/cn";

interface CricketScoreboardProps {
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  compact?: boolean;
}

export function CricketScoreboard({
  players,
  currentPlayerIndex,
  compact = false,
}: CricketScoreboardProps) {
  return (
    <div className={cn("overflow-x-auto pb-2", compact ? "px-2" : "px-4")}>
      <div className="flex min-w-max gap-2">
        {players.map((player, index) => {
          const isActive = index === currentPlayerIndex;

          return (
            <GlassPanel
              key={player.id}
              className={cn(
                compact ? "min-w-[120px] p-3" : "min-w-[140px] flex-1",
                "transition-all",
                isActive && "ring-2 ring-accent shadow-glow",
              )}
            >
              <div className={cn("flex items-center gap-2", compact ? "mb-2" : "mb-3")}>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className={cn("truncate font-bold", compact ? "text-base" : "text-lg")}>
                  {player.name}
                </span>
              </div>
              <div
                className={cn(
                  "font-black tabular-nums",
                  compact ? "mb-2 text-2xl" : "mb-3 text-3xl",
                )}
              >
                {player.score}
              </div>
              <div className="space-y-1">
                {CRICKET_TARGETS.map((target) => (
                  <div
                    key={String(target)}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span className="font-semibold text-foreground">
                      {target === "bull" ? "Bull" : target}
                    </span>
                    <span className="min-w-[24px] text-right font-bold text-accent">
                      {formatCricketMark(player.marks[target])}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
