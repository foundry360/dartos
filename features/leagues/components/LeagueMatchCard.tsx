"use client";

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

function StartIcon() {
  return (
    <svg
      className="league-match-card__start-icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.02-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export type LeagueMatchWinnerSide = "home" | "away" | null;

interface LeagueMatchCardProps {
  matchNumber: number;
  match: DraftLeagueMatch;
  winnerSide?: LeagueMatchWinnerSide;
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  starting?: boolean;
  onStart?: () => void;
  onResume?: () => void;
}

function MatchSideRow({
  side,
  isWinner,
  hasResult,
}: {
  side: SideIdentity;
  isWinner: boolean;
  hasResult: boolean;
}) {
  const score = hasResult && isWinner ? 1 : 0;

  return (
    <div
      className={cn(
        "league-match-card__side",
        isWinner && "is-winner",
        hasResult && !isWinner && "is-loser",
      )}
    >
      <PlayerAvatar
        name={side.name}
        color={side.color}
        avatarUrl={side.avatarUrl}
      />
      <span className="league-match-card__name">{side.label}</span>
      <span
        className={cn(
          "league-match-card__score",
          isWinner && "league-match-card__score--win",
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function LeagueMatchCard({
  matchNumber,
  match,
  winnerSide = null,
  playersById,
  teamsById,
  starting = false,
  onStart,
  onResume,
}: LeagueMatchCardProps) {
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
  const hasResult =
    match.status === "completed" ||
    winnerSide === "home" ||
    winnerSide === "away";
  const canStart = match.status === "scheduled" && Boolean(onStart);
  const canResume = match.status === "in_progress" && Boolean(onResume);

  return (
    <article className="league-match-card" aria-label={`Match ${matchNumber}`}>
      <header className="league-match-card__header">
        <h3 className="league-match-card__number">Match #{matchNumber}</h3>
        {canStart ? (
          <button
            type="button"
            className="league-match-card__start"
            disabled={starting}
            onClick={onStart}
          >
            <StartIcon />
            {starting ? "Starting…" : "Start"}
          </button>
        ) : match.status === "completed" ? (
          <span className="league-match-card__status league-match-card__status--completed">
            Completed
          </span>
        ) : canResume ? (
          <button
            type="button"
            className="league-match-card__status league-match-card__status--in-progress league-match-card__status--action"
            onClick={onResume}
          >
            In Progress
          </button>
        ) : match.status === "in_progress" ? (
          <span className="league-match-card__status league-match-card__status--in-progress">
            In Progress
          </span>
        ) : (
          <span className="league-match-card__status league-match-card__status--pending">
            Pending
          </span>
        )}
      </header>

      <div className="league-match-card__sides">
        <MatchSideRow
          side={home}
          isWinner={winnerSide === "home"}
          hasResult={hasResult}
        />
        <MatchSideRow
          side={away}
          isWinner={winnerSide === "away"}
          hasResult={hasResult}
        />
      </div>
    </article>
  );
}
