"use client";

import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TouchButton } from "@/components/ui/TouchButton";
import { VectorAccountStatus } from "@/features/leagues/components/LeaguePlayerStatus";
import {
  formatLeagueAverage,
  leaguePlayerDisplayName,
  leaguePlayerRecord,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";

interface LeaguePlayerDetailDrawerProps {
  open: boolean;
  player: LeaguePlayer | null;
  onClose: () => void;
  onEdit: (player: LeaguePlayer) => void;
  onAssignTeam: (player: LeaguePlayer) => void;
  onSendInvite: (player: LeaguePlayer) => void;
  onStatusChange: (player: LeaguePlayer, active: boolean) => void;
  onRemove: (player: LeaguePlayer) => void;
}

export function LeaguePlayerDetailDrawer({
  open,
  player,
  onClose,
  onEdit,
  onAssignTeam,
  onSendInvite,
  onStatusChange,
  onRemove,
}: LeaguePlayerDetailDrawerProps) {
  const isActive = player?.leagueStatus === "active";

  return (
    <SlidePanel
      open={open && Boolean(player)}
      title={player ? leaguePlayerDisplayName(player) : "Player"}
      onClose={onClose}
      className="league-player-drawer league-slide-drawer"
    >
      {player ? (
        <div className="league-slide-drawer__layout">
          <div className="league-slide-drawer__scroll">
            <div className="league-player-drawer__identity">
              <PlayerAvatar
                name={leaguePlayerDisplayName(player)}
                color={player.color}
                avatarUrl={player.avatarUrl}
              />
              <div>
                <p className="league-player-drawer__name">
                  {leaguePlayerDisplayName(player)}
                </p>
                {player.nickname ? (
                  <p className="league-player-drawer__nickname">
                    &ldquo;{player.nickname}&rdquo;
                  </p>
                ) : null}
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
                    onChange={(enabled) => onStatusChange(player, enabled)}
                  />
                </dd>
              </div>
              <div className="league-slide-drawer__status-row">
                <dt>Account</dt>
                <dd>
                  <VectorAccountStatus state={player.vectorAccount} iconOnly />
                </dd>
              </div>
              <div className="league-slide-drawer__status-row">
                <dt>Team</dt>
                <dd>
                  <span className="league-player-drawer__team-name">
                    {player.teamName ?? "Unassigned"}
                  </span>
                </dd>
              </div>
            </dl>

            <section className="league-player-drawer__section">
              <h3>Season Statistics</h3>
              <div className="league-player-drawer__stats">
                <div>
                  <span>Matches Played</span>
                  <strong>{player.matchesPlayed}</strong>
                </div>
                <div>
                  <span>Wins</span>
                  <strong>{player.wins}</strong>
                </div>
                <div>
                  <span>Losses</span>
                  <strong>{player.losses}</strong>
                </div>
                <div>
                  <span>Average</span>
                  <strong>{formatLeagueAverage(player.average)}</strong>
                </div>
                <div>
                  <span>Checkout %</span>
                  <strong>
                    {player.checkoutPercent != null
                      ? `${player.checkoutPercent.toFixed(1)}%`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Record</span>
                  <strong>{leaguePlayerRecord(player)}</strong>
                </div>
              </div>
            </section>

            <section className="league-player-drawer__section">
              <h3>Recent Matches</h3>
              {player.recentMatches.length > 0 ? (
                <ul className="league-player-drawer__matches">
                  {player.recentMatches.map((match) => (
                    <li key={match.id}>
                      <span>
                        <strong
                          className={
                            match.result === "W" ? "is-win" : "is-loss"
                          }
                        >
                          {match.result}
                        </strong>{" "}
                        {match.label}
                      </span>
                      <span>{match.dateLabel}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="league-empty__sub">No matches played yet.</p>
              )}
            </section>
          </div>

          <div className="league-player-drawer__actions league-slide-drawer__actions">
            <TouchButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onEdit(player)}
            >
              Edit Player
            </TouchButton>
            <TouchButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onAssignTeam(player)}
            >
              Assign Team
            </TouchButton>
            <TouchButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => onSendInvite(player)}
            >
              Send Invite
            </TouchButton>
            <TouchButton
              type="button"
              variant="danger"
              size="lg"
              fullWidth
              className="league-drawer-btn--danger-solid"
              onClick={() => onRemove(player)}
            >
              Remove Player
            </TouchButton>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}
