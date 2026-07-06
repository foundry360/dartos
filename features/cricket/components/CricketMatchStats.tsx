"use client";

import type { CricketGameState } from "@/types/cricket";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { computeCricketMatchStatsFromGame } from "@/features/cricket/lib/cricket-stats";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface CricketMatchStatsProps {
  game: Pick<
    CricketGameState,
    "players" | "currentPlayerIndex" | "history" | "visitDarts" | "variant"
  >;
  compact?: boolean;
  tight?: boolean;
}

export function CricketMatchStats({ game, compact = false, tight = false }: CricketMatchStatsProps) {
  const stats = computeCricketMatchStatsFromGame(game);
  const playerIndices = [game.currentPlayerIndex];

  return (
    <div
      className={cn(
        "match-stats-accordion",
        compact ? "px-0" : "px-4",
        tight && "match-stats-accordion--tight",
      )}
    >
      {playerIndices.map((index) => {
        const player = game.players[index];
        const playerStats = stats[index];
        const isActive = index === game.currentPlayerIndex;

        if (!player || !playerStats) {
          return null;
        }

        const displayName = getPlayerScorecardName(player);

        return (
          <div
            key={player.id}
            className={cn(
              "match-stats-accordion__item scorecard-panel",
              isActive && ACTIVE_PLAYER_HIGHLIGHT_CLASS,
            )}
          >
            <div
              className={cn(
                "match-stats-accordion__header",
                tight && "match-stats-accordion__header--tight",
              )}
            >
              <div className="match-stats-accordion__identity">
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarUrl={player.avatarUrl}
                  isGuest={player.isGuest}
                  size={compact ? "sm" : "md"}
                />
                <span className="match-stats-accordion__name">{displayName}</span>
              </div>

              <div className="match-stats-accordion__metrics">
                <div className="match-stats-accordion__metric">
                  <span className="match-stats-accordion__metric-label">MPR</span>
                  <span className="match-stats-accordion__metric-value">
                    {playerStats.mpr.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
