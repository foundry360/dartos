"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createLeague,
  fetchMyLeagues,
  type CreateLeagueInput,
  type LeagueWithVenue,
} from "@/lib/supabase/queries/leagues";

export function useLeagues() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<LeagueWithVenue[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeagues = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setLeagues([]);
        return;
      }

      const remote = await fetchMyLeagues(supabase);
      setLeagues(remote);
    } catch (caught) {
      console.error("Failed to load leagues", caught);
      setLeagues([]);
      setError("Unable to load leagues.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadLeagues();
  }, [loadLeagues]);

  const create = useCallback(
    async (input: CreateLeagueInput): Promise<LeagueWithVenue> => {
      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to create a league.");
      }

      setSaving(true);
      setError(null);

      try {
        const created = await createLeague(supabase, input);
        setLeagues((current) => [created, ...current]);
        return created;
      } catch (caught) {
        console.error("Failed to create league", caught);
        throw caught instanceof Error
          ? caught
          : new Error("Unable to create league.");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    leagues,
    loading,
    saving,
    error,
    isCloudConfigured: isSupabaseConfigured(),
    refresh: loadLeagues,
    createLeague: create,
  };
}
