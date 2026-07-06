import type { CricketGameState, CricketPlayerState } from "@/types/cricket";

export function orderSetupSlotsForTeams<T extends { teamId: number }>(slots: T[]): T[] {
  const team0 = slots.filter((slot) => slot.teamId === 0);
  const team1 = slots.filter((slot) => slot.teamId === 1);
  const ordered: T[] = [];
  const pairCount = Math.max(team0.length, team1.length);

  for (let index = 0; index < pairCount; index += 1) {
    if (team0[index]) {
      ordered.push(team0[index]!);
    }

    if (team1[index]) {
      ordered.push(team1[index]!);
    }
  }

  return ordered;
}

export function formatCricketWinnerLabel(game: CricketGameState): string {
  const winner = game.players.find((player) => player.id === game.winnerId);

  if (!winner) {
    return "Player";
  }

  if (!game.teamsEnabled || winner.teamId == null) {
    return winner.name;
  }

  const teammates = game.players
    .filter((player) => player.teamId === winner.teamId)
    .map((player) => player.name);

  return `Team ${winner.teamId + 1} (${teammates.join(", ")})`;
}

export function formatCricketMatchResultLines(players: CricketPlayerState[], teamsEnabled: boolean): string[] {
  if (!teamsEnabled) {
    return players.map(
      (player) => `${player.name}: ${player.setsWon} set${player.setsWon === 1 ? "" : "s"}`,
    );
  }

  const teamIds = [...new Set(players.map((player) => player.teamId ?? 0))].sort();

  return teamIds.map((teamId) => {
    const members = players.filter((player) => (player.teamId ?? 0) === teamId);
    const setsWon = members[0]?.setsWon ?? 0;
    const names = members.map((player) => player.name).join(", ");

    return `Team ${teamId + 1} (${names}): ${setsWon} set${setsWon === 1 ? "" : "s"}`;
  });
}
