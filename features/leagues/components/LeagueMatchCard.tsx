"use client";

import type { KeyboardEvent } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { LeagueMatchStatusBadge } from "@/features/leagues/components/LeagueMatchStatusBadge";
import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import {
  matchUiStatusFromSchedule,
  type LeagueNightMatchUiStatus,
} from "@/features/leagues/lib/league-night";
import {
  isTerminalLeagueMatchStatus,
  type DraftLeagueMatch,
} from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";

export interface MatchSideIdentity {
  label: string;
  name: string;
  color: string;
  avatarUrl: string | null;
}

export function resolveMatchSideIdentity(
  id: string | null,
  kind: "team" | "player",
  label: string,
  playersById: Map<string, LeaguePlayer>,
  teamsById: Map<string, LeagueTeam>,
): MatchSideIdentity {
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

export type LeagueMatchWinnerSide = "home" | "away" | null;

interface LeagueMatchCardProps {
  matchNumber: number;
  match: DraftLeagueMatch;
  winnerSide?: LeagueMatchWinnerSide;
  /** When provided, shown instead of win/loss 1–0 placeholders. */
  homeScore?: number;
  awayScore?: number;
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  /** When omitted, derived from schedule status only. */
  status?: LeagueNightMatchUiStatus;
  onOpen?: () => void;
}

function MatchSideRow({
  side,
  isWinner,
  hasResult,
  score,
}: {
  side: MatchSideIdentity;
  isWinner: boolean;
  hasResult: boolean;
  score: number;
}) {
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
  homeScore,
  awayScore,
  playersById,
  teamsById,
  status,
  onOpen,
}: LeagueMatchCardProps) {
  const home = resolveMatchSideIdentity(
    match.homeId,
    match.homeKind,
    match.homeLabel,
    playersById,
    teamsById,
  );
  const away = resolveMatchSideIdentity(
    match.awayId,
    match.awayKind,
    match.awayLabel,
    playersById,
    teamsById,
  );
  const hasResult =
    isTerminalLeagueMatchStatus(match.status) ||
    winnerSide === "home" ||
    winnerSide === "away";
  const uiStatus = status ?? matchUiStatusFromSchedule(match);
  const interactive = Boolean(onOpen);
  const resolvedWinner =
    winnerSide ??
    (hasResult && homeScore != null && awayScore != null
      ? homeScore > awayScore
        ? "home"
        : awayScore > homeScore
          ? "away"
          : null
      : null);
  const displayHomeScore =
    homeScore ?? (hasResult && resolvedWinner === "home" ? 1 : 0);
  const displayAwayScore =
    awayScore ?? (hasResult && resolvedWinner === "away" ? 1 : 0);

  return (
    <article
      className={cn("league-match-card", interactive && "is-interactive")}
      aria-label={`Match ${matchNumber}`}
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick: onOpen,
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen?.();
              }
            },
          }
        : {})}
    >
      <header className="league-match-card__header">
        <h3 className="league-match-card__number">Match #{matchNumber}</h3>
        <LeagueMatchStatusBadge status={uiStatus} />
      </header>

      <div className="league-match-card__sides">
        <MatchSideRow
          side={home}
          isWinner={resolvedWinner === "home"}
          hasResult={hasResult}
          score={displayHomeScore}
        />
        <MatchSideRow
          side={away}
          isWinner={resolvedWinner === "away"}
          hasResult={hasResult}
          score={displayAwayScore}
        />
      </div>
    </article>
  );
}
