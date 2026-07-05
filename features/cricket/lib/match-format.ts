export function getCurrentSetNumber(players: Array<{ setsWon: number }>): number {
  if (players.length === 0) {
    return 1;
  }

  return Math.max(...players.map((player) => player.setsWon)) + 1;
}

export function getCurrentLegNumber(players: Array<{ legsWon: number }>): number {
  return players.reduce((sum, player) => sum + player.legsWon, 0) + 1;
}

export function formatCricketMatchProgress(players: Array<{ legsWon: number; setsWon: number }>): string {
  return `Set ${getCurrentSetNumber(players)} · Leg ${getCurrentLegNumber(players)}`;
}
