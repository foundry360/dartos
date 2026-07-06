export function getPlayerScorecardName(player: {
  name: string;
  nickname?: string | null;
}): string {
  const nickname = player.nickname?.trim();
  return nickname || player.name;
}
