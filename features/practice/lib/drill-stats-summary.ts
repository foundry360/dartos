import { formatBullChallengeElapsed } from "@/features/practice/lib/bull-challenge";
import type { PracticeStatsDrillId } from "@/features/practice/lib/practice-stats-drills";
import {
  formatPracticeCount,
  formatPracticePercent,
} from "@/features/practice/lib/practice-stats-dashboard";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

export interface DrillStatCardDonut {
  fillPercent: number;
  displayValue: string;
  caption: string;
  empty?: boolean;
}

export interface DrillStatCard {
  label: string;
  value: string;
  hint?: string;
  donut?: DrillStatCardDonut;
}

export interface DrillStatsSummary {
  cards: DrillStatCard[];
}

interface SuccessRateTotals {
  successPercent: number | null;
  totalAttempts: number;
  totalDarts: number;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function minValue(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.min(...values);
}

function readNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function computeSuccessRateTotals(sessions: PracticeSessionHistoryEntry[]): SuccessRateTotals {
  const scorableSessions = sessions.filter(
    (session) => session.successes != null && session.attempts && session.attempts > 0,
  );
  const totalSuccesses = scorableSessions.reduce(
    (sum, session) => sum + (session.successes ?? 0),
    0,
  );
  const totalAttempts = scorableSessions.reduce(
    (sum, session) => sum + (session.attempts ?? 0),
    0,
  );

  return {
    successPercent:
      totalAttempts > 0
        ? Math.round((totalSuccesses / totalAttempts) * 1000) / 10
        : null,
    totalAttempts,
    totalDarts: sessions.reduce((sum, session) => sum + session.dartsThrown, 0),
  };
}

function buildSessionsCard(sessionCount: number): DrillStatCard {
  return {
    label: "Sessions completed",
    value: formatPracticeCount(sessionCount),
    donut: {
      fillPercent: Math.min(100, sessionCount * 10),
      displayValue: sessionCount > 0 ? sessionCount.toLocaleString() : "—",
      caption: "Sessions",
      empty: sessionCount === 0,
    },
  };
}

function buildPercentDonutCard(
  label: string,
  value: string,
  percent: number | null,
  options: { hint?: string; caption?: string } = {},
): DrillStatCard {
  const caption = options.caption ?? "Rate";

  return {
    label,
    value,
    hint: options.hint,
    donut: {
      fillPercent: percent ?? 0,
      displayValue: percent != null ? `${percent.toFixed(1)}%` : "—",
      caption,
      empty: percent == null,
    },
  };
}

function buildCountDonutCard(
  label: string,
  value: string,
  count: number,
  fillPercent: number,
  options: { hint?: string; caption?: string; displayValue?: string } = {},
): DrillStatCard {
  return {
    label,
    value,
    hint: options.hint,
    donut: {
      fillPercent: clampPercent(fillPercent),
      displayValue:
        options.displayValue ?? (count > 0 ? count.toLocaleString() : "—"),
      caption: options.caption ?? "Count",
      empty: value === "—",
    },
  };
}

function buildTimeDonutCard(
  label: string,
  value: string,
  seconds: number | null,
  options: { hint?: string; caption?: string; targetSeconds?: number } = {},
): DrillStatCard {
  const targetSeconds = options.targetSeconds ?? 120;
  const fillPercent =
    seconds != null && seconds > 0 ? clampPercent((targetSeconds / seconds) * 100) : 0;

  return {
    label,
    value,
    hint: options.hint,
    donut: {
      fillPercent,
      displayValue:
        seconds != null && seconds > 0 ? formatBullChallengeElapsed(seconds) : "—",
      caption: options.caption ?? "Time",
      empty: seconds == null || seconds <= 0,
    },
  };
}

function buildSuccessRateCard(
  sessions: PracticeSessionHistoryEntry[],
  hint?: string,
): DrillStatCard {
  const { successPercent } = computeSuccessRateTotals(sessions);

  return buildPercentDonutCard(
    "Success rate",
    formatPracticePercent(successPercent),
    successPercent,
    { hint: hint ?? "Across saved attempts", caption: "Success" },
  );
}

function buildTotalDartsCard(
  sessions: PracticeSessionHistoryEntry[],
  totals: SuccessRateTotals,
  hint?: string,
): DrillStatCard {
  const fillPercent =
    totals.totalAttempts > 0
      ? clampPercent((totals.totalDarts / (totals.totalAttempts * 3)) * 100)
      : clampPercent(totals.totalDarts / 120);

  return buildCountDonutCard(
    "Total darts",
    formatPracticeCount(totals.totalDarts),
    totals.totalDarts,
    fillPercent,
    { hint: hint ?? "Across saved sessions", caption: "Darts" },
  );
}

export function buildDrillStatsSummary(
  drillId: PracticeStatsDrillId,
  sessions: PracticeSessionHistoryEntry[],
): DrillStatsSummary {
  const sessionCount = sessions.length;
  const sessionsCard = buildSessionsCard(sessionCount);
  const successTotals = computeSuccessRateTotals(sessions);

  switch (drillId) {
    case "bull-challenge": {
      const timedSessions = sessions
        .map((session) => session.durationSeconds)
        .filter((value): value is number => value != null && value > 0);
      const dartsPerSession = sessions
        .map((session) => session.dartsThrown)
        .filter((value) => value > 0);
      const bestTime = minValue(timedSessions);
      const avgDarts = average(dartsPerSession);

      return {
        cards: [
          sessionsCard,
          buildTimeDonutCard(
            "Best time",
            bestTime != null ? formatBullChallengeElapsed(bestTime) : "—",
            bestTime,
            { hint: "Fastest finish", caption: "Best", targetSeconds: 120 },
          ),
          buildCountDonutCard(
            "Avg darts",
            avgDarts != null ? formatPracticeCount(Math.round(avgDarts)) : "—",
            avgDarts != null ? Math.round(avgDarts) : 0,
            avgDarts != null ? clampPercent((45 / avgDarts) * 100) : 0,
            { hint: "Per completed run", caption: "Darts" },
          ),
        ],
      };
    }

    case "bull-count": {
      const bullPercentages = sessions
        .map((session) => {
          const bullCount = session.metadata.bullCount;

          return bullCount && typeof bullCount === "object"
            ? readNumber(bullCount as Record<string, unknown>, "bullPercentage")
            : null;
        })
        .filter((value): value is number => value != null);
      const avgBullRate =
        average(bullPercentages) != null
          ? Math.round((average(bullPercentages) ?? 0) * 10) / 10
          : null;
      const totalDarts = successTotals.totalDarts;

      return {
        cards: [
          sessionsCard,
          buildPercentDonutCard(
            "Avg bull rate",
            formatPracticePercent(avgBullRate),
            avgBullRate,
            { hint: "Across saved sets", caption: "Bulls" },
          ),
          buildCountDonutCard(
            "Total darts",
            formatPracticeCount(totalDarts),
            totalDarts,
            clampPercent(totalDarts / 225),
            { caption: "Darts" },
          ),
        ],
      };
    }

    case "treble-20": {
      const hitPercentages = sessions
        .map((session) => {
          const treble20 = session.metadata.treble20;

          return treble20 && typeof treble20 === "object"
            ? readNumber(treble20 as Record<string, unknown>, "hitPercentage")
            : null;
        })
        .filter((value): value is number => value != null);
      const averageScores = sessions
        .map((session) => {
          const treble20 = session.metadata.treble20;

          return treble20 && typeof treble20 === "object"
            ? readNumber(treble20 as Record<string, unknown>, "averageScorePerDart")
            : null;
        })
        .filter((value): value is number => value != null);
      const avgHitRate =
        average(hitPercentages) != null
          ? Math.round((average(hitPercentages) ?? 0) * 10) / 10
          : null;
      const avgPerDart =
        average(averageScores) != null
          ? Math.round((average(averageScores) ?? 0) * 10) / 10
          : null;

      return {
        cards: [
          sessionsCard,
          buildPercentDonutCard(
            "Avg T20 rate",
            formatPracticePercent(avgHitRate),
            avgHitRate,
            { hint: "Across saved sessions", caption: "T20" },
          ),
          buildCountDonutCard(
            "Avg per dart",
            avgPerDart != null ? avgPerDart.toFixed(1) : "—",
            avgPerDart != null ? Math.round(avgPerDart) : 0,
            avgPerDart != null ? clampPercent((avgPerDart / 60) * 100) : 0,
            {
              hint: "Points scored",
              caption: "Pts",
              displayValue: avgPerDart != null ? avgPerDart.toFixed(1) : "—",
            },
          ),
        ],
      };
    }

    case "timed": {
      const totalSeconds = sessions.reduce(
        (sum, session) => sum + (session.durationSeconds ?? 0),
        0,
      );
      const totalDarts = successTotals.totalDarts;

      return {
        cards: [
          sessionsCard,
          buildTimeDonutCard(
            "Total time",
            totalSeconds > 0 ? formatBullChallengeElapsed(totalSeconds) : "—",
            totalSeconds > 0 ? totalSeconds : null,
            { hint: "Saved timed sessions", caption: "Time", targetSeconds: 3600 },
          ),
          buildCountDonutCard(
            "Total darts",
            formatPracticeCount(totalDarts),
            totalDarts,
            clampPercent(totalDarts / 180),
            { caption: "Darts" },
          ),
        ],
      };
    }

    case "scoring-99":
      return {
        cards: [
          sessionsCard,
          buildSuccessRateCard(sessions, "Visits scoring exactly 99"),
          buildTotalDartsCard(sessions, successTotals),
        ],
      };

    case "round-the-clock": {
      const dartsPerSession = sessions
        .map((session) => {
          const roundTheClock = session.metadata.roundTheClock;

          return roundTheClock && typeof roundTheClock === "object"
            ? readNumber(roundTheClock as Record<string, unknown>, "dartsThrown")
            : null;
        })
        .filter((value): value is number => value != null);
      const avgDarts = average(dartsPerSession);

      return {
        cards: [
          sessionsCard,
          buildSuccessRateCard(sessions, "Targets cleared in order"),
          buildCountDonutCard(
            "Avg darts",
            avgDarts != null ? formatPracticeCount(Math.round(avgDarts)) : "—",
            avgDarts != null ? Math.round(avgDarts) : 0,
            avgDarts != null ? clampPercent((60 / avgDarts) * 100) : 0,
            { hint: "To finish the sequence", caption: "Darts" },
          ),
        ],
      };
    }

    default:
      return {
        cards: [
          sessionsCard,
          buildSuccessRateCard(sessions),
          buildTotalDartsCard(sessions, successTotals),
        ],
      };
  }
}
