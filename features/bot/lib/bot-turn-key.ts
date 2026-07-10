interface BotTurnGameSnapshot {
  matchId?: string;
  legsPlayed?: number;
  roundIndex?: number;
  currentPlayerIndex: number;
  history: { length: number };
}

export function buildBotTurnKey(game: BotTurnGameSnapshot): string {
  const cycleKey = game.legsPlayed ?? game.roundIndex ?? 0;

  return [
    game.matchId,
    cycleKey,
    game.currentPlayerIndex,
    game.history.length,
  ].join(":");
}
