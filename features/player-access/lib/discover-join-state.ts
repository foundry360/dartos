import {
  getPlayerLeagueStatus,
  type PlayerLeagueStatus,
} from "@/features/leagues/lib/league-formats";
import type { JoinableLeague } from "@/lib/supabase/queries/player-league-access";

export type DiscoverStatusTone = PlayerLeagueStatus | "full";

export type DiscoverJoinState = {
  canJoin: boolean;
  canView: boolean;
  statusLabel: string;
  statusTone: DiscoverStatusTone;
  ctaLabel: string;
};

export function getDiscoverJoinState(league: JoinableLeague): DiscoverJoinState {
  const membership = league.membership_status?.trim().toLowerCase() ?? null;

  if (membership === "pending") {
    return {
      canJoin: false,
      canView: false,
      statusLabel: "Pending",
      statusTone: "on_roster",
      ctaLabel: "Pending",
    };
  }

  if (membership === "invited") {
    return {
      canJoin: false,
      canView: false,
      statusLabel: "Invited",
      statusTone: "on_roster",
      ctaLabel: "Invited",
    };
  }

  const lifecycle = getPlayerLeagueStatus({
    starts_at: league.starts_at,
    ends_at: league.ends_at,
    published_at: league.published_at,
  });

  if (lifecycle === "completed") {
    return {
      canJoin: false,
      canView: true,
      statusLabel: "Completed",
      statusTone: "completed",
      ctaLabel: "View League",
    };
  }

  if (lifecycle === "in_progress") {
    return {
      canJoin: false,
      canView: false,
      statusLabel: "In Progress",
      statusTone: "in_progress",
      ctaLabel: "Registration closed",
    };
  }

  const maxPlayers = league.max_players;
  const playerCount = league.player_count ?? 0;
  if (maxPlayers != null && maxPlayers > 0 && playerCount >= maxPlayers) {
    return {
      canJoin: false,
      canView: false,
      statusLabel: "Full",
      statusTone: "full",
      ctaLabel: "League full",
    };
  }

  if (league.registration_mode === "open") {
    return {
      canJoin: true,
      canView: false,
      statusLabel: "Open",
      statusTone: "registered",
      ctaLabel: "Register",
    };
  }

  return {
    canJoin: true,
    canView: false,
    statusLabel: "Approval",
    statusTone: "registered",
    ctaLabel: "Request to join",
  };
}
