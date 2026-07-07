"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  deleteActiveMatchForOwner,
  fetchActiveMatchForOwner,
  upsertActiveMatchForOwner,
} from "@/lib/supabase/queries/active-matches";
import { getActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useX01Store } from "@/features/x01/store/x01-store";

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

export function useActiveMatchCloudSync(userId: string | undefined, authLoading = false) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    hydratedRef.current = false;
    useActiveMatchCloudStore.getState().setHydrated(false);

    if (!userId) {
      useActiveMatchCloudStore.getState().reset();
      useX01Store.getState().reset();
      useCricketStore.getState().reset();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      hydratedRef.current = true;
      useActiveMatchCloudStore.getState().setHydrated(true);
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function hydrate() {
      try {
        const cloudMatch = await fetchActiveMatchForOwner(client, userId!);

        if (cancelled) {
          return;
        }

        useActiveMatchCloudStore.getState().setSnapshot(cloudMatch);
        hydratedRef.current = true;
        useActiveMatchCloudStore.getState().setHydrated(true);
      } catch (error) {
        console.error(
          "Failed to hydrate active match from Supabase",
          formatSupabaseError(error),
        );
        hydratedRef.current = true;
        useActiveMatchCloudStore.getState().setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const client = supabase;

    const syncActiveMatch = debounce(async () => {
      try {
        const snapshot = getActiveMatchSnapshot(userId);

        if (!snapshot) {
          useActiveMatchCloudStore.getState().setSnapshot(null);

          if (!hydratedRef.current) {
            return;
          }

          await deleteActiveMatchForOwner(client, userId);
          return;
        }

        useActiveMatchCloudStore.getState().setSnapshot(snapshot);
        await upsertActiveMatchForOwner(client, userId, snapshot);
      } catch (error) {
        console.error(
          "Failed to sync active match to Supabase",
          formatSupabaseError(error),
        );
      }
    }, 800);

    const unsubscribeX01 = useX01Store.subscribe((state, previousState) => {
      if (state.game === previousState.game) {
        return;
      }

      syncActiveMatch();
    });

    const unsubscribeCricket = useCricketStore.subscribe((state, previousState) => {
      if (state.game === previousState.game) {
        return;
      }

      syncActiveMatch();
    });

    return () => {
      syncActiveMatch.cancel();
      unsubscribeX01();
      unsubscribeCricket();
    };
  }, [authLoading, userId]);
}
