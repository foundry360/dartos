export function getPlayerScorecardName(player: {
  name: string;
  nickname?: string | null;
}): string {
  const nickname = player.nickname?.trim();
  return nickname || player.name;
}

/** CSS modifier when a score needs a smaller type size to fit the card. */
export function getScoreDigitClass(score: number | string | null | undefined): string | undefined {
  const digits = String(score ?? "").replace(/\D/g, "").length;
  if (digits >= 4) {
    return "league-scoring__player-score--digits-4";
  }
  if (digits >= 3) {
    return "league-scoring__player-score--digits-3";
  }
  return undefined;
}
