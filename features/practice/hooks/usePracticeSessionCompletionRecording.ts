"use client";

import { useEffect, useRef } from "react";
import {
  buildPracticeSessionHistoryEntry,
  isPracticeDrillCompleted,
} from "@/features/practice/lib/build-practice-session-summary";
import { usePracticeStatsStore } from "@/features/practice/store/practice-stats-store";
import type {
  PracticeCompletionState,
  PracticeSessionSnapshot,
} from "@/types/practice-stats";

export function usePracticeSessionCompletionRecording(
  userId: string | undefined,
  snapshot: PracticeSessionSnapshot | null,
  completion: PracticeCompletionState,
) {
  const snapshotRef = useRef(snapshot);
  const wasCompleteRef = useRef(false);

  snapshotRef.current = snapshot;

  useEffect(() => {
    const isComplete = isPracticeDrillCompleted(completion);

    if (!userId || !snapshotRef.current) {
      wasCompleteRef.current = isComplete;
      return;
    }

    if (isComplete && !wasCompleteRef.current) {
      const entry = buildPracticeSessionHistoryEntry(snapshotRef.current, completion);

      if (entry) {
        usePracticeStatsStore.getState().addSession(entry);
      }
    }

    wasCompleteRef.current = isComplete;
  }, [
    userId,
    completion.bullChallengeComplete,
    completion.bullCountComplete,
    completion.treble20Complete,
    completion.scoring99Complete,
    completion.bigFishComplete,
    completion.randomCheckoutComplete,
    completion.threeDartCheckoutComplete,
    completion.targetPracticeComplete,
    completion.timedOut,
  ]);
}
