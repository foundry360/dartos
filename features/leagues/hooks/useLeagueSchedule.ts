"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type {
  DraftLeagueMatch,
  LeagueScheduleModel,
  ScheduleParticipant,
  ScheduleRules,
} from "@/features/leagues/lib/league-schedule";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { LeagueMatchStatus } from "@/features/leagues/lib/league-schedule";
import { getSampleLeagueSchedule } from "@/features/leagues/lib/sample-league-dashboard";
import {
  fetchLeagueSchedule,
  publishLeagueSchedule,
  saveLeagueSchedule,
  updateLeagueMatchParticipant,
  updateLeagueMatchStatus,
} from "@/lib/supabase/queries/league-schedules";

function isSampleLeagueId(leagueId: string) {
  return leagueId.startsWith("sample-");
}

const sampleSchedules = new Map<string, LeagueScheduleModel>();

function resolveSampleSchedule(leagueId: string): LeagueScheduleModel | null {
  const cached = sampleSchedules.get(leagueId);
  if (cached) {
    return cached;
  }

  const seeded = getSampleLeagueSchedule(leagueId);
  if (seeded) {
    sampleSchedules.set(leagueId, seeded);
  }
  return seeded;
}

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
      setSchedule(resolveSampleSchedule(leagueId));
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

  const publish = useCallback(async () => {
    if (!leagueId) {
      throw new Error("League is required.");
    }

    setSaving(true);
    setError(null);

    try {
      if (isSampleLeagueId(leagueId)) {
        const previous = sampleSchedules.get(leagueId) ?? schedule;

        if (!previous) {
          throw new Error("Create a schedule before publishing.");
        }

        const next: LeagueScheduleModel = {
          ...previous,
          status: "published",
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        sampleSchedules.set(leagueId, next);
        setSchedule(next);
        return next;
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const saved = await publishLeagueSchedule(supabase, leagueId);
      setSchedule(saved);
      return saved;
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to publish schedule.";
      setError(message);
      throw caught instanceof Error ? caught : new Error(message);
    } finally {
      setSaving(false);
    }
  }, [leagueId, schedule]);

  const replaceParticipant = useCallback(
    async (input: {
      matchKey: string;
      side: "home" | "away";
      participant: ScheduleParticipant;
    }) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      setSaving(true);
      setError(null);

      try {
        const applyLocal = (current: LeagueScheduleModel | null) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            matches: current.matches.map((match) => {
              if (match.key !== input.matchKey) {
                return match;
              }

              if (input.side === "home") {
                return {
                  ...match,
                  homeId: input.participant.id,
                  homeLabel: input.participant.label,
                  homeKind: input.participant.kind,
                };
              }

              return {
                ...match,
                awayId: input.participant.id,
                awayLabel: input.participant.label,
                awayKind: input.participant.kind,
              };
            }),
            updatedAt: new Date().toISOString(),
          };
        };

        if (isSampleLeagueId(leagueId)) {
          const previous = sampleSchedules.get(leagueId) ?? schedule;
          const next = applyLocal(previous);

          if (!next) {
            throw new Error("Schedule not found.");
          }

          sampleSchedules.set(leagueId, next);
          setSchedule(next);
          return next;
        }

        const supabase = createClient();

        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        await updateLeagueMatchParticipant(supabase, {
          matchId: input.matchKey,
          side: input.side,
          participant: input.participant,
        });

        const next = applyLocal(schedule);

        if (!next) {
          throw new Error("Schedule not found.");
        }

        setSchedule(next);
        return next;
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to update match participant.";
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [leagueId, schedule],
  );

  const setMatchStatus = useCallback(
    async (input: {
      matchKey: string;
      status: LeagueMatchStatus;
      winnerSide?: DraftLeagueMatch["winnerSide"];
      homeScore?: number;
      awayScore?: number;
      completedAt?: string | null;
    }) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      setSaving(true);
      setError(null);

      try {
        const applyLocal = (current: LeagueScheduleModel | null) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            matches: current.matches.map((match) => {
              if (match.key !== input.matchKey) {
                return match;
              }

              const next: DraftLeagueMatch = {
                ...match,
                status: input.status,
              };

              if (input.winnerSide !== undefined) {
                next.winnerSide = input.winnerSide;
              } else if (input.status === "cancelled") {
                next.winnerSide = null;
              }

              if (input.homeScore !== undefined) {
                next.homeScore = input.homeScore;
              } else if (input.status === "cancelled") {
                next.homeScore = 0;
              }

              if (input.awayScore !== undefined) {
                next.awayScore = input.awayScore;
              } else if (input.status === "cancelled") {
                next.awayScore = 0;
              }

              if (input.completedAt !== undefined) {
                next.completedAt = input.completedAt;
              } else if (
                input.status === "completed" ||
                input.status === "forfeited" ||
                input.status === "walkover" ||
                input.status === "cancelled"
              ) {
                next.completedAt = new Date().toISOString();
              }

              return next;
            }),
            updatedAt: new Date().toISOString(),
          };
        };

        if (isSampleLeagueId(leagueId)) {
          const previous = sampleSchedules.get(leagueId) ?? schedule;
          const next = applyLocal(previous);

          if (!next) {
            throw new Error("Schedule not found.");
          }

          sampleSchedules.set(leagueId, next);
          setSchedule(next);
          return next;
        }

        const supabase = createClient();

        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        await updateLeagueMatchStatus(supabase, {
          matchId: input.matchKey,
          status: input.status,
          winnerSide: input.winnerSide,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          completedAt: input.completedAt,
        });

        const next = applyLocal(schedule);

        if (!next) {
          throw new Error("Schedule not found.");
        }

        setSchedule(next);
        return next;
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to update match status.";
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [leagueId, schedule],
  );

  return {
    schedule,
    loading,
    saving,
    error,
    sampleMode,
    refresh: load,
    save,
    publish,
    replaceParticipant,
    setMatchStatus,
    setSchedule,
  };
}
