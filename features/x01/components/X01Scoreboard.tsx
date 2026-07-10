"use client";

import { DARTS_PER_VISIT } from "@/lib/constants";
import type { X01PlayerState } from "@/types/x01";
import type { DartHit } from "@/types/dart";
import type { MatchTeamNames } from "@/types/player-setup";
import type { X01OutRule } from "@/types/x01";
import {
  calculateThreeDartAverage,
  X01_CHECKOUT_DISPLAY_MAX,
} from "@/features/x01/lib/x01-engine";
import {
  getCheckoutSuggestions,
} from "@/features/x01/lib/x01-checkout";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { getTeamName } from "@/features/players/lib/team-display";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { isBotPlayer } from "@/features/bot/lib/build-bot-x01-setup";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface X01ScoreboardProps {
  players: X01PlayerState[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  gameType: number;
  outRule: X01OutRule;
  teamsEnabled?: boolean;
  teamNames?: MatchTeamNames;
  compact?: boolean;
  fillHeight?: boolean;
}

function X01PlayerCard({
  player,
  playerIndex,
  currentPlayerIndex,
  visitDarts,
  playerCount,
  outRule,
  teamsEnabled = false,
  teamNames,
}: {
  player: X01PlayerState;
  playerIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  playerCount: number;
  outRule: X01OutRule;
  teamsEnabled?: boolean;
  teamNames?: MatchTeamNames;
}) {
  const isActive = playerIndex === currentPlayerIndex;
  const displayName = getPlayerScorecardName(player);
  const isBot = isBotPlayer(player);
  const average = calculateThreeDartAverage(player);
  const dartsAvailable = isActive
    ? Math.max(0, DARTS_PER_VISIT - visitDarts.length)
    : DARTS_PER_VISIT;
  const checkoutPath =
    player.remaining <= X01_CHECKOUT_DISPLAY_MAX && dartsAvailable > 0
      ? getCheckoutSuggestions(player.remaining, outRule, dartsAvailable)[0]
      : undefined;
  const inCheckoutRange =
    player.remaining > 0 &&
    player.remaining <= X01_CHECKOUT_DISPLAY_MAX &&
    dartsAvailable > 0;
  const lastScore = player.visitScores.at(-1);
  const lastScoreLabel = lastScore != null ? String(lastScore) : "—";
  const visitTotal = isActive
    ? visitDarts.reduce((sum, dart) => sum + dart.score, 0)
    : 0;
  const tightLayout = playerCount >= 3;
  const showCheckoutUnderScore = inCheckoutRange;

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
          isBot={isBot}
          size="sm"
        />
        <div className="x01-player-card__identity">
          {teamsEnabled && player.teamId != null ? (
            <span className="x01-player-card__team">
              {getTeamName(teamNames, player.teamId)}
            </span>
          ) : null}
          <div className="x01-player-card__name-row">
            <span className="x01-player-card__name">{displayName}</span>
            {isBot ? <span className="x01-player-card__bot-badge">Bot</span> : null}
            <span className="x01-player-card__record">
              Legs {player.legsWon} · Sets {player.setsWon}
            </span>
          </div>
        </div>
        {isActive && !tightLayout ? (
          <span className="x01-player-card__badge">Throwing</span>
        ) : null}
      </div>

      <div className="x01-player-card__score-row">
        <div className="x01-player-card__side-stat x01-player-card__side-stat--left">
          <div className="x01-player-card__inline-stat">
            <span className="x01-player-card__side-stat-label">Avg</span>
            <span className="x01-player-card__side-stat-value">
              {average > 0 ? average.toFixed(1) : "—"}
            </span>
          </div>
        </div>

        <div className="x01-player-card__score-block">
          {!tightLayout ? (
            <span className="x01-player-card__score-label">Remaining</span>
          ) : null}
          <p className="x01-player-card__score">{player.remaining}</p>
          {showCheckoutUnderScore ? (
            checkoutPath ? (
              <div className="x01-player-card__darts x01-player-card__darts--checkout" aria-label="Checkout path">
                {checkoutPath.map((dart, index) => (
                  <span
                    key={`${dart}-${index}`}
                    className="x01-player-card__dart x01-player-card__dart--checkout"
                  >
                    {dart}
                  </span>
                ))}
              </div>
            ) : (
              <span className="x01-player-card__no-finish x01-player-card__no-finish--under-score">
                No Finish
              </span>
            )
          ) : null}
        </div>

        <div className="x01-player-card__side-stat x01-player-card__side-stat--right">
          <div className="x01-player-card__inline-stat">
            {isActive && visitDarts.length > 0 ? (
              <>
                <span className="x01-player-card__side-stat-label">Visit</span>
                <span className="x01-player-card__side-stat-value">{visitTotal}</span>
              </>
            ) : (
              <>
                <span className="x01-player-card__side-stat-label">Last</span>
                <span className="x01-player-card__side-stat-value">{lastScoreLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isActive ? (
        <div className="x01-player-card__darts" aria-label="Current visit darts">
          {Array.from({ length: DARTS_PER_VISIT }, (_, index) => {
            const dart = visitDarts[index];
            const isLatest = dart != null && index === visitDarts.length - 1;

            return (
              <span
                key={index}
                className={cn(
                  "x01-player-card__dart",
                  dart && "x01-player-card__dart--filled",
                  isLatest && "x01-player-card__dart--latest",
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

export function X01Scoreboard({
  players,
  currentPlayerIndex,
  visitDarts,
  gameType: _gameType,
  outRule,
  teamsEnabled = false,
  teamNames,
  compact = false,
  fillHeight = false,
}: X01ScoreboardProps) {
  const playerCount = Math.min(players.length, 4);

  return (
    <div
      className={cn(
        "x01-player-cards",
        compact && "x01-player-cards--compact",
        fillHeight && "x01-player-cards--fill",
        fillHeight && playerCount > 0 && `x01-player-cards--players-${playerCount}`,
        compact ? "px-0" : "px-4 pb-2",
      )}
    >
      {players.map((player, index) => (
        <X01PlayerCard
          key={player.id}
          player={player}
          playerIndex={index}
          currentPlayerIndex={currentPlayerIndex}
          visitDarts={visitDarts}
          playerCount={playerCount}
          outRule={outRule}
          teamsEnabled={teamsEnabled}
          teamNames={teamNames}
        />
      ))}
    </div>
  );
}
