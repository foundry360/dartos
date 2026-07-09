import { formatBullChallengeElapsed } from "@/features/practice/lib/bull-challenge";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

export function formatPracticeSessionSummary(entry: PracticeSessionHistoryEntry): string {
  if (entry.durationSeconds != null && entry.metadata.bullChallenge) {
    return formatBullChallengeElapsed(entry.durationSeconds);
  }

  if (entry.durationSeconds != null && entry.metadata.timedPractice) {
    return formatBullChallengeElapsed(entry.durationSeconds);
  }

  if (entry.successes != null && entry.attempts != null && entry.attempts > 0) {
    const rate = Math.round((entry.successes / entry.attempts) * 100);
    return `${entry.successes}/${entry.attempts} · ${rate}%`;
  }

  if (entry.dartsThrown > 0) {
    return `${entry.dartsThrown} darts`;
  }

  return "Completed";
}

export function formatPracticeSessionDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}
