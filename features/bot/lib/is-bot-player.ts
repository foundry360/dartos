export function isBotPlayer(
  player: { playerKind?: "human" | "bot"; botDifficultyId?: string } | undefined,
): boolean {
  return player?.playerKind === "bot" || player?.botDifficultyId != null;
}
