import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";

export function formatMatchLegs(match: Pick<MatchHistoryEntry, "userLegs" | "opponentLegs">) {
  return `(Legs: ${match.userLegs}-${match.opponentLegs})`;
}
