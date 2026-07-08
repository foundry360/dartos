"use client";

import { DARTS_PER_VISIT } from "@/lib/constants";
import type { Checkout121GameState, Checkout121OutRule, Checkout121PlayerState } from "@/types/checkout-121";
import type { DartHit } from "@/types/dart";
import {
  getCheckout121DartsRemainingInAttempt,
} from "@/features/classic-games/lib/checkout-121-engine";
import {
  getCheckoutSuggestions,
  X01_CHECKOUT_DISPLAY_MAX,
} from "@/features/x01/lib/x01-checkout";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface Checkout121ScoreboardProps {
  game: Checkout121GameState;
  compact?: boolean;
  fillHeight?: boolean;
}

function Checkout121PlayerCard({
  player,
  playerIndex,
  currentPlayerIndex,
  visitDarts,
  playerCount,
  outRule,
  dartsRemainingInAttempt,
}: {
  player: Checkout121PlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  playerCount: number;
  outRule: Checkout121OutRule;
  dartsRemainingInAttempt: number;
}) {
  const isActive = playerIndex === currentPlayerIndex;
  const displayName = getPlayerScorecardName(player);
  const dartsAvailable = isActive
    ? Math.max(0, Math.min(DARTS_PER_VISIT - visitDarts.length, dartsRemainingInAttempt))
    : 0;
  const checkoutPath =
    isActive &&
    player.remaining <= X01_CHECKOUT_DISPLAY_MAX &&
    dartsAvailable > 0
      ? getCheckoutSuggestions(player.remaining, outRule, dartsAvailable)[0]
      : undefined;
  const inCheckoutRange =
    isActive &&
    player.remaining > 0 &&
    player.remaining <= X01_CHECKOUT_DISPLAY_MAX &&
    dartsAvailable > 0;
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
            <span className="x01-player-card__record">Target {player.currentTarget}</span>
          </div>
        </div>
        {isActive && !tightLayout ? (
          <span className="x01-player-card__badge">Throwing</span>
        ) : null}
      </div>

      <div className="x01-player-card__score-row">
        <div className="x01-player-card__side-stat x01-player-card__side-stat--left">
          <div className="x01-player-card__inline-stat">
            <span className="x01-player-card__side-stat-label">Done</span>
            <span className="x01-player-card__side-stat-value">
              {player.checkoutsCompleted}
            </span>
          </div>
        </div>

        <div className="x01-player-card__score-block">
          {!tightLayout ? (
            <span className="x01-player-card__score-label">Remaining</span>
          ) : null}
          <p className="x01-player-card__score">{player.remaining}</p>
          {inCheckoutRange && checkoutPath?.length ? (
            <p className="x01-player-card__checkout-path">{checkoutPath.join(" · ")}</p>
          ) : null}
        </div>

        <div className="x01-player-card__side-stat x01-player-card__side-stat--right">
          {isActive ? (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Darts</span>
              <span className="x01-player-card__side-stat-value">{dartsRemainingInAttempt}</span>
            </div>
          ) : (
            <div className="x01-player-card__inline-stat">
              <span className="x01-player-card__side-stat-label">Target</span>
              <span className="x01-player-card__side-stat-value">{player.currentTarget}</span>
            </div>
          )}
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

export function Checkout121Scoreboard({
  game,
  compact = false,
  fillHeight = false,
}: Checkout121ScoreboardProps) {
  const playerCount = game.players.length;
  const dartsRemainingInAttempt = getCheckout121DartsRemainingInAttempt(game);

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
        <Checkout121PlayerCard
          key={player.id}
          player={player}
          playerIndex={index}
          currentPlayerIndex={game.currentPlayerIndex}
          visitDarts={game.visitDarts}
          playerCount={playerCount}
          outRule={game.outRule}
          dartsRemainingInAttempt={dartsRemainingInAttempt}
        />
      ))}
    </div>
  );
}
