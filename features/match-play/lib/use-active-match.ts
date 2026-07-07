"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { getAccountProfileId } from "@/features/players/lib/account-player-profile";
import { useX01Store } from "@/features/x01/store/x01-store";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";

export interface ActiveMatchSummary {
  href: string;
  userName: string;
  opponentName: string;
  opponentProfileId?: string;
  opponentAvatarUrl?: string | null;
  opponentColor?: string | null;
  matchType: string;
  progress: string;
}

interface ActiveMatchPlayer {
  name: string;
  nickname?: string | null;
  profileId?: string;
  avatarUrl?: string | null;
  color?: string;
}

function summarizeAccountActiveMatch(
  players: ActiveMatchPlayer[],
  accountProfileId: string,
) {
  const accountPlayer = players.find((player) => player.profileId === accountProfileId);

  if (!accountPlayer) {
    return null;
  }

  const opponents = players.filter((player) => player.profileId !== accountProfileId);
  const primaryOpponent = opponents[0];
  const opponentName =
    opponents.length === 1
      ? getPlayerScorecardName(opponents[0]!)
      : opponents.length > 1
        ? opponents.map((player) => getPlayerScorecardName(player)).join(", ")
        : "Opponent";

  return {
    userName: getPlayerScorecardName(accountPlayer),
    opponentName,
    opponentProfileId: primaryOpponent?.profileId,
    opponentAvatarUrl: primaryOpponent?.avatarUrl,
    opponentColor: primaryOpponent?.color ?? null,
  };
}

export function useActiveMatch(): ActiveMatchSummary | null {
  const { user } = useAuth();
  const cricketGame = useCricketStore((state) => state.game);
  const x01Game = useX01Store((state) => state.game);

  if (!user) {
    return null;
  }

  const accountProfileId = getAccountProfileId(user.id);

  if (cricketGame?.status === "playing") {
    const summary = summarizeAccountActiveMatch(cricketGame.players, accountProfileId);

    if (!summary) {
      return null;
    }

    return {
      href: "/cricket/play",
      userName: summary.userName,
      opponentName: summary.opponentName,
      opponentProfileId: summary.opponentProfileId,
      opponentAvatarUrl: summary.opponentAvatarUrl,
      opponentColor: summary.opponentColor,
      matchType: formatCricketVariantLabel(cricketGame.variant ?? "classic"),
      progress: formatCricketMatchProgress(cricketGame.players),
    };
  }

  if (x01Game?.status === "playing") {
    const summary = summarizeAccountActiveMatch(x01Game.players, accountProfileId);

    if (!summary) {
      return null;
    }

    return {
      href: `/x01/${x01Game.gameType}/play`,
      userName: summary.userName,
      opponentName: summary.opponentName,
      opponentProfileId: summary.opponentProfileId,
      opponentAvatarUrl: summary.opponentAvatarUrl,
      opponentColor: summary.opponentColor,
      matchType: String(x01Game.gameType),
      progress: formatCricketMatchProgress(x01Game.players),
    };
  }

  return null;
}
