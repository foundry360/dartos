import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import type { SavedPlayerProfile } from "@/types/player-setup";

export function resolveMatchOpponentNickname(
  match: MatchHistoryEntry,
  cloudProfiles: SavedPlayerProfile[],
  getNickname: (profile: { nickname?: string | null; name: string }) => string,
) {
  if (match.opponentName.trim()) {
    return match.opponentName.trim();
  }

  if (match.opponentId) {
    const savedOpponent = cloudProfiles.find((profile) => profile.id === match.opponentId);

    if (savedOpponent) {
      return getNickname(savedOpponent);
    }
  }

  return "Opponent";
}
