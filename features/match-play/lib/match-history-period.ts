import type { StatsPeriod } from "@/features/statistics/lib/stats-period";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";

function getPeriodStart(period: StatsPeriod, now = new Date()) {
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }

  return null;
}

export function filterMatchesByPeriod(
  matches: MatchHistoryEntry[],
  period: StatsPeriod,
  now = new Date(),
) {
  const periodStart = getPeriodStart(period, now);

  if (!periodStart) {
    return matches;
  }

  return matches.filter((match) => new Date(match.playedAt) >= periodStart);
}

export function formatMatchPlayedDate(playedAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(playedAt));
}
