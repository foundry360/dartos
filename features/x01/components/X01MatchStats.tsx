"use client";

import type { X01GameState } from "@/types/x01";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { computeX01MatchStatsFromGame } from "@/features/x01/lib/x01-stats";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { isBotPlayer } from "@/features/bot/lib/build-bot-x01-setup";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface X01MatchStatsProps {
  game: Pick<X01GameState, "players" | "currentPlayerIndex" | "history">;
  compact?: boolean;
  tight?: boolean;
}

export function X01MatchStats({ game, compact = false, tight = false }: X01MatchStatsProps) {
  const stats = computeX01MatchStatsFromGame(game);
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
                  isBot={isBotPlayer(player)}
                  size={compact ? "sm" : "md"}
                />
                <span className="match-stats-accordion__name">{displayName}</span>
              </div>

              <div className="match-stats-accordion__metrics">
                <div className="match-stats-accordion__metric">
                  <span className="match-stats-accordion__metric-label">Avg</span>
                  <span className="match-stats-accordion__metric-value">
                    {playerStats.threeDartAverage.toFixed(2)}
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
