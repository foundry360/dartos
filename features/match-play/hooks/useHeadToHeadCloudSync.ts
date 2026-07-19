"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  fetchHeadToHeadForOwner,
  type HeadToHeadRecord,
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
  const pendingRecordsRef = useRef<Record<string, HeadToHeadRecord>>({});
  const hydrateFromCloud = useHeadToHeadStore((state) => state.hydrateFromCloud);
  const reset = useHeadToHeadStore((state) => state.reset);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    hydratedRef.current = false;
    pendingRecordsRef.current = {};

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

        const localAhead = hydrateFromCloud(records);
        hydratedRef.current = true;

        const pending = {
          ...Object.fromEntries(localAhead.map((record) => [record.opponentId, record])),
          ...pendingRecordsRef.current,
        };
        pendingRecordsRef.current = {};

        try {
          await Promise.all(
            Object.values(pending).map((record) =>
              upsertHeadToHeadRecord(client, userId!, record),
            ),
          );
        } catch (error) {
          console.error(
            "Failed to sync pending head-to-head records to Supabase",
            formatSupabaseError(error),
          );
        }
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

    const syncRecords = debounce(async (byOpponentId: Record<string, HeadToHeadRecord>) => {
      if (!hydratedRef.current) {
        pendingRecordsRef.current = { ...byOpponentId };
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
    }, 800);

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
