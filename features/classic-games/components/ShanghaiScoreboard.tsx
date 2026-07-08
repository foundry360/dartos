"use client";

import { DARTS_PER_VISIT } from "@/lib/constants";
import type { ShanghaiGameState, ShanghaiPlayerState } from "@/types/shanghai";
import type { DartHit } from "@/types/dart";
import { getShanghaiCurrentTarget } from "@/features/classic-games/lib/shanghai-engine";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface ShanghaiScoreboardProps {
  game: ShanghaiGameState;
  compact?: boolean;
  fillHeight?: boolean;
}

function ShanghaiPlayerCard({
  player,
  playerIndex,
  currentPlayerIndex,
  visitDarts,
  playerCount,
  currentTargetLabel,
}: {
  player: ShanghaiPlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  playerCount: number;
  currentTargetLabel: string;
}) {
  const isActive = playerIndex === currentPlayerIndex;
  const displayName = getPlayerScorecardName(player);
  const tightLayout = playerCount >= 3;

  return (
    <article
      className={cn(
        "x01-player-card scorecard-panel",
        isActive
          ? cn("x01-player-card--active", ACTIVE_PLAYER_HIGHLIGHT_CLASS)
          : "x01-player-card--idle",
      )}
    >
      <div className="x01-player-card__header">
        <PlayerAvatar
          name={player.name}
          color={player.color}
          avatarUrl={player.avatarUrl}
          isGuest={player.isGuest && !player.avatarUrl}
          size="sm"
        />
        <div className="x01-player-card__identity">
          <div className="x01-player-card__name-row">
            <span className="x01-player-card__name">{displayName}</span>
            <span className="x01-player-card__record">
              {isActive
                ? `Target ${currentTargetLabel}`
                : player.lastVisitShanghai
                  ? "Shanghai!"
                  : ""}
            </span>
          </div>
        </div>
        {isActive && !tightLayout ? (
          <span className="x01-player-card__badge">Throwing</span>
        ) : null}
      </div>

      <div className="x01-player-card__score-row">
        <div className="x01-player-card__side-stat x01-player-card__side-stat--left">
          {!isActive && player.lastVisitPoints != null ? (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Last</span>
              <span className="x01-player-card__side-stat-value">
                {player.lastVisitShanghai ? "Shanghai" : `+${player.lastVisitPoints}`}
              </span>
            </div>
          ) : null}
        </div>

        <div className="x01-player-card__score-block">
          {!tightLayout ? (
            <span className="x01-player-card__score-label">Score</span>
          ) : null}
          <p className="x01-player-card__score">{player.score}</p>
        </div>

        <div className="x01-player-card__side-stat x01-player-card__side-stat--right">
          {isActive ? (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Darts</span>
              <span className="x01-player-card__side-stat-value">
                {DARTS_PER_VISIT - visitDarts.length}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {isActive ? (
        <div className="x01-player-card__darts" aria-label="Current visit darts">
          {Array.from({ length: DARTS_PER_VISIT }, (_, index) => {
            const dart = visitDarts[index];
            return (
              <span
                key={index}
                className={cn(
                  "x01-player-card__dart",
                  dart && "x01-player-card__dart--filled",
                )}
              >
                {dart?.label ?? "—"}
              </span>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export function ShanghaiScoreboard({
  game,
  compact = false,
  fillHeight = false,
}: ShanghaiScoreboardProps) {
  const playerCount = game.players.length;
  const currentTarget = getShanghaiCurrentTarget(game);
  const currentTargetLabel = currentTarget?.label ?? "—";

  return (
    <div
      className={cn(
        "x01-player-cards w-full",
        compact && "x01-player-cards--compact",
        fillHeight && "x01-player-cards--fill",
        fillHeight && playerCount <= 4 && `x01-player-cards--players-${playerCount}`,
      )}
    >
      {game.players.map((player, index) => (
        <ShanghaiPlayerCard
          key={player.id}
          player={player}
          playerIndex={index}
          currentPlayerIndex={game.currentPlayerIndex}
          visitDarts={game.visitDarts}
          playerCount={playerCount}
          currentTargetLabel={currentTargetLabel}
        />
      ))}
    </div>
  );
}
