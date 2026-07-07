"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  fetchHeadToHeadForOwner,
  upsertHeadToHeadRecord,
} from "@/lib/supabase/queries/head-to-head";
import { useHeadToHeadStore } from "@/features/match-play/store/head-to-head-store";

function debounce<T extends (...args: never[]) => void>(fn: T, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}

export function useHeadToHeadCloudSync(userId: string | undefined, authLoading = false) {
  const hydratedRef = useRef(false);
  const hydrateFromCloud = useHeadToHeadStore((state) => state.hydrateFromCloud);
  const reset = useHeadToHeadStore((state) => state.reset);

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
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function hydrate() {
      try {
        const records = await fetchHeadToHeadForOwner(client, userId!);

        if (cancelled) {
          return;
        }

        hydrateFromCloud(records);
        hydratedRef.current = true;
      } catch (error) {
        console.error(
          "Failed to hydrate head-to-head records from Supabase",
          formatSupabaseError(error),
        );
        hydratedRef.current = true;
        useHeadToHeadStore.getState().setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
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

    const syncRecords = debounce(
      async (byOpponentId: ReturnType<typeof useHeadToHeadStore.getState>["byOpponentId"]) => {
        if (!hydratedRef.current) {
          return;
        }

        try {
          await Promise.all(
            Object.values(byOpponentId).map((record) =>
              upsertHeadToHeadRecord(client, userId, record),
            ),
          );
        } catch (error) {
          console.error(
            "Failed to sync head-to-head records to Supabase",
            formatSupabaseError(error),
          );
        }
      },
      800,
    );

    const unsubscribe = useHeadToHeadStore.subscribe((state, previousState) => {
      if (state.byOpponentId === previousState.byOpponentId) {
        return;
      }

      syncRecords(state.byOpponentId);
    });

    return () => {
      syncRecords.cancel();
      unsubscribe();
    };
  }, [authLoading, userId]);
}
