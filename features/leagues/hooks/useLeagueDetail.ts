"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getSampleLeagueById,
  shouldUseLeagueManagementSample,
} from "@/features/leagues/lib/sample-league-dashboard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchLeagueById,
  type LeagueWithVenue,
} from "@/lib/supabase/queries/leagues";

export function useLeagueDetail(leagueId: string | undefined) {
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueWithVenue | null>(null);
  const [loading, setLoading] = useState(
    Boolean(leagueId) && isSupabaseConfigured(),
  );
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!leagueId) {
      setLoading(false);
      setLeague(null);
      setNotFound(false);
      return;
    }

    const sampleLeague = shouldUseLeagueManagementSample()
      ? getSampleLeagueById(leagueId)
      : null;

    if (sampleLeague) {
      setLeague(sampleLeague);
      setError(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      setLeague(null);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setLeague(null);
        setNotFound(Boolean(user === null));
        return;
      }

      const result = await fetchLeagueById(supabase, leagueId);

      if (!result) {
        setLeague(null);
        setNotFound(true);
        return;
      }

      setLeague(result);
    } catch (caught) {
      console.error("Failed to load league", caught);
      setLeague(null);
      setError("Unable to load league.");
    } finally {
      setLoading(false);
    }
  }, [leagueId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    league,
    loading,
    error,
    notFound,
    isCloudConfigured: isSupabaseConfigured(),
    refresh: load,
  };
}
