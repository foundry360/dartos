"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { buildAccountPlayerProfile } from "@/features/players/lib/account-player-profile";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createSavedPlayer,
  deleteSavedPlayer,
  fetchSavedPlayers,
  updateSavedPlayer,
} from "@/lib/supabase/queries/players";
import {
  deleteSavedPlayerAvatarFiles,
  updateSavedPlayerAvatarUrl,
  uploadSavedPlayerAvatar,
} from "@/lib/supabase/queries/player-avatars";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";
import { prefetchScorecardVoice } from "@/utils/prefetch-scorecard-voice";
import type { SavedPlayerProfile } from "@/types/player-setup";

export interface CreatePlayerProfileInput {
  name: string;
  nickname?: string;
  color?: string | null;
  avatarFile?: File | null;
}

export interface UpdatePlayerProfileInput {
  name: string;
  nickname?: string;
  color?: string | null;
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

export function useSavedPlayerProfiles() {
  const { user } = useAuth();
  const avatarUrl = useProfileStore((state) => state.avatarUrl);
  const displayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const guests = useRecentPlayersStore((state) => state.guests);
  const [profiles, setProfiles] = useState<SavedPlayerProfile[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase) {
        setProfiles([]);
        return;
      }

      const remoteProfiles = await fetchSavedPlayers(supabase);
      setProfiles(remoteProfiles);
    } catch (caught) {
      console.error("Failed to load saved players", caught);
      setProfiles([]);
      setError("Unable to load saved players.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const createProfile = useCallback(
    async (input: CreatePlayerProfileInput): Promise<SavedPlayerProfile> => {
      const trimmedName = input.name.trim();

      if (!trimmedName) {
        throw new Error("Player name is required.");
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to save players to your account.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sign in to save players to your account.");
      }

      setSaving(true);
      setError(null);

      try {
        const created = await createSavedPlayer(supabase, {
          ownerId: user.id,
          name: trimmedName,
          nickname: input.nickname?.trim() || null,
          color: input.color ?? null,
        });

        let saved = created;

        if (input.avatarFile) {
          const publicUrl = await uploadSavedPlayerAvatar(
            supabase,
            user.id,
            created.id,
            input.avatarFile,
          );
          saved = await updateSavedPlayerAvatarUrl(supabase, created.id, publicUrl);
        }

        setProfiles((current) =>
          [...current, saved].sort((left, right) => left.name.localeCompare(right.name)),
        );

        prefetchScorecardVoice(saved);

        return saved;
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Unable to save player profile.";
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (playerId: string, input: UpdatePlayerProfileInput): Promise<SavedPlayerProfile> => {
      const trimmedName = input.name.trim();

      if (!trimmedName) {
        throw new Error("Player name is required.");
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to save players to your account.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sign in to save players to your account.");
      }

      setSaving(true);
      setError(null);

      try {
        let saved = await updateSavedPlayer(supabase, playerId, {
          name: trimmedName,
          nickname: input.nickname?.trim() || null,
          color: input.color ?? null,
        });

        if (input.avatarFile) {
          const publicUrl = await uploadSavedPlayerAvatar(
            supabase,
            user.id,
            playerId,
            input.avatarFile,
          );
          saved = await updateSavedPlayerAvatarUrl(supabase, playerId, publicUrl);
        } else if (input.removeAvatar) {
          await deleteSavedPlayerAvatarFiles(supabase, user.id, playerId).catch(() => undefined);
          saved = await updateSavedPlayerAvatarUrl(supabase, playerId, null);
        }

        setProfiles((current) =>
          current
            .map((profile) => (profile.id === playerId ? saved : profile))
            .sort((left, right) => left.name.localeCompare(right.name)),
        );

        prefetchScorecardVoice(saved);

        return saved;
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Unable to update player profile.";
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const removeProfile = useCallback(async (playerId: string) => {
    const supabase = createClient();

    if (!supabase) {
      throw new Error("Sign in to manage saved players.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setSaving(true);
    setError(null);

    try {
      if (user) {
        await deleteSavedPlayerAvatarFiles(supabase, user.id, playerId).catch(() => undefined);
      }

      await deleteSavedPlayer(supabase, playerId);
      setProfiles((current) => current.filter((profile) => profile.id !== playerId));
      useSavedPlayerStatsStore.getState().removeProfile(playerId);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to delete player profile.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const guestProfiles: SavedPlayerProfile[] = guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    nickname: null,
    color: null,
  }));

  const accountProfile = useMemo(
    () => (user ? buildAccountPlayerProfile({ user, displayName, nickname, avatarUrl }) : null),
    [avatarUrl, displayName, nickname, user],
  );

  const mergedProfiles = useMemo(() => {
    const merged: SavedPlayerProfile[] = accountProfile ? [accountProfile] : [];

    for (const profile of profiles) {
      if (
        accountProfile &&
        profile.name.toLowerCase() === accountProfile.name.toLowerCase()
      ) {
        continue;
      }

      merged.push(profile);
    }

    for (const guest of guestProfiles) {
      if (
        merged.some((profile) => profile.name.toLowerCase() === guest.name.toLowerCase())
      ) {
        continue;
      }

      merged.push(guest);
    }

    return merged;
  }, [accountProfile, guestProfiles, profiles]);

  return {
    profiles: mergedProfiles,
    accountProfile,
    cloudProfiles: profiles,
    loading,
    saving,
    error,
    refresh: loadProfiles,
    createProfile,
    updateProfile,
    removeProfile,
    isCloudConfigured: isSupabaseConfigured(),
  };
}
