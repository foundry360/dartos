"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { CricketGameState } from "@/types/cricket";
import type { CricketPlayerMatchStats } from "@/features/cricket/lib/cricket-stats";
import { ACTIVE_PLAYER_HIGHLIGHT_CLASS } from "@/features/cricket/lib/player-panel";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { getCricketTargetCount } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { cn } from "@/utils/cn";

interface CricketPlayerStatsSlidePanelProps {
  open: boolean;
  game: Pick<CricketGameState, "players" | "currentPlayerIndex" | "variant">;
  stats: CricketPlayerMatchStats[];
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

export function CricketPlayerStatsSlidePanel({
  open,
  game,
  stats,
  focusPlayerId,
  onClose,
}: CricketPlayerStatsSlidePanelProps) {
  const themePrimaryColor = useActiveBoardThemePrimaryColor();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const targetCount = getCricketTargetCount(game.variant ?? "classic");
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
                  size="sm"
                />
                <div className="player-stats-slide__section-copy">
                  <h4 className="player-stats-slide__name">{displayName}</h4>
                  {isActive ? (
                    <span className="player-stats-slide__badge">Current turn</span>
                  ) : null}
                </div>

                {!isExpanded ? (
                  <div className="player-stats-slide__collapsed-metric">
                    <span className="player-stats-slide__collapsed-metric-label">MPR</span>
                    <span className="player-stats-slide__collapsed-metric-value">
                      {playerStats.mpr.toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <AccordionChevron open={isExpanded} />
              </button>

              {isExpanded ? (
                <div className="player-stats-slide__stats">
                  <StatRow label="Score" value={String(player.score)} />
                  <StatRow label="MPR" value={playerStats.mpr.toFixed(2)} />
                  <StatRow label="Darts" value={String(playerStats.dartsThrown)} />
                  <StatRow label="Marks" value={String(playerStats.marks)} />
                  <StatRow
                    label="3x / 2x"
                    value={`${playerStats.triples} / ${playerStats.doubles}`}
                  />
                  <StatRow label="Misses" value={String(playerStats.misses)} />
                <StatRow
                  label="Closed"
                  value={`${playerStats.segmentsClosed}/${targetCount}`}
                />
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
