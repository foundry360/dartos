"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSampleRegisteredLeagues } from "@/features/leagues/lib/sample-league-dashboard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchMyRegisteredLeagues,
  type LeagueWithVenue,
} from "@/lib/supabase/queries/leagues";

function withLocalSampleLeagues(remote: LeagueWithVenue[]): LeagueWithVenue[] {
  if (process.env.NODE_ENV !== "development") {
    return remote;
  }

  const samples = getSampleRegisteredLeagues();
  const remoteIds = new Set(remote.map((entry) => entry.league.id));
  const missingSamples = samples.filter(
    (entry) => !remoteIds.has(entry.league.id),
  );

  return [...missingSamples, ...remote];
}

export function useMyRegisteredLeagues() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<LeagueWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLeagues(withLocalSampleLeagues([]));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase) {
        setLeagues(withLocalSampleLeagues([]));
        return;
      }

      const remote = await fetchMyRegisteredLeagues(supabase);
      setLeagues(withLocalSampleLeagues(remote));
    } catch (caught) {
      console.error("Failed to load registered leagues", caught);
      setLeagues(withLocalSampleLeagues([]));
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load your leagues.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    leagues,
    loading,
    error,
    refresh,
    isCloudConfigured: isSupabaseConfigured(),
  };
}
