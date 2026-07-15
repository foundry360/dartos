"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type {
  DraftLeagueMatch,
  LeagueScheduleModel,
  ScheduleRules,
} from "@/features/leagues/lib/league-schedule";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchLeagueSchedule,
  saveLeagueSchedule,
} from "@/lib/supabase/queries/league-schedules";

function isSampleLeagueId(leagueId: string) {
  return leagueId.startsWith("sample-");
}

const sampleSchedules = new Map<string, LeagueScheduleModel>();

export function useLeagueSchedule(leagueId: string | undefined) {
  const { user } = useAuth();
  const sampleMode = Boolean(leagueId && isSampleLeagueId(leagueId));
  const [schedule, setSchedule] = useState<LeagueScheduleModel | null>(null);
  const [loading, setLoading] = useState(Boolean(leagueId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!leagueId) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    if (isSampleLeagueId(leagueId)) {
      setSchedule(sampleSchedules.get(leagueId) ?? null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setSchedule(null);
        return;
      }

      setSchedule(await fetchLeagueSchedule(supabase, leagueId));
    } catch (caught) {
      console.error("Failed to load league schedule", caught);
      setSchedule(null);
      setError(
        caught instanceof Error ? caught.message : "Unable to load schedule.",
      );
    } finally {
      setLoading(false);
    }
  }, [leagueId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (input: {
      rules: ScheduleRules;
      matches: DraftLeagueMatch[];
      publish: boolean;
    }) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      setSaving(true);
      setError(null);

      try {
        if (isSampleLeagueId(leagueId)) {
          const now = new Date().toISOString();
          const previous = sampleSchedules.get(leagueId);
          const next: LeagueScheduleModel = {
            id: previous?.id ?? `sample-schedule-${leagueId}`,
            leagueId,
            status: input.publish ? "published" : "draft",
            frequency: input.rules.frequency,
            matchWeekday: input.rules.matchWeekday,
            matchTime: input.rules.matchTime,
            weeks: input.rules.weeks,
            matchesPerNight: input.rules.matchesPerNight,
            pattern: input.rules.pattern,
            publishedAt: input.publish
              ? now
              : previous?.publishedAt ?? null,
            matches: input.matches.map((match, index) => ({
              ...match,
              key: match.key || `sample-match-${index}`,
            })),
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
          };
          sampleSchedules.set(leagueId, next);
          setSchedule(next);
          return next;
        }

        const supabase = createClient();

        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const saved = await saveLeagueSchedule(supabase, {
          leagueId,
          rules: input.rules,
          matches: input.matches,
          publish: input.publish,
        });
        setSchedule(saved);
        return saved;
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Unable to save schedule.";
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [leagueId],
  );

  return {
    schedule,
    loading,
    saving,
    error,
    sampleMode,
    refresh: load,
    save,
    setSchedule,
  };
}
