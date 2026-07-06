"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchSavedPlayerStatsForOwner,
  upsertSavedPlayerStats,
} from "@/lib/supabase/queries/saved-player-stats";
import { initialStats } from "@/features/statistics/store/statistics-store";
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

  useEffect(() => {
    hydratedRef.current = false;

    if (!userId) {
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

        hydrateFromCloud(remoteStatsByProfileId);

        const mergedByProfileId = useSavedPlayerStatsStore.getState().byProfileId;

        await Promise.all(
          Object.entries(mergedByProfileId).map(async ([profileId, stats]) => {
            const remoteStats = remoteStatsByProfileId[profileId] ?? initialStats;

            if (stats.dartsThrown > remoteStats.dartsThrown) {
              await upsertSavedPlayerStats(client, profileId, stats);
            }
          }),
        );

        hydratedRef.current = true;
      } catch (error) {
        console.error("Failed to hydrate saved player stats from Supabase", error);
        hydratedRef.current = true;
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromCloud, userId]);

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
