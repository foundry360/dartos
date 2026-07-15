"use client";

import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import {
  LEAGUE_TEAM_STATUS_LABEL,
  leagueTeamRecord,
  type LeagueTeam,
} from "@/features/leagues/lib/league-teams";

interface LeagueTeamDetailDrawerProps {
  open: boolean;
  team: LeagueTeam | null;
  members: LeaguePlayer[];
  onClose: () => void;
  onEdit: (team: LeagueTeam) => void;
  onAssignPlayers: (team: LeagueTeam) => void;
  onStatusChange: (team: LeagueTeam, active: boolean) => void;
  onRemove: (team: LeagueTeam) => void;
}

export function LeagueTeamDetailDrawer({
  open,
  team,
  members,
  onClose,
  onEdit,
  onAssignPlayers,
  onStatusChange,
  onRemove,
}: LeagueTeamDetailDrawerProps) {
  const isActive = team?.status === "active";

  return (
    <SlidePanel
      open={open && Boolean(team)}
      title={team?.name ?? "Team"}
      onClose={onClose}
      className="league-player-drawer league-slide-drawer"
    >
      {team ? (
        <div className="league-slide-drawer__layout">
          <div className="league-slide-drawer__scroll">
            <div className="league-player-drawer__identity">
              <span
                className="league-team-avatar"
                style={{ backgroundColor: team.color }}
                aria-hidden
              >
                {team.name.trim().charAt(0).toUpperCase() || "T"}
              </span>
              <div>
                <p className="league-player-drawer__name">{team.name}</p>
                <p className="league-player-drawer__nickname">
                  {LEAGUE_TEAM_STATUS_LABEL[team.status]} · {team.playerCount}{" "}
                  player{team.playerCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <dl className="league-player-drawer__meta">
              <div className="league-slide-drawer__status-row">
                <dt>
                  <span
                    className={
                      isActive
                        ? "league-team-status-toggle__label is-active"
                        : "league-team-status-toggle__label"
                    }
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </dt>
                <dd>
                  <ToggleSwitch
                    enabled={isActive}
                    label={isActive ? "Active" : "Inactive"}
                    onChange={(enabled) => onStatusChange(team, enabled)}
                  />
                </dd>
              </div>
              <div>
                <dt>Record</dt>
                <dd>{leagueTeamRecord(team)}</dd>
              </div>
            </dl>

            <section className="league-player-drawer__section">
              <h3>Roster ({team.playerCount})</h3>
              {members.length === 0 ? (
                <p className="league-empty__sub">No players assigned yet.</p>
              ) : (
                <ul className="league-team-drawer__members">
                  {members.map((player) => (
                    <li key={player.id}>
                      <PlayerAvatar
                        name={leaguePlayerDisplayName(player)}
                        color={player.color}
                        avatarUrl={player.avatarUrl}
                        size="sm"
                      />
                      <span>{leaguePlayerDisplayName(player)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="league-player-drawer__actions league-slide-drawer__actions">
            <TouchButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onEdit(team)}
            >
              Edit Team
            </TouchButton>
            <TouchButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onAssignPlayers(team)}
            >
              Assign Players
            </TouchButton>
            <TouchButton
              type="button"
              variant="danger"
              size="lg"
              fullWidth
              className="league-drawer-btn--danger-solid"
              onClick={() => onRemove(team)}
            >
              Delete Team
            </TouchButton>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}
