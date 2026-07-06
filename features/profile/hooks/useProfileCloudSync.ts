"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPlayerStats,
  pickAuthoritativeStats,
  upsertPlayerStats,
} from "@/lib/supabase/queries/player-stats";
import { fetchProfile } from "@/lib/supabase/queries/profile";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";

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

export function useProfileCloudSync(userId: string | undefined) {
  const hydratedRef = useRef(false);
  const setStats = useStatisticsStore((state) => state.setStats);
  const setAvatarUrl = useProfileStore((state) => state.setAvatarUrl);
  const setDisplayName = useProfileStore((state) => state.setDisplayName);
  const setNickname = useProfileStore((state) => state.setNickname);

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
    const activeUserId = userId;
    let cancelled = false;

    async function hydrate() {
      try {
        const [remoteStats, profile] = await Promise.all([
          fetchPlayerStats(client, activeUserId),
          fetchProfile(client, activeUserId),
        ]);

        if (cancelled) {
          return;
        }

        const localStats = useStatisticsStore.getState().stats;
        const mergedStats = pickAuthoritativeStats(localStats, remoteStats);

        setStats(mergedStats);

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          if (profile.display_name) {
            setDisplayName(profile.display_name);
          }
          setNickname(profile.nickname);
        }

        if (!remoteStats || localStats.dartsThrown > remoteStats.dartsThrown) {
          await upsertPlayerStats(client, activeUserId, mergedStats);
        }

        hydratedRef.current = true;
      } catch (error) {
        console.error("Failed to hydrate profile stats from Supabase", error);
        hydratedRef.current = true;
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [setAvatarUrl, setDisplayName, setNickname, setStats, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const client = supabase;
    const activeUserId = userId;

    const syncStats = debounce(async (stats: ReturnType<typeof useStatisticsStore.getState>["stats"]) => {
      if (!hydratedRef.current) {
        return;
      }

      try {
        await upsertPlayerStats(client, activeUserId, stats);
      } catch (error) {
        console.error("Failed to sync player stats to Supabase", error);
      }
    }, 800);

    const unsubscribe = useStatisticsStore.subscribe((state, previousState) => {
      if (state.stats === previousState.stats) {
        return;
      }

      syncStats(state.stats);
    });

    return () => {
      syncStats.cancel();
      unsubscribe();
    };
  }, [userId]);
}
