import { DARTS_PER_VISIT } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { getTeamName } from "@/features/players/lib/team-display";
import type { DartHit } from "@/types/dart";
import type { X01GameState, X01OutRule, X01PlayerState } from "@/types/x01";

export function formatLeagueScoringElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatOutRuleLabel(outRule: X01OutRule): string {
  return outRule === "straight_out" ? "Straight Out" : "Double Out";
}

export function getUpcomingPlayerName(game: X01GameState): string | null {
  if (game.players.length === 0) {
    return null;
  }
  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const nextPlayer = game.players[nextIndex];
  return nextPlayer ? getPlayerScorecardName(nextPlayer) : null;
}

export function getLastCompletedVisit(game: X01GameState): {
  playerName: string;
  darts: DartHit[];
  total: number;
} | null {
  if (game.history.length === 0) {
    return null;
  }

  let end = game.history.length - 1;
  if (game.visitDarts.length > 0) {
    end -= game.visitDarts.length;
  }
  if (end < 0) {
    return null;
  }

  const playerIndex = game.history[end]!.playerIndex;
  const darts: DartHit[] = [];
  let total = 0;

  for (let i = end; i >= 0; i -= 1) {
    const entry = game.history[i]!;
    if (entry.playerIndex !== playerIndex) {
      break;
    }
    darts.unshift(entry.dart);
    total += entry.effectiveScore;
    if (darts.length >= DARTS_PER_VISIT || entry.bust) {
      break;
    }
  }

  if (darts.length === 0) {
    return null;
  }

  const player = game.players[playerIndex];
  return {
    playerName: player ? getPlayerScorecardName(player) : "Player",
    darts,
    total,
  };
}

export function formatX01WinnerLabel(game: X01GameState): string {
  const winner = game.players.find((player) => player.id === game.winnerId);
  if (!winner) {
    return "Player";
  }

  if (!game.teamsEnabled || winner.teamId == null) {
    return getPlayerScorecardName(winner);
  }

  const teammates = game.players
    .filter((player) => player.teamId === winner.teamId)
    .map((player) => getPlayerScorecardName(player));

  return `${getTeamName(game.teamNames, winner.teamId)} (${teammates.join(", ")})`;
}

export type LeagueX01ScoringSide = {
  teamId: number;
  teamName: string;
  remaining: number;
  legsWon: number;
  players: Array<{ player: X01PlayerState; index: number }>;
  isActive: boolean;
};

export function getLeagueX01ScoringSides(
  game: X01GameState,
): [LeagueX01ScoringSide, LeagueX01ScoringSide] {
  const teamNames = game.teamNames;
  const buildSide = (teamId: number): LeagueX01ScoringSide => {
    const members = game.players
      .map((player, index) => ({ player, index }))
      .filter(({ player, index }) =>
        game.teamsEnabled
          ? player.teamId === teamId
          : index === teamId,
      );
    const first = members[0]?.player;
    return {
      teamId,
      teamName: game.teamsEnabled
        ? getTeamName(teamNames, teamId)
        : first
          ? getPlayerScorecardName(first)
          : `Side ${teamId + 1}`,
      remaining: first?.remaining ?? game.gameType,
      legsWon: first?.legsWon ?? 0,
      players: members,
      isActive: members.some(({ index }) => index === game.currentPlayerIndex),
    };
  };

  return [buildSide(0), buildSide(1)];
}
