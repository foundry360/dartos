import type { StatsPeriod } from "@/features/statistics/lib/stats-period";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

function getPeriodStart(period: StatsPeriod, now = new Date()) {
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }

  return null;
}

export function filterPracticeSessionsByPeriod(
  sessions: PracticeSessionHistoryEntry[],
  period: StatsPeriod,
  now = new Date(),
) {
  const periodStart = getPeriodStart(period, now);

  if (!periodStart) {
    return sessions;
  }

  return sessions.filter((session) => new Date(session.completedAt) >= periodStart);
}

export function getPracticeStatsPeriodChartHint(period: StatsPeriod): string {
  switch (period) {
    case "month":
      return "This month";
    case "year":
      return "This year";
    default:
      return "All sessions";
  }
}
