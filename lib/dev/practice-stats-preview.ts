import { SAMPLE_PRACTICE_SESSIONS } from "@/features/practice/lib/sample-practice-sessions";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

export function isPracticeStatsSampleForced(
  sampleParam: string | null | undefined,
): boolean {
  return process.env.NODE_ENV === "development" && sampleParam === "1";
}

export function resolvePracticeStatsSessions(
  sessions: PracticeSessionHistoryEntry[],
  sampleParam?: string | null,
): PracticeSessionHistoryEntry[] {
  if (sessions.length > 0 && !isPracticeStatsSampleForced(sampleParam)) {
    return sessions;
  }

  if (process.env.NODE_ENV === "development" || sampleParam === "1") {
    return SAMPLE_PRACTICE_SESSIONS;
  }

  return sessions;
}
