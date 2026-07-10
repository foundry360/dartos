"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { X01GameState } from "@/types/x01";
import type { X01PlayerMatchStats } from "@/features/x01/lib/x01-stats";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { getTeamName } from "@/features/players/lib/team-display";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { isBotPlayer } from "@/features/bot/lib/build-bot-x01-setup";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface X01PlayerStatsSlidePanelProps {
  open: boolean;
  game: Pick<X01GameState, "players" | "currentPlayerIndex" | "teamsEnabled" | "teamNames">;
  stats: X01PlayerMatchStats[];
  focusPlayerId: string | null;
  onClose: () => void;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="player-stats-slide__row">
      <span className="player-stats-slide__label">{label}</span>
      <span className="player-stats-slide__value">{value}</span>
    </div>
  );
}

function AccordionChevron({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "player-stats-slide__chevron",
        open && "player-stats-slide__chevron--open",
      )}
      aria-hidden
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export function X01PlayerStatsSlidePanel({
  open,
  game,
  stats,
  focusPlayerId,
  onClose,
}: X01PlayerStatsSlidePanelProps) {
  const themePrimaryColor = useActiveBoardThemePrimaryColor();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const currentPlayerId = game.players[game.currentPlayerIndex]?.id ?? null;
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(currentPlayerId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setExpandedPlayerId(focusPlayerId ?? currentPlayerId);
  }, [open, focusPlayerId, currentPlayerId]);

  useEffect(() => {
    if (!open || !expandedPlayerId) {
      return;
    }

    const section = sectionRefs.current[expandedPlayerId];
    section?.scrollIntoView({ block: "start" });
  }, [expandedPlayerId, open]);

  const togglePlayer = (playerId: string) => {
    setExpandedPlayerId((current) => (current === playerId ? null : playerId));
  };

  return (
    <SlidePanel
      open={open}
      title="Player stats"
      onClose={onClose}
      style={{ "--theme-primary-color": themePrimaryColor } as CSSProperties}
    >
      <div className="player-stats-slide">
        {game.players.map((player, index) => {
          const playerStats = stats[index];
          const isActive = index === game.currentPlayerIndex;
          const isExpanded = expandedPlayerId === player.id;
          const displayName = getPlayerScorecardName(player);

          if (!playerStats) {
            return null;
          }

          return (
            <section
              key={player.id}
              ref={(element) => {
                sectionRefs.current[player.id] = element;
              }}
              className={cn(
                "player-stats-slide__section scorecard-panel",
                isActive && ACTIVE_PLAYER_HIGHLIGHT_CLASS,
                isExpanded && "player-stats-slide__section--expanded",
              )}
            >
              <button
                type="button"
                className="player-stats-slide__section-header"
                aria-expanded={isExpanded}
                onClick={() => togglePlayer(player.id)}
              >
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarUrl={player.avatarUrl}
                  isGuest={player.isGuest}
                  isBot={isBotPlayer(player)}
                  size="sm"
                />
                <div className="player-stats-slide__section-copy">
                  <h4 className="player-stats-slide__name">{displayName}</h4>
                  {game.teamsEnabled && player.teamId != null ? (
                    <span className="player-stats-slide__badge">
                      {getTeamName(game.teamNames, player.teamId)}
                    </span>
                  ) : isActive ? (
                    <span className="player-stats-slide__badge">Current turn</span>
                  ) : null}
                </div>

                {!isExpanded ? (
                  <div className="player-stats-slide__collapsed-metric">
                    <span className="player-stats-slide__collapsed-metric-label">Avg</span>
                    <span className="player-stats-slide__collapsed-metric-value">
                      {playerStats.threeDartAverage.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <AccordionChevron open={isExpanded} />
              </button>

              {isExpanded ? (
                <div className="player-stats-slide__stats">
                  <StatRow label="Remaining" value={String(player.remaining)} />
                  <StatRow label="3-dart avg" value={playerStats.threeDartAverage.toFixed(2)} />
                  <StatRow label="Darts" value={String(playerStats.dartsThrown)} />
                  <StatRow label="Visits" value={String(playerStats.visitCount)} />
                  <StatRow
                    label="3x / 2x"
                    value={`${playerStats.triples} / ${playerStats.doubles}`}
                  />
                  <StatRow label="Misses" value={String(playerStats.misses)} />
                  <StatRow label="Busts" value={String(playerStats.busts)} />
                  <StatRow label="Checkouts" value={String(playerStats.checkoutSuccesses)} />
                  <StatRow label="Legs won" value={String(player.legsWon)} />
                  <StatRow label="Sets won" value={String(player.setsWon)} />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </SlidePanel>
  );
}
