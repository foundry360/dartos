"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { fetchProfile, updateProfileDetails } from "@/lib/supabase/queries/profile";
import { ensureBoardThemeSyncedForProfile } from "@/lib/supabase/queries/board-themes";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { isBoardThemeId } from "@/lib/board-themes";

function debounce<T extends (...args: never[]) => void>(fn: T, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}

function parseRecentGuestNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export function useUserPreferencesCloudSync(userId: string | undefined, authLoading = false) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    hydratedRef.current = false;

    if (!userId) {
      useSettingsStore.getState().reset();
      useSettingsStore.getState().hydrateFromSession();
      useRecentPlayersStore.getState().reset();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      hydratedRef.current = true;
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function hydrate() {
      try {
        const profile = await fetchProfile(client, userId!);

        if (cancelled) {
          return;
        }

        if (profile) {
          useSettingsStore.getState().applyFromCloud({
            hapticsEnabled: profile.haptics_enabled,
            soundEnabled: profile.sound_enabled,
            voiceAnnouncementsEnabled: profile.voice_announcements_enabled,
            notificationsEnabled: profile.notifications_enabled ?? true,
            confirmFinishTurn: profile.confirm_finish_turn,
            boardThemeId:
              profile.preferred_board_theme_id &&
              isBoardThemeId(profile.preferred_board_theme_id)
                ? profile.preferred_board_theme_id
                : undefined,
          });
          useRecentPlayersStore.getState().hydrateGuests(parseRecentGuestNames(profile.recent_guest_names));
        }

        hydratedRef.current = true;
      } catch (error) {
        console.error(
          "Failed to hydrate user preferences from Supabase",
          formatSupabaseError(error),
        );
        hydratedRef.current = true;
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const client = supabase;

    const syncPreferences = debounce(async () => {
      if (!hydratedRef.current) {
        return;
      }

      const settings = useSettingsStore.getState();
      const recentGuestNames = useRecentPlayersStore.getState().getGuestNames();

      try {
        const preferredBoardThemeId = await ensureBoardThemeSyncedForProfile(
          client,
          settings.boardThemeId,
        );

        await updateProfileDetails(client, userId, {
          ...(preferredBoardThemeId ? { preferredBoardThemeId } : {}),
          hapticsEnabled: settings.hapticsEnabled,
          soundEnabled: settings.soundEnabled,
          voiceAnnouncementsEnabled: settings.voiceAnnouncementsEnabled,
          notificationsEnabled: settings.notificationsEnabled,
          confirmFinishTurn: settings.confirmFinishTurn,
          recentGuestNames,
        });
      } catch (error) {
        console.error(
          "Failed to sync user preferences to Supabase",
          formatSupabaseError(error),
        );
      }
    }, 800);

    const unsubscribeSettings = useSettingsStore.subscribe((state, previousState) => {
      if (
        state.hapticsEnabled === previousState.hapticsEnabled &&
        state.soundEnabled === previousState.soundEnabled &&
        state.voiceAnnouncementsEnabled === previousState.voiceAnnouncementsEnabled &&
        state.notificationsEnabled === previousState.notificationsEnabled &&
        state.confirmFinishTurn === previousState.confirmFinishTurn &&
        state.boardThemeId === previousState.boardThemeId
      ) {
        return;
      }

      syncPreferences();
    });

    const unsubscribeGuests = useRecentPlayersStore.subscribe((state, previousState) => {
      if (state.guests === previousState.guests) {
        return;
      }

      syncPreferences();
    });

    return () => {
      syncPreferences.cancel();
      unsubscribeSettings();
      unsubscribeGuests();
    };
  }, [authLoading, userId]);
}
