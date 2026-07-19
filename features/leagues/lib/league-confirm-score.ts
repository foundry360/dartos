import { getCricketSideLegsWon } from "@/features/cricket/lib/cricket-engine";
import { getX01SideLegsWon } from "@/features/x01/lib/x01-engine";
import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";

export type LeagueMatchWinnerSide = "home" | "away";

export type LeagueConfirmScoreResult = {
  winnerSide: LeagueMatchWinnerSide;
  homeScore: number;
  awayScore: number;
};

function sideHasPlayer(
  game: {
    teamsEnabled: boolean;
    players: Array<{ id: string; teamId?: number }>;
  },
  sideTeamId: number,
  playerId: string,
): boolean {
  return game.players.some((player, index) => {
    const onSide = game.teamsEnabled
      ? player.teamId === sideTeamId
      : index === sideTeamId;
    return onSide && player.id === playerId;
  });
}

function resolveWinnerSide(game: {
  teamsEnabled: boolean;
  winnerId?: string;
  players: Array<{ id: string; teamId?: number }>;
}): LeagueMatchWinnerSide | null {
  if (!game.winnerId) {
    return null;
  }

  if (sideHasPlayer(game, 0, game.winnerId)) {
    return "home";
  }
  if (sideHasPlayer(game, 1, game.winnerId)) {
    return "away";
  }
  return null;
}

/** Resolve official winner + scoreline from a finished cricket/tactics game. */
export function resolveCricketConfirmScore(
  game: CricketGameState,
): LeagueConfirmScoreResult | null {
  if (game.status !== "finished" || !game.winnerId) {
    return null;
  }

  const winnerSide = resolveWinnerSide(game);
  if (!winnerSide) {
    return null;
  }

  return {
    winnerSide,
    homeScore: getCricketSideLegsWon(game.players, 0, game.teamsEnabled),
    awayScore: getCricketSideLegsWon(game.players, 1, game.teamsEnabled),
  };
}

/** Resolve official winner + scoreline from a finished X01 game. */
export function resolveX01ConfirmScore(
  game: X01GameState,
): LeagueConfirmScoreResult | null {
  if (game.status !== "finished" || !game.winnerId) {
    return null;
  }

  const winnerSide = resolveWinnerSide(game);
  if (!winnerSide) {
    return null;
  }

  return {
    winnerSide,
    homeScore: getX01SideLegsWon(game.players, 0, game.teamsEnabled),
    awayScore: getX01SideLegsWon(game.players, 1, game.teamsEnabled),
  };
}
