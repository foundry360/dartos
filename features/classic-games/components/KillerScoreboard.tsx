"use client";

import { DARTS_PER_VISIT } from "@/lib/constants";
import { formatKillerAssignedNumber } from "@/features/classic-games/lib/killer-config";
import { getKillerVisitLimit } from "@/features/classic-games/lib/killer-engine";
import type { KillerGameState, KillerPlayerState } from "@/types/killer";
import type { DartHit } from "@/types/dart";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface KillerScoreboardProps {
  game: KillerGameState;
  compact?: boolean;
  fillHeight?: boolean;
}

function formatLastVisitDelta(delta: number | null, eliminated: boolean): string {
  if (eliminated) {
    return "Out";
  }

  if (delta == null || delta === 0) {
    return "";
  }

  return delta > 0 ? `+${delta}` : String(delta);
}

function KillerPlayerCard({
  player,
  playerIndex,
  currentPlayerIndex,
  visitDarts,
  playerCount,
  visitLimit,
}: {
  player: KillerPlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  playerCount: number;
  visitLimit: number;
}) {
  const isActive = playerIndex === currentPlayerIndex && !player.eliminated;
  const displayName = getPlayerScorecardName(player);
  const tightLayout = playerCount >= 3;
  const targetLabel =
    player.assignedNumber != null
      ? formatKillerAssignedNumber(player.assignedNumber)
      : "—";

  return (
    <article
      className={cn(
        "x01-player-card scorecard-panel",
        player.eliminated && "x01-player-card--idle opacity-50",
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
              {player.eliminated
                ? "Eliminated"
                : player.isKiller
                  ? "Killer"
                  : `Target ${targetLabel}`}
            </span>
          </div>
        </div>
        {isActive && !tightLayout ? (
          <span className="x01-player-card__badge">Throwing</span>
        ) : null}
      </div>

      <div className="x01-player-card__score-row">
        <div className="x01-player-card__side-stat x01-player-card__side-stat--left">
          {!isActive ? (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Target</span>
              <span className="x01-player-card__side-stat-value">{targetLabel}</span>
            </div>
          ) : null}
        </div>

        <div className="x01-player-card__score-block">
          {!tightLayout ? (
            <span className="x01-player-card__score-label">Lives</span>
          ) : null}
          <p className="x01-player-card__score">{player.lives}</p>
        </div>

        <div className="x01-player-card__side-stat x01-player-card__side-stat--right">
          {!isActive && player.lastVisitDelta != null ? (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Last</span>
              <span className="x01-player-card__side-stat-value">
                {formatLastVisitDelta(player.lastVisitDelta, player.eliminated)}
              </span>
            </div>
          ) : isActive ? (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Darts</span>
              <span className="x01-player-card__side-stat-value">
                {visitLimit - visitDarts.length}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {isActive ? (
        <div className="x01-player-card__darts" aria-label="Current visit darts">
          {Array.from({ length: DARTS_PER_VISIT }, (_, index) => {
            const dart = visitDarts[index];
            const visible = index < visitLimit;
            return (
              <span
                key={index}
                className={cn(
                  "x01-player-card__dart",
                  !visible && "opacity-30",
                  dart && "x01-player-card__dart--filled",
                )}
              >
                {visible ? (dart?.label ?? "—") : ""}
              </span>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export function KillerScoreboard({
  game,
  compact = false,
  fillHeight = false,
}: KillerScoreboardProps) {
  const playerCount = game.players.length;
  const visitLimit = getKillerVisitLimit(game);

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
        <KillerPlayerCard
          key={player.id}
          player={player}
          playerIndex={index}
          currentPlayerIndex={game.currentPlayerIndex}
          visitDarts={game.visitDarts}
          playerCount={playerCount}
          visitLimit={visitLimit}
        />
      ))}
    </div>
  );
}
