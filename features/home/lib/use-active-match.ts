"use client";

import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useX01Store } from "@/features/x01/store/x01-store";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";

export interface ActiveMatchSummary {
  href: string;
  userName: string;
  opponentName: string;
  matchType: string;
  progress: string;
}

function summarizePlayers(players: Array<{ name: string; nickname?: string | null }>) {
  const first = players[0];
  const second = players[1];

  if (!first) {
    return {
      userName: "You",
      opponentName: "Opponent",
    };
  }

  if (!second) {
    return {
      userName: getPlayerScorecardName(first),
      opponentName: "Opponent",
    };
  }

  return {
    userName: getPlayerScorecardName(first),
    opponentName: getPlayerScorecardName(second),
  };
}

export function useActiveMatch(): ActiveMatchSummary | null {
  const cricketGame = useCricketStore((state) => state.game);
  const x01Game = useX01Store((state) => state.game);

  if (cricketGame?.status === "playing") {
    const { userName, opponentName } = summarizePlayers(cricketGame.players);

    return {
      href: "/cricket/play",
      userName,
      opponentName,
      matchType: formatCricketVariantLabel(cricketGame.variant ?? "classic"),
      progress: formatCricketMatchProgress(cricketGame.players),
    };
  }

  if (x01Game?.status === "playing") {
    const { userName, opponentName } = summarizePlayers(x01Game.players);

    return {
      href: `/x01/${x01Game.gameType}/play`,
      userName,
      opponentName,
      matchType: String(x01Game.gameType),
      progress: formatCricketMatchProgress(x01Game.players),
    };
  }

  return null;
}
