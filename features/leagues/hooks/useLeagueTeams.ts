"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  createLeagueTeamFromInput,
  getSampleLeagueTeams,
  type CreateLeagueTeamInput,
  type LeagueTeam,
  type LeagueTeamStatus,
} from "@/features/leagues/lib/league-teams";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createLeagueTeamRecord,
  deleteLeagueTeams,
  fetchLeagueTeams,
  findOrCreateLeagueTeam,
  updateLeagueTeamRecord,
  updateLeagueTeamsStatus,
} from "@/lib/supabase/queries/league-teams";

function isSampleLeagueId(leagueId: string) {
  return leagueId.startsWith("sample-");
}

export function useLeagueTeams(leagueId: string | undefined) {
  const { user } = useAuth();
  const sampleMode = Boolean(leagueId && isSampleLeagueId(leagueId));

  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [loading, setLoading] = useState(Boolean(leagueId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!leagueId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    if (isSampleLeagueId(leagueId)) {
      setTeams(getSampleLeagueTeams(leagueId));
      setError(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setTeams([]);
        return;
      }

      setTeams(await fetchLeagueTeams(supabase, leagueId));
    } catch (caught) {
      console.error("Failed to load league teams", caught);
      setTeams([]);
      setError("Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }, [leagueId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const withSaving = useCallback(
    async (action: () => Promise<void>, fallbackMessage: string) => {
      setSaving(true);
      setError(null);

      try {
        await action();
      } catch (caught) {
        console.error(fallbackMessage, caught);
        setError(fallbackMessage);
        throw caught;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const createTeam = useCallback(
    async (input: CreateLeagueTeamInput) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      if (isSampleLeagueId(leagueId)) {
        const team = createLeagueTeamFromInput(input, teams.length);
        setTeams((current) => [team, ...current]);
        return team;
      }

      if (!user) {
        throw new Error("Sign in required.");
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      let created: LeagueTeam | null = null;

      await withSaving(async () => {
        created = await createLeagueTeamRecord(supabase, {
          ...input,
          leagueId,
          createdBy: user.id,
        });
        setTeams((current) => [created!, ...current]);
      }, "Unable to create team.");

      return created!;
    },
    [leagueId, teams.length, user, withSaving],
  );

  const findOrCreateTeam = useCallback(
    async (name: string, color?: string) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Team name is required.");
      }

      if (isSampleLeagueId(leagueId)) {
        const existing = teams.find(
          (team) => team.name.trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (existing) {
          return existing;
        }
        return createTeam({ name: trimmed, color });
      }

      if (!user) {
        throw new Error("Sign in required.");
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      let team: LeagueTeam | null = null;

      await withSaving(async () => {
        team = await findOrCreateLeagueTeam(supabase, {
          leagueId,
          createdBy: user.id,
          name: trimmed,
          color,
        });
        setTeams((current) => {
          if (current.some((entry) => entry.id === team!.id)) {
            return current;
          }
          return [team!, ...current];
        });
      }, "Unable to create team.");

      return team!;
    },
    [createTeam, leagueId, teams, user, withSaving],
  );

  const updateTeam = useCallback(
    async (
      teamId: string,
      patch: { name?: string; color?: string; status?: LeagueTeamStatus },
    ) => {
      if (!leagueId) {
        return;
      }

      if (isSampleLeagueId(leagueId)) {
        setTeams((current) =>
          current.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  ...patch,
                  name: patch.name?.trim() || team.name,
                  color: patch.color?.trim() || team.color,
                }
              : team,
          ),
        );
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      await withSaving(async () => {
        const updated = await updateLeagueTeamRecord(
          supabase,
          leagueId,
          teamId,
          patch,
        );
        setTeams((current) =>
          current.map((team) => (team.id === teamId ? updated : team)),
        );
      }, "Unable to update team.");
    },
    [leagueId, withSaving],
  );

  const setTeamsStatus = useCallback(
    async (teamIds: string[], status: LeagueTeamStatus) => {
      if (!leagueId || teamIds.length === 0) {
        return;
      }

      if (isSampleLeagueId(leagueId)) {
        setTeams((current) =>
          current.map((team) =>
            teamIds.includes(team.id) ? { ...team, status } : team,
          ),
        );
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      await withSaving(async () => {
        await updateLeagueTeamsStatus(supabase, leagueId, teamIds, status);
        setTeams((current) =>
          current.map((team) =>
            teamIds.includes(team.id) ? { ...team, status } : team,
          ),
        );
      }, "Unable to update team status.");
    },
    [leagueId, withSaving],
  );

  const removeTeams = useCallback(
    async (teamIds: string[]) => {
      if (!leagueId || teamIds.length === 0) {
        return;
      }

      if (isSampleLeagueId(leagueId)) {
        setTeams((current) =>
          current.filter((team) => !teamIds.includes(team.id)),
        );
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      await withSaving(async () => {
        await deleteLeagueTeams(supabase, leagueId, teamIds);
        setTeams((current) =>
          current.filter((team) => !teamIds.includes(team.id)),
        );
      }, "Unable to remove teams.");
    },
    [leagueId, withSaving],
  );

  const bumpPlayerCount = useCallback(
    (teamId: string | null, delta: number) => {
      if (!teamId || delta === 0) {
        return;
      }

      setTeams((current) =>
        current.map((team) =>
          team.id === teamId
            ? {
                ...team,
                playerCount: Math.max(0, team.playerCount + delta),
              }
            : team,
        ),
      );
    },
    [],
  );

  return {
    teams,
    loading,
    saving,
    error,
    sampleMode,
    refresh: load,
    createTeam,
    findOrCreateTeam,
    updateTeam,
    setTeamsStatus,
    removeTeams,
    bumpPlayerCount,
  };
}
