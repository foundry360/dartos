"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getSampleLeagueById,
} from "@/features/leagues/lib/sample-league-dashboard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  ensureLeagueStarterRules,
  fetchLeagueById,
  type LeagueWithVenue,
} from "@/lib/supabase/queries/leagues";

export function useLeagueDetail(leagueId: string | undefined) {
  const { user, loading: authLoading } = useAuth();
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

    // Sample league IDs always resolve from the local demo pack.
    const sampleLeague = getSampleLeagueById(leagueId);

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

    if (authLoading) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setLeague(null);
        setNotFound(false);
        return;
      }

      const result = await fetchLeagueById(supabase, leagueId);

      if (!result) {
        setLeague(null);
        setNotFound(true);
        return;
      }

      setLeague(await ensureLeagueStarterRules(supabase, result));
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : typeof caught === "object" &&
              caught &&
              "message" in caught &&
              typeof (caught as { message: unknown }).message === "string"
            ? (caught as { message: string }).message
            : "Unable to load league.";
      console.error("Failed to load league", message, caught);
      setLeague(null);
      setError(message || "Unable to load league.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, leagueId, user]);

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
    setLeague,
  };
}
