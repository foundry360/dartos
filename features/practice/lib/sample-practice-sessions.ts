import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

function daysAgo(days: number, hour = 12): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function session(
  partial: Omit<PracticeSessionHistoryEntry, "id" | "config" | "metadata"> & {
    config?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
): PracticeSessionHistoryEntry {
  return {
    id: crypto.randomUUID(),
    config: partial.config ?? {},
    metadata: partial.metadata ?? {},
    ...partial,
  };
}

/** Representative completed drills for layout and chart previews in development. */
export const SAMPLE_PRACTICE_SESSIONS: PracticeSessionHistoryEntry[] = [
  session({
    drillId: "random-checkout-10",
    drillTitle: "Random Checkout · 2–40 · 10 attempts · Double out",
    startedAt: daysAgo(14, 10),
    completedAt: daysAgo(14, 10),
    dartsThrown: 28,
    successes: 6,
    attempts: 10,
    durationSeconds: null,
    config: { range: "2-40", attempts: 10, outRule: "double_out" },
    metadata: { randomCheckout: { successes: 6, attemptsCompleted: 10 } },
  }),
  session({
    drillId: "scoring-99-10",
    drillTitle: "Scoring 99 · 10 visits",
    startedAt: daysAgo(12, 18),
    completedAt: daysAgo(12, 18),
    dartsThrown: 30,
    successes: 7,
    attempts: 10,
    durationSeconds: null,
    metadata: { scoring99: { successes: 7, visitsCompleted: 10 } },
  }),
  session({
    drillId: "treble-20-only-30",
    drillTitle: "Treble 20 Only · 30 darts",
    startedAt: daysAgo(11, 9),
    completedAt: daysAgo(11, 9),
    dartsThrown: 30,
    successes: 14,
    attempts: 30,
    durationSeconds: null,
    metadata: {
      treble20: {
        t20Hits: 14,
        s20Hits: 8,
        d20Hits: 2,
        misses: 6,
        hitPercentage: 46.7,
        averageScorePerDart: 32.7,
      },
    },
  }),
  session({
    drillId: "25-bull-challenge",
    drillTitle: "25 Bull Challenge",
    startedAt: daysAgo(10, 20),
    completedAt: daysAgo(10, 20),
    dartsThrown: 38,
    successes: 25,
    attempts: 25,
    durationSeconds: 94,
    metadata: {
      bullChallenge: {
        bullsHit: 25,
        outerBulls: 14,
        innerBulls: 11,
        misses: 13,
        dartsThrown: 38,
      },
    },
  }),
  session({
    drillId: "round-the-clock-singles",
    drillTitle: "Around the Clock · Singles",
    startedAt: daysAgo(9, 11),
    completedAt: daysAgo(9, 11),
    dartsThrown: 52,
    successes: 20,
    attempts: 20,
    durationSeconds: null,
    metadata: { roundTheClock: { targetsCompleted: 20, targetCount: 20, dartsThrown: 52 } },
  }),
  session({
    drillId: "big-fish-10",
    drillTitle: "Big Fish · 10 visits",
    startedAt: daysAgo(7, 16),
    completedAt: daysAgo(7, 16),
    dartsThrown: 27,
    successes: 4,
    attempts: 10,
    durationSeconds: null,
    metadata: { bigFish: { successes: 4, visitsCompleted: 10 } },
  }),
  session({
    drillId: "three-dart-checkout-20",
    drillTitle: "3-Dart Checkout · 20 attempts",
    startedAt: daysAgo(6, 13),
    completedAt: daysAgo(6, 13),
    dartsThrown: 54,
    successes: 11,
    attempts: 20,
    durationSeconds: null,
    metadata: { threeDartCheckout: { successes: 11, attemptsCompleted: 20 } },
  }),
  session({
    drillId: "bull-count",
    drillTitle: "Bull Count · 75 darts",
    startedAt: daysAgo(5, 8),
    completedAt: daysAgo(5, 8),
    dartsThrown: 75,
    successes: 41,
    attempts: 75,
    durationSeconds: null,
    metadata: {
      bullCount: {
        bullsHit: 41,
        outerBulls: 24,
        innerBulls: 17,
        misses: 34,
        bullPercentage: 54.7,
      },
    },
  }),
  session({
    drillId: "random-checkout-20",
    drillTitle: "Random Checkout · Full board · 20 attempts · Master out",
    startedAt: daysAgo(4, 19),
    completedAt: daysAgo(4, 19),
    dartsThrown: 61,
    successes: 9,
    attempts: 20,
    durationSeconds: null,
    config: { range: "full", attempts: 20, outRule: "master_out" },
    metadata: { randomCheckout: { successes: 9, attemptsCompleted: 20 } },
  }),
  session({
    drillId: "timed-10-minute",
    drillTitle: "Timed Practice · 10 minutes",
    startedAt: daysAgo(3, 7),
    completedAt: daysAgo(3, 7),
    dartsThrown: 0,
    successes: null,
    attempts: null,
    durationSeconds: 600,
    metadata: { timedPractice: true },
  }),
  session({
    drillId: "scoring-99-20",
    drillTitle: "Scoring 99 · 20 visits",
    startedAt: daysAgo(2, 15),
    completedAt: daysAgo(2, 15),
    dartsThrown: 58,
    successes: 13,
    attempts: 20,
    durationSeconds: null,
    metadata: { scoring99: { successes: 13, visitsCompleted: 20 } },
  }),
  session({
    drillId: "treble-20-only-60",
    drillTitle: "Treble 20 Only · 60 darts",
    startedAt: daysAgo(1, 12),
    completedAt: daysAgo(1, 12),
    dartsThrown: 60,
    successes: 29,
    attempts: 60,
    durationSeconds: null,
    metadata: {
      treble20: {
        t20Hits: 29,
        s20Hits: 15,
        d20Hits: 4,
        misses: 12,
        hitPercentage: 48.3,
        averageScorePerDart: 34.2,
      },
    },
  }),
];
