"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getSampleLeaguePlayers,
  searchPlayerDirectory,
  type CreateLeaguePlayerInput,
  type LeaguePlayer,
  type LeaguePlayerDirectoryHit,
} from "@/features/leagues/lib/league-players";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  addLeaguePlayerFromDirectoryHit,
  createLeaguePlayerRecord,
  deleteLeaguePlayers,
  fetchLeaguePlayerDirectory,
  fetchLeaguePlayers,
  markLeaguePlayersInvited,
  searchLeaguePlayerDirectory,
  searchVectorProfiles,
  updateLeaguePlayersTeam,
} from "@/lib/supabase/queries/league-players";

function isSampleLeagueId(leagueId: string) {
  return leagueId.startsWith("sample-");
}

export function useLeaguePlayers(leagueId: string | undefined) {
  const { user } = useAuth();
  const sampleMode = Boolean(leagueId && isSampleLeagueId(leagueId));

  const [players, setPlayers] = useState<LeaguePlayer[]>([]);
  const [directoryHits, setDirectoryHits] = useState<LeaguePlayerDirectoryHit[]>(
    [],
  );
  const [loading, setLoading] = useState(Boolean(leagueId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!leagueId) {
      setPlayers([]);
      setDirectoryHits([]);
      setLoading(false);
      return;
    }

    if (isSampleLeagueId(leagueId)) {
      const samplePlayers = getSampleLeaguePlayers(leagueId);
      setPlayers(samplePlayers);
      setDirectoryHits(
        searchPlayerDirectory(
          "",
          new Set(
            samplePlayers.map((player) =>
              `${player.firstName} ${player.lastName}`.trim().toLowerCase(),
            ),
          ),
        ),
      );
      setError(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setPlayers([]);
      setDirectoryHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setPlayers([]);
        setDirectoryHits([]);
        return;
      }

      const roster = await fetchLeaguePlayers(supabase, leagueId);
      setPlayers(roster);

      try {
        const directory = await fetchLeaguePlayerDirectory(supabase, roster);
        setDirectoryHits(directory);
      } catch (directoryError) {
        console.error("Failed to load player directory", directoryError);
        setDirectoryHits([]);
      }
    } catch (caught) {
      console.error("Failed to load league players", caught);
      setPlayers([]);
      setError("Unable to load players.");
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

  const createPlayer = useCallback(
    async (input: CreateLeaguePlayerInput) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      if (isSampleLeagueId(leagueId)) {
        const { createLeaguePlayerFromInput } = await import(
          "@/features/leagues/lib/league-players"
        );
        const player = createLeaguePlayerFromInput(input);
        setPlayers((current) => [player, ...current]);
        return player;
      }

      if (!user) {
        throw new Error("Sign in required.");
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      let created: LeaguePlayer | null = null;

      await withSaving(async () => {
        created = await createLeaguePlayerRecord(supabase, {
          ...input,
          leagueId,
          createdBy: user.id,
        });
        setPlayers((current) => [created!, ...current]);
      }, "Unable to create player.");

      return created!;
    },
    [leagueId, user, withSaving],
  );

  const addFromDirectory = useCallback(
    async (hit: LeaguePlayerDirectoryHit) => {
      if (!leagueId) {
        throw new Error("League is required.");
      }

      if (isSampleLeagueId(leagueId)) {
        const { createLeaguePlayerFromDirectoryHit } = await import(
          "@/features/leagues/lib/league-players"
        );
        const player = createLeaguePlayerFromDirectoryHit(hit);
        setPlayers((current) => [player, ...current]);
        setDirectoryHits((current) =>
          current.filter((entry) => entry.id !== hit.id),
        );
        return player;
      }

      if (!user) {
        throw new Error("Sign in required.");
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      let created: LeaguePlayer | null = null;

      await withSaving(async () => {
        created = await addLeaguePlayerFromDirectoryHit(supabase, {
          leagueId,
          createdBy: user.id,
          hit,
        });
        setPlayers((current) => [created!, ...current]);
        setDirectoryHits((current) =>
          current.filter((entry) => entry.id !== hit.id),
        );
      }, "Unable to add player.");

      return created!;
    },
    [leagueId, user, withSaving],
  );

  const removePlayers = useCallback(
    async (playerIds: string[]) => {
      if (!leagueId || playerIds.length === 0) {
        return;
      }

      if (isSampleLeagueId(leagueId)) {
        setPlayers((current) =>
          current.filter((player) => !playerIds.includes(player.id)),
        );
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      await withSaving(async () => {
        await deleteLeaguePlayers(supabase, leagueId, playerIds);
        setPlayers((current) =>
          current.filter((player) => !playerIds.includes(player.id)),
        );
      }, "Unable to remove players.");
    },
    [leagueId, withSaving],
  );

  const assignTeam = useCallback(
    async (playerIds: string[], teamName: string | null) => {
      if (!leagueId || playerIds.length === 0) {
        return;
      }

      if (isSampleLeagueId(leagueId)) {
        setPlayers((current) =>
          current.map((player) =>
            playerIds.includes(player.id) ? { ...player, teamName } : player,
          ),
        );
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      await withSaving(async () => {
        await updateLeaguePlayersTeam(supabase, leagueId, playerIds, teamName);
        setPlayers((current) =>
          current.map((player) =>
            playerIds.includes(player.id) ? { ...player, teamName } : player,
          ),
        );
      }, "Unable to assign team.");
    },
    [leagueId, withSaving],
  );

  const sendInvites = useCallback(
    async (playerIds: string[]) => {
      if (!leagueId || playerIds.length === 0) {
        return;
      }

      if (isSampleLeagueId(leagueId)) {
        setPlayers((current) =>
          current.map((player) => {
            if (!playerIds.includes(player.id)) {
              return player;
            }

            if (player.vectorAccount === "connected") {
              return player;
            }

            return {
              ...player,
              leagueStatus:
                player.leagueStatus === "inactive" ||
                player.leagueStatus === "active"
                  ? "invited"
                  : player.leagueStatus,
              vectorAccount:
                player.vectorAccount === "no-account" ||
                player.vectorAccount === "profile-only"
                  ? "invitation-pending"
                  : player.vectorAccount,
            };
          }),
        );
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      await withSaving(async () => {
        await markLeaguePlayersInvited(supabase, leagueId, playerIds);
        await load();
      }, "Unable to send invitations.");
    },
    [leagueId, load, withSaving],
  );

  const searchDirectory = useCallback(
    async (query: string): Promise<LeaguePlayerDirectoryHit[]> => {
      if (!leagueId) {
        return [];
      }

      const supabase = createClient();
      const canSearchVector =
        Boolean(supabase && user) && query.trim().length >= 2;

      if (isSampleLeagueId(leagueId)) {
        const sampleHits = searchPlayerDirectory(
          query,
          new Set(
            players.map((player) =>
              `${player.firstName} ${player.lastName}`.trim().toLowerCase(),
            ),
          ),
        );

        if (!canSearchVector || !supabase) {
          return sampleHits;
        }

        try {
          const vectorHits = (
            await searchVectorProfiles(supabase, query)
          ).filter(
            (hit) =>
              !players.some((player) => player.profileUserId === hit.id),
          );
          const seen = new Set(
            sampleHits.map((hit) => `${hit.kind}:${hit.id}`),
          );
          const merged = [...sampleHits];

          for (const hit of vectorHits) {
            const key = `${hit.kind}:${hit.id}`;
            if (seen.has(key)) {
              continue;
            }
            seen.add(key);
            merged.push(hit);
          }

          return merged;
        } catch (error) {
          console.error("Vector profile search failed", error);
          return sampleHits;
        }
      }

      if (!supabase || !user) {
        return [];
      }

      return searchLeaguePlayerDirectory(
        supabase,
        query,
        players,
        directoryHits,
      );
    },
    [directoryHits, leagueId, players, user],
  );

  const searchDirectoryRef = useRef(searchDirectory);

  useEffect(() => {
    searchDirectoryRef.current = searchDirectory;
  }, [searchDirectory]);

  const searchDirectoryStable = useCallback(
    (query: string) => searchDirectoryRef.current(query),
    [],
  );

  return {
    players,
    directoryHits,
    loading,
    saving,
    error,
    sampleMode,
    refresh: load,
    searchDirectory: searchDirectoryStable,
    createPlayer,
    addFromDirectory,
    removePlayers,
    assignTeam,
    sendInvites,
  };
}
