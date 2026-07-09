import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";
import { formatPracticeSessionSummary } from "@/features/practice/lib/format-practice-session-summary";

export interface PracticeDrillCategorySegment {
  label: string;
  percent: number;
  hits: number;
}

export interface PracticeCompletionTrendPoint {
  index: number;
  drillTitle: string;
  summary: string;
  category: PracticeDrillCategory;
  value: 1;
}

export interface PracticeStatsDashboardData {
  completedCount: number;
  overallSuccessPercent: number | null;
  totalDartsThrown: number;
  recentOutcomeResults: boolean[];
  recentCompletions: PracticeCompletionTrendPoint[];
  drillCategorySegments: PracticeDrillCategorySegment[];
}

const DRILL_CATEGORY_LABELS = {
  checkout: "Checkout",
  scoring: "Scoring",
  target: "Target",
  bulls: "Bulls",
  timed: "Timed",
} as const;

export type PracticeDrillCategory = keyof typeof DRILL_CATEGORY_LABELS;

const EMPTY_DRILL_CATEGORY_SEGMENTS: PracticeDrillCategorySegment[] = [
  { label: "Checkout", percent: 0, hits: 0 },
  { label: "Scoring", percent: 0, hits: 0 },
  { label: "Target", percent: 0, hits: 0 },
  { label: "Bulls", percent: 0, hits: 0 },
  { label: "Timed", percent: 0, hits: 0 },
];

export function getPracticeDrillCategory(drillId: string): PracticeDrillCategory {
  if (drillId.includes("checkout")) {
    return "checkout";
  }

  if (drillId.startsWith("scoring") || drillId.startsWith("big-fish")) {
    return "scoring";
  }

  if (drillId.startsWith("timed")) {
    return "timed";
  }

  if (drillId.includes("bull") || drillId === "25-bull-challenge") {
    return "bulls";
  }

  return "target";
}

function buildRecentOutcomeResults(
  sessions: PracticeSessionHistoryEntry[],
  limit = 12,
): boolean[] {
  const results: boolean[] = [];

  for (const session of sessions) {
    if (session.successes == null || !session.attempts || session.attempts <= 0) {
      continue;
    }

    const misses = session.attempts - session.successes;

    for (let index = 0; index < session.successes; index += 1) {
      results.push(true);
    }

    for (let index = 0; index < misses; index += 1) {
      results.push(false);
    }
  }

  return results.slice(0, limit).reverse();
}

const PRACTICE_CATEGORY_COLORS: Record<PracticeDrillCategory, string> = {
  checkout: "#84c126",
  scoring: "#06b6d4",
  target: "#f59e0b",
  bulls: "#eab308",
  timed: "#a855f7",
};

export function getPracticeCategoryColor(category: PracticeDrillCategory): string {
  return PRACTICE_CATEGORY_COLORS[category];
}

function buildRecentCompletions(
  sessions: PracticeSessionHistoryEntry[],
  limit = 12,
): PracticeCompletionTrendPoint[] {
  const chronological = [...sessions].reverse().slice(-limit);

  return chronological.map((session, index) => ({
    index: index + 1,
    drillTitle: session.drillTitle,
    summary: formatPracticeSessionSummary(session),
    category: getPracticeDrillCategory(session.drillId),
    value: 1,
  }));
}

function buildDrillCategorySegments(
  sessions: PracticeSessionHistoryEntry[],
): PracticeDrillCategorySegment[] {
  if (sessions.length === 0) {
    return EMPTY_DRILL_CATEGORY_SEGMENTS;
  }

  const counts = new Map<string, number>();

  for (const session of sessions) {
    const category = getPracticeDrillCategory(session.drillId);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const total = sessions.length;

  return Object.entries(DRILL_CATEGORY_LABELS).map(([categoryId, label]) => {
    const hits = counts.get(categoryId) ?? 0;

    return {
      label,
      hits,
      percent: total > 0 ? Math.round((hits / total) * 100) : 0,
    };
  });
}

export function buildPracticeStatsDashboard(
  sessions: PracticeSessionHistoryEntry[],
): PracticeStatsDashboardData {
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
    completedCount: sessions.length,
    overallSuccessPercent:
      totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 1000) / 10 : null,
    totalDartsThrown: sessions.reduce((sum, session) => sum + session.dartsThrown, 0),
    recentOutcomeResults: buildRecentOutcomeResults(sessions),
    recentCompletions: buildRecentCompletions(sessions),
    drillCategorySegments: buildDrillCategorySegments(sessions),
  };
}

export function formatPracticeCount(value: number): string {
  return value > 0 ? value.toLocaleString() : "—";
}

export function formatPracticePercent(value: number | null): string {
  return value != null ? `${value.toFixed(1)}%` : "—";
}
