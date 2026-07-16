"use client";

import { useState, type ReactNode } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface SideIdentity {
  label: string;
  name: string;
  color: string;
  avatarUrl: string | null;
}

function resolveSide(
  id: string | null,
  kind: "team" | "player",
  label: string,
  playersById: Map<string, LeaguePlayer>,
  teamsById: Map<string, LeagueTeam>,
): SideIdentity {
  if (kind === "player" && id) {
    const player = playersById.get(id);

    if (player) {
      const displayName = leaguePlayerDisplayName(player);

      return {
        label: player.nickname?.trim() || displayName,
        name: displayName,
        color: player.color || APP_PRIMARY_COLOR,
        avatarUrl: player.avatarUrl,
      };
    }
  }

  if (kind === "team" && id) {
    const team = teamsById.get(id);

    if (team) {
      return {
        label: team.name,
        name: team.name,
        color: team.color || APP_PRIMARY_COLOR,
        avatarUrl: null,
      };
    }
  }

  return {
    label,
    name: label,
    color: APP_PRIMARY_COLOR,
    avatarUrl: null,
  };
}

interface ScheduleMatchupRowProps {
  match: DraftLeagueMatch;
  dateLabel: string;
  timeLabel?: string | null;
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  canReplaceSides?: boolean;
  onReplaceSide?: (side: "home" | "away") => void;
  actions?: ReactNode;
  className?: string;
}

export function ScheduleMatchupRow({
  match,
  dateLabel,
  timeLabel,
  playersById,
  teamsById,
  canReplaceSides = false,
  onReplaceSide,
  actions,
  className,
}: ScheduleMatchupRowProps) {
  const [editing, setEditing] = useState(false);
  const sidesEditable = canReplaceSides && Boolean(onReplaceSide) && editing;

  const home = resolveSide(
    match.homeId,
    match.homeKind,
    match.homeLabel,
    playersById,
    teamsById,
  );
  const away = resolveSide(
    match.awayId,
    match.awayKind,
    match.awayLabel,
    playersById,
    teamsById,
  );

  const homeContent = (
    <>
      <PlayerAvatar
        name={home.name}
        color={home.color}
        avatarUrl={home.avatarUrl}
      />
      <span className="schedule-matchup-row__name">{home.label}</span>
    </>
  );

  const awayContent = (
    <>
      <span className="schedule-matchup-row__name">{away.label}</span>
      <PlayerAvatar
        name={away.name}
        color={away.color}
        avatarUrl={away.avatarUrl}
      />
    </>
  );

  return (
    <li
      className={cn(
        "schedule-matchup-row",
        editing && "is-editing",
        className,
      )}
    >
      {sidesEditable ? (
        <button
          type="button"
          className="schedule-matchup-row__player schedule-matchup-row__player--home schedule-matchup-row__player--button"
          onClick={() => onReplaceSide?.("home")}
          aria-label={`Change home: ${home.label}`}
        >
          {homeContent}
        </button>
      ) : (
        <div className="schedule-matchup-row__player schedule-matchup-row__player--home">
          {homeContent}
        </div>
      )}

      <div className="schedule-matchup-row__meta">
        <span className="schedule-matchup-row__week">Week {match.weekNumber}</span>
        <span className="schedule-matchup-row__date">
          {dateLabel}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </span>
        {canReplaceSides && onReplaceSide ? (
          <button
            type="button"
            className="schedule-matchup-row__edit"
            onClick={() => setEditing((current) => !current)}
            aria-pressed={editing}
          >
            {editing ? "Done" : "Edit"}
          </button>
        ) : null}
      </div>

      {sidesEditable ? (
        <button
          type="button"
          className="schedule-matchup-row__player schedule-matchup-row__player--away schedule-matchup-row__player--button"
          onClick={() => onReplaceSide?.("away")}
          aria-label={`Change away: ${away.label}`}
        >
          {awayContent}
        </button>
      ) : (
        <div className="schedule-matchup-row__player schedule-matchup-row__player--away">
          {awayContent}
        </div>
      )}

      {actions ? (
        <div className="schedule-matchup-row__actions">{actions}</div>
      ) : null}
    </li>
  );
}
