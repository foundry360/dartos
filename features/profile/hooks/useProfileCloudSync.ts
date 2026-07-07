"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPlayerStats,
  pickAuthoritativeStatsForSync,
  upsertPlayerStats,
} from "@/lib/supabase/queries/player-stats";
import { fetchProfile } from "@/lib/supabase/queries/profile";
import {
  clearLegacyStatsStorage,
  mergeLegacyUserStats,
  readLegacyUserStats,
} from "@/features/statistics/lib/legacy-stats-storage";
import { normalizeFavoritePractice } from "@/features/profile/lib/profile-options";
import { useProfileStore } from "@/features/profile/store/profile-store";
import {
  initialStats,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";

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

function logSupabaseError(context: string, error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as { message?: string; code?: string; details?: string };
    console.error(context, candidate.message ?? candidate.details ?? error);
    return;
  }

  console.error(context, error);
}

export function useProfileCloudSync(userId: string | undefined) {
  const hydratedRef = useRef(false);
  const setStats = useStatisticsStore((state) => state.setStats);
  const setHydrated = useStatisticsStore((state) => state.setHydrated);
  const setHydrating = useStatisticsStore((state) => state.setHydrating);
  const setAvatarUrl = useProfileStore((state) => state.setAvatarUrl);
  const setDisplayName = useProfileStore((state) => state.setDisplayName);
  const setNickname = useProfileStore((state) => state.setNickname);
  const applyPreferences = useProfileStore((state) => state.applyPreferences);

  useEffect(() => {
    hydratedRef.current = false;

    if (!userId) {
      setStats(initialStats);
      setHydrated(true);
      setHydrating(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setHydrated(true);
      setHydrating(false);
      return;
    }

    const client = supabase;
    const activeUserId = userId;
    let cancelled = false;

    async function hydrate() {
      setHydrating(true);

      let remoteStats: ReturnType<typeof useStatisticsStore.getState>["stats"] | null = null;
      let profile: Awaited<ReturnType<typeof fetchProfile>> = null;

      try {
        remoteStats = await fetchPlayerStats(client, activeUserId);
      } catch (error) {
        logSupabaseError("Failed to load player stats from Supabase", error);
      }

      try {
        profile = await fetchProfile(client, activeUserId);
      } catch (error) {
        logSupabaseError("Failed to load profile from Supabase", error);
      }

      if (cancelled) {
        return;
      }

      const currentStats = useStatisticsStore.getState().stats;
      const mergedStats = mergeLegacyUserStats(remoteStats, currentStats);
      const authoritativeStats = pickAuthoritativeStatsForSync(mergedStats, remoteStats);

      setStats(authoritativeStats);

      if (profile) {
        setAvatarUrl(profile.avatar_url);
        if (profile.display_name) {
          setDisplayName(profile.display_name);
        }
        setNickname(profile.nickname);
        applyPreferences({
          throwingHand: profile.throwing_hand as "right" | "left" | null,
          skillLevel: profile.skill_level as
            | "beginner"
            | "intermediate"
            | "advanced"
            | "pro"
            | null,
          preferredGame: profile.preferred_game as "501" | "301" | "701" | "cricket" | null,
          homeLeague: profile.home_league,
          favoriteDouble: profile.favorite_double,
          favoritePractice: profile.favorite_practice
            ? normalizeFavoritePractice(profile.favorite_practice)
            : null,
          defaultMatch: profile.default_match as
            | "501-double-out"
            | "301-double-out"
            | "701-double-out"
            | "cricket"
            | null,
          memberSince: profile.created_at,
        });
      }

      try {
        await upsertPlayerStats(client, activeUserId, authoritativeStats);
      } catch (error) {
        logSupabaseError("Failed to sync player stats to Supabase", error);
      }

      if (readLegacyUserStats()) {
        clearLegacyStatsStorage();
      }

      if (!cancelled) {
        hydratedRef.current = true;
        setHydrated(true);
        setHydrating(false);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [applyPreferences, setAvatarUrl, setDisplayName, setHydrated, setHydrating, setNickname, setStats, userId]);

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
        logSupabaseError("Failed to sync player stats to Supabase", error);
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
