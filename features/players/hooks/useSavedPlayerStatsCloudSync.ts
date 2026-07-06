"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchSavedPlayerStatsForOwner,
  upsertSavedPlayerStats,
} from "@/lib/supabase/queries/saved-player-stats";
import {
  clearLegacyStatsStorage,
  mergeLegacySavedPlayerStats,
  readLegacySavedPlayerStats,
} from "@/features/statistics/lib/legacy-stats-storage";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";

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

export function useSavedPlayerStatsCloudSync(userId: string | undefined) {
  const hydratedRef = useRef(false);
  const hydrateFromCloud = useSavedPlayerStatsStore((state) => state.hydrateFromCloud);
  const resetAll = useSavedPlayerStatsStore((state) => state.resetAll);

  useEffect(() => {
    hydratedRef.current = false;

    if (!userId) {
      resetAll();
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
        const remoteStatsByProfileId = await fetchSavedPlayerStatsForOwner(client);

        if (cancelled) {
          return;
        }

        const mergedByProfileId = mergeLegacySavedPlayerStats(remoteStatsByProfileId);
        hydrateFromCloud(mergedByProfileId);

        await Promise.all(
          Object.entries(mergedByProfileId).map(([profileId, stats]) =>
            upsertSavedPlayerStats(client, profileId, stats),
          ),
        );

        if (Object.keys(readLegacySavedPlayerStats()).length > 0) {
          clearLegacyStatsStorage();
        }

        hydratedRef.current = true;
      } catch (error) {
        console.error("Failed to hydrate saved player stats from Supabase", error);
        hydratedRef.current = true;
        useSavedPlayerStatsStore.getState().setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromCloud, resetAll, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const client = supabase;

    const syncStats = debounce(
      async (byProfileId: ReturnType<typeof useSavedPlayerStatsStore.getState>["byProfileId"]) => {
        if (!hydratedRef.current) {
          return;
        }

        try {
          await Promise.all(
            Object.entries(byProfileId).map(([profileId, stats]) =>
              upsertSavedPlayerStats(client, profileId, stats),
            ),
          );
        } catch (error) {
          console.error("Failed to sync saved player stats to Supabase", error);
        }
      },
      800,
    );

    const unsubscribe = useSavedPlayerStatsStore.subscribe((state, previousState) => {
      if (state.byProfileId === previousState.byProfileId) {
        return;
      }

      syncStats(state.byProfileId);
    });

    return () => {
      syncStats.cancel();
      unsubscribe();
    };
  }, [userId]);
}
