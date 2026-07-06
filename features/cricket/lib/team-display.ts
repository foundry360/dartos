import type { CricketGameState, CricketPlayerState } from "@/types/cricket";
import type { MatchTeamNames } from "@/types/player-setup";
import { getPlayerScorecardName } from "@/lib/player-display";
import { getTeamName } from "@/features/players/lib/team-display";
export { getTeamName, orderSetupSlotsForTeams } from "@/features/players/lib/team-display";

export function formatCricketWinnerLabel(game: CricketGameState): string {
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

export function formatCricketMatchResultLines(
  players: CricketPlayerState[],
  teamsEnabled: boolean,
  teamNames?: MatchTeamNames,
): string[] {
  if (!teamsEnabled) {
    return players.map(
      (player) =>
        `${getPlayerScorecardName(player)}: ${player.setsWon} set${player.setsWon === 1 ? "" : "s"}`,
    );
  }

  const teamIds = [...new Set(players.map((player) => player.teamId ?? 0))].sort();

  return teamIds.map((teamId) => {
    const members = players.filter((player) => (player.teamId ?? 0) === teamId);
    const setsWon = members[0]?.setsWon ?? 0;
    const names = members.map((player) => getPlayerScorecardName(player)).join(", ");

    return `${getTeamName(teamNames, teamId)} (${names}): ${setsWon} set${setsWon === 1 ? "" : "s"}`;
  });
}
