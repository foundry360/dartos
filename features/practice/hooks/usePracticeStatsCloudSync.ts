"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPracticeSessionHistoryForOwner,
  insertPracticeSessionHistoryEntry,
} from "@/lib/supabase/queries/practice-session-history";
import { usePracticeStatsStore } from "@/features/practice/store/practice-stats-store";

export function usePracticeStatsCloudSync(userId: string | undefined, authLoading = false) {
  const hydratedRef = useRef(false);
  const hydrateFromCloud = usePracticeStatsStore((state) => state.hydrateFromCloud);
  const reset = usePracticeStatsStore((state) => state.reset);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    hydratedRef.current = false;

    if (!userId) {
      reset();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      usePracticeStatsStore.getState().setHydrated(true);
      hydratedRef.current = true;
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function hydrate() {
      try {
        const sessions = await fetchPracticeSessionHistoryForOwner(client, userId!);

        if (cancelled) {
          return;
        }

        hydrateFromCloud(sessions);
        hydratedRef.current = true;
      } catch (error) {
        console.error("Failed to hydrate practice stats from Supabase", error);
        if (!cancelled) {
          hydratedRef.current = true;
          usePracticeStatsStore.getState().setHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      if (!hydratedRef.current) {
        usePracticeStatsStore.getState().setHydrated(true);
      }
    };
  }, [authLoading, hydrateFromCloud, reset, userId]);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const client = supabase;

    const unsubscribe = usePracticeStatsStore.subscribe((state, previousState) => {
      if (state.sessions === previousState.sessions || !hydratedRef.current) {
        return;
      }

      const previousIds = new Set(previousState.sessions.map((session) => session.id));
      const newSessions = state.sessions.filter((session) => !previousIds.has(session.id));

      for (const session of newSessions) {
        void insertPracticeSessionHistoryEntry(client, userId, session).catch((error) => {
          console.error("Failed to sync practice session to Supabase", error);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [authLoading, userId]);
}
