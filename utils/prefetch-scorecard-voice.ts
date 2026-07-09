import { getPlayerScorecardName } from "@/lib/player-display";
import { prefetchMatchPlayerVoices } from "@/utils/speech";

export function prefetchScorecardVoice(player: {
  name: string;
  nickname?: string | null;
}): void {
  const scorecardName = getPlayerScorecardName(player);
  prefetchMatchPlayerVoices([scorecardName]);
}

export function prefetchScorecardVoices(
  players: Array<{ name: string; nickname?: string | null }>,
): void {
  for (const player of players) {
    prefetchScorecardVoice(player);
  }
}
