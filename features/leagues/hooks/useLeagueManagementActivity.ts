"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchLeagueManagementActivity,
  type LeagueManagementActivityItem,
} from "@/lib/supabase/queries/league-management-activity";

export function useLeagueManagementActivity(enabled = true) {
  const { user } = useAuth();
  const [activity, setActivity] = useState<LeagueManagementActivityItem[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured() && enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !isSupabaseConfigured()) {
      setActivity([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setActivity([]);
        return;
      }

      const remote = await fetchLeagueManagementActivity(supabase, 8);
      setActivity(remote);
    } catch (caught) {
      console.error("Failed to load league management activity", caught);
      setActivity([]);
      setError("Unable to load recent activity.");
    } finally {
      setLoading(false);
    }
  }, [enabled, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    activity,
    loading,
    error,
    refresh: load,
  };
}
