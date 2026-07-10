"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteMatchHistoryEntry } from "@/lib/supabase/queries/match-history";
import { useHeadToHeadStore } from "@/features/match-play/store/head-to-head-store";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";

export function useDeleteMatchHistoryEntry(userId: string | undefined) {
  return useCallback(
    (match: MatchHistoryEntry) => {
      const removed = useMatchHistoryStore.getState().removeMatch(match.id);

      if (!removed) {
        return;
      }

      if (removed.opponentId) {
        useHeadToHeadStore.getState().reverseMatch(removed.opponentId, removed.userWon);
      }

      if (!userId) {
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        return;
      }

      void deleteMatchHistoryEntry(supabase, userId, match.id).catch((error) => {
        console.error("Failed to delete match history entry from Supabase", error);
      });
    },
    [userId],
  );
}
