import { DARTS_PER_VISIT, getCricketTargets } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { getTeamName } from "@/features/players/lib/team-display";
import { getCricketMark } from "@/features/cricket/lib/cricket-engine";
import { formatCricketWinnerLabel } from "@/features/cricket/lib/team-display";
import type { DartHit } from "@/types/dart";
import type {
  CricketGameState,
  CricketMark,
  CricketPlayerState,
} from "@/types/cricket";
import type { CricketTarget } from "@/lib/constants";

export { formatLeagueScoringElapsed } from "@/features/leagues/lib/league-x01-scoring-helpers";
export { formatCricketWinnerLabel };

export function getUpcomingCricketPlayerName(
  game: CricketGameState,
): string | null {
  if (game.players.length === 0) {
    return null;
  }
  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const nextPlayer = game.players[nextIndex];
  return nextPlayer ? getPlayerScorecardName(nextPlayer) : null;
}

export function getLastCompletedCricketVisit(game: CricketGameState): {
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
    total += entry.scoreAfter - entry.scoreBefore;
    if (darts.length >= DARTS_PER_VISIT) {
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

export type LeagueCricketScoringSide = {
  teamId: number;
  teamName: string;
  score: number;
  legsWon: number;
  players: Array<{ player: CricketPlayerState; index: number }>;
  isActive: boolean;
};

export function getLeagueCricketScoringSides(
  game: CricketGameState,
): [LeagueCricketScoringSide, LeagueCricketScoringSide] {
  const teamNames = game.teamNames;
  const buildSide = (teamId: number): LeagueCricketScoringSide => {
    const members = game.players
      .map((player, index) => ({ player, index }))
      .filter(({ player, index }) =>
        game.teamsEnabled ? player.teamId === teamId : index === teamId,
      );
    const first = members[0]?.player;
    return {
      teamId,
      teamName: game.teamsEnabled
        ? getTeamName(teamNames, teamId)
        : first
          ? getPlayerScorecardName(first)
          : `Side ${teamId + 1}`,
      score: first?.score ?? 0,
      legsWon: first?.legsWon ?? 0,
      players: members,
      isActive: members.some(({ index }) => index === game.currentPlayerIndex),
    };
  };

  return [buildSide(0), buildSide(1)];
}

export function formatCricketMarkGlyph(mark: CricketMark): string {
  if (mark <= 0) {
    return "·";
  }
  if (mark === 1) {
    return "/";
  }
  if (mark === 2) {
    return "X";
  }
  return "⊗";
}

export function getCricketMarkForSide(
  game: CricketGameState,
  side: LeagueCricketScoringSide,
  target: CricketTarget,
): CricketMark {
  const first = side.players[0]?.player;
  if (!first) {
    return 0;
  }
  return getCricketMark(first.marks, target);
}

export function getLeagueCricketTargets(game: CricketGameState) {
  return getCricketTargets(game.variant ?? "classic");
}

export function formatCricketTargetLabel(target: CricketTarget): string {
  return target === "bull" ? "B" : String(target);
}
