"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMatchHistoryForOwner,
  insertMatchHistoryEntry,
} from "@/lib/supabase/queries/match-history";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";

export function useMatchHistoryCloudSync(userId: string | undefined, authLoading = false) {
  const hydratedRef = useRef(false);
  const hydrateFromCloud = useMatchHistoryStore((state) => state.hydrateFromCloud);
  const reset = useMatchHistoryStore((state) => state.reset);

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
      useMatchHistoryStore.getState().setHydrated(true);
      hydratedRef.current = true;
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function hydrate() {
      try {
        const matches = await fetchMatchHistoryForOwner(client, userId!);

        if (cancelled) {
          return;
        }

        hydrateFromCloud(matches);
        hydratedRef.current = true;
      } catch (error) {
        console.error("Failed to hydrate match history from Supabase", error);
        if (!cancelled) {
          hydratedRef.current = true;
          useMatchHistoryStore.getState().setHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      if (!hydratedRef.current) {
        useMatchHistoryStore.getState().setHydrated(true);
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

    const unsubscribe = useMatchHistoryStore.subscribe((state, previousState) => {
      if (state.matches === previousState.matches || !hydratedRef.current) {
        return;
      }

      const previousIds = new Set(previousState.matches.map((match) => match.id));
      const newMatches = state.matches.filter((match) => !previousIds.has(match.id));

      for (const match of newMatches) {
        void insertMatchHistoryEntry(client, userId, match).catch((error) => {
          console.error("Failed to sync match history entry to Supabase", error);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [authLoading, userId]);
}
