"use client";

import type { CricketGameState } from "@/types/cricket";
import {
  ACTIVE_PLAYER_PANEL_CLASS,
  activePlayerPanelStyle,
} from "@/features/cricket/lib/player-panel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { computeCricketMatchStatsFromGame } from "@/features/cricket/lib/cricket-stats";
import { cn } from "@/utils/cn";

interface CricketMatchStatsProps {
  game: Pick<CricketGameState, "players" | "currentPlayerIndex" | "history" | "visitDarts">;
  compact?: boolean;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function CricketMatchStats({ game, compact = false }: CricketMatchStatsProps) {
  const stats = computeCricketMatchStatsFromGame(game);

  return (
    <div
      className={cn(
        "grid w-full grid-cols-2 gap-x-4 gap-y-3",
        compact ? "px-0" : "px-4",
      )}
    >
      {game.players.map((player, index) => {
        const playerStats = stats[index];
        const isActive = index === game.currentPlayerIndex;

        if (!playerStats) {
          return null;
        }

        return (
          <GlassPanel
            key={player.id}
            className={cn(
              "scorecard-panel min-w-0",
              compact ? "p-3" : "p-4",
              isActive && ACTIVE_PLAYER_PANEL_CLASS,
            )}
            style={activePlayerPanelStyle(player.color, isActive)}
          >
            <span className="truncate font-bold">{player.name}</span>

            <div className="mt-3 space-y-1.5">
              <StatRow label="Darts" value={String(playerStats.dartsThrown)} />
              <StatRow label="Marks" value={String(playerStats.marks)} />
              <StatRow label="MPR" value={playerStats.mpr.toFixed(2)} />
              <StatRow
                label="3x / 2x"
                value={`${playerStats.triples} / ${playerStats.doubles}`}
              />
              <StatRow label="Misses" value={String(playerStats.misses)} />
              <StatRow
                label="Closed"
                value={`${playerStats.segmentsClosed}/7`}
              />
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
