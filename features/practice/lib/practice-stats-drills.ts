import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

export type PracticeStatsDrillId =
  | "bull-challenge"
  | "bull-count"
  | "treble-20"
  | "scoring-99"
  | "big-fish"
  | "random-checkout"
  | "three-dart-checkout"
  | "round-the-clock"
  | "timed";

export interface PracticeStatsDrillSection {
  id: PracticeStatsDrillId;
  label: string;
}

export const PRACTICE_STATS_DRILLS: PracticeStatsDrillSection[] = [
  { id: "bull-challenge", label: "25 Bull Challenge" },
  { id: "bull-count", label: "Bull Count" },
  { id: "treble-20", label: "Treble 20 Only" },
  { id: "scoring-99", label: "Scoring 99" },
  { id: "big-fish", label: "Big Fish" },
  { id: "random-checkout", label: "Random Checkout" },
  { id: "three-dart-checkout", label: "3-Dart Checkout" },
  { id: "round-the-clock", label: "Around the Clock" },
  { id: "timed", label: "Timed Practice" },
];

export const DEFAULT_PRACTICE_STATS_DRILL: PracticeStatsDrillId = "bull-challenge";

export function isPracticeStatsDrillId(value: string | null | undefined): value is PracticeStatsDrillId {
  return PRACTICE_STATS_DRILLS.some((drill) => drill.id === value);
}

export function parsePracticeStatsDrill(value: string | null | undefined): PracticeStatsDrillId {
  if (isPracticeStatsDrillId(value)) {
    return value;
  }

  return DEFAULT_PRACTICE_STATS_DRILL;
}

export function sessionMatchesPracticeStatsDrill(
  session: PracticeSessionHistoryEntry,
  drillId: PracticeStatsDrillId,
): boolean {
  return getPracticeStatsDrillForSession(session) === drillId;
}

export function getPracticeStatsDrillForSession(
  session: PracticeSessionHistoryEntry,
): PracticeStatsDrillId | null {
  const { drillId } = session;

  if (drillId === "25-bull-challenge") {
    return "bull-challenge";
  }

  if (drillId === "bull-count") {
    return "bull-count";
  }

  if (drillId.startsWith("treble-20-only")) {
    return "treble-20";
  }

  if (drillId.startsWith("scoring-99")) {
    return "scoring-99";
  }

  if (drillId.startsWith("big-fish")) {
    return "big-fish";
  }

  if (drillId.startsWith("random-checkout")) {
    return "random-checkout";
  }

  if (drillId.startsWith("three-dart-checkout")) {
    return "three-dart-checkout";
  }

  if (drillId.startsWith("round-the-clock")) {
    return "round-the-clock";
  }

  if (drillId.startsWith("timed")) {
    return "timed";
  }

  return null;
}

export function filterSessionsByPracticeStatsDrill(
  sessions: PracticeSessionHistoryEntry[],
  drillId: PracticeStatsDrillId,
): PracticeSessionHistoryEntry[] {
  return sessions.filter((session) => sessionMatchesPracticeStatsDrill(session, drillId));
}

export function countSessionsByPracticeStatsDrill(
  sessions: PracticeSessionHistoryEntry[],
): Record<PracticeStatsDrillId, number> {
  const counts = Object.fromEntries(
    PRACTICE_STATS_DRILLS.map((drill) => [drill.id, 0]),
  ) as Record<PracticeStatsDrillId, number>;

  for (const session of sessions) {
    const drill = getPracticeStatsDrillForSession(session);

    if (drill) {
      counts[drill] += 1;
    }
  }

  return counts;
}
