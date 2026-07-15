"use client";

import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  LeagueStatusBadge,
  VectorAccountStatus,
} from "@/features/leagues/components/LeaguePlayerStatus";
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
  onRemove: (player: LeaguePlayer) => void;
}

export function LeaguePlayerDetailDrawer({
  open,
  player,
  onClose,
  onEdit,
  onAssignTeam,
  onSendInvite,
  onRemove,
}: LeaguePlayerDetailDrawerProps) {
  return (
    <SlidePanel
      open={open && Boolean(player)}
      title={player ? leaguePlayerDisplayName(player) : "Player"}
      onClose={onClose}
      className="league-player-drawer"
    >
      {player ? (
        <div className="league-player-drawer__body">
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
            <div>
              <dt>Account Status</dt>
              <dd>
                <VectorAccountStatus state={player.vectorAccount} />
              </dd>
            </div>
            <div>
              <dt>League Status</dt>
              <dd>
                <LeagueStatusBadge status={player.leagueStatus} />
              </dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>{player.teamName ?? "Unassigned"}</dd>
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
                      <strong className={match.result === "W" ? "is-win" : "is-loss"}>
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

          <div className="league-player-drawer__actions">
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
