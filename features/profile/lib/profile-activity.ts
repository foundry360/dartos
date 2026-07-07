import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import type { SavedPlayerProfile } from "@/types/player-setup";
import type { ProfileActivityItem } from "@/types/profile";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diffMs < dayMs) {
    return "Today";
  }

  if (diffMs < dayMs * 2) {
    return "Yesterday";
  }

  if (diffMs < dayMs * 7) {
    return `${Math.floor(diffMs / dayMs)} days ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getOpponentName(opponentId: string, opponents: SavedPlayerProfile[]) {
  return opponents.find((profile) => profile.id === opponentId)?.name ?? "Opponent";
}

export function buildProfileActivityFeed(
  matches: MatchHistoryEntry[],
  opponents: SavedPlayerProfile[],
  stats: SessionStats,
): ProfileActivityItem[] {
  const items: ProfileActivityItem[] = [];

  for (const match of matches.slice(0, 5)) {
    const opponentName = getOpponentName(match.opponentId, opponents);
    const resultLabel = match.userWon ? "Beat" : "Lost to";

    items.push({
      id: `match-${match.id}`,
      icon: match.userWon ? "target" : "loss",
      title: `${resultLabel} ${opponentName} ${match.userLegs}-${match.opponentLegs} in ${match.matchType}`,
      subtitle: formatRelativeTime(match.playedAt),
      timestamp: match.playedAt,
    });
  }

  if (stats.highestCheckout > 0) {
    items.push({
      id: "best-checkout",
      icon: "trophy",
      title: "New Personal Best",
      subtitle: `Highest Checkout: ${stats.highestCheckout}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (stats.visits180Plus > 0) {
    items.push({
      id: "180-count",
      icon: "flame",
      title: "Maximum Scoring",
      subtitle: `${stats.visits180Plus} career 180${stats.visits180Plus === 1 ? "" : "s"}`,
      timestamp: new Date().toISOString(),
    });
  }

  return items
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 6);
}
