"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  fetchAnnouncementsForUser,
  type AnnouncementRow,
} from "@/lib/supabase/queries/announcements";
import { useNotificationsStore } from "@/features/notifications/store/notifications-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";

export function useNotificationsSync(userId: string | undefined, authLoading = false) {
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userId) {
      useNotificationsStore.getState().reset();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      useNotificationsStore.getState().reset();
      return;
    }

    let cancelled = false;
    const client = supabase;

    async function hydrate() {
      useNotificationsStore.getState().setLoading(true);

      try {
        const items = await fetchAnnouncementsForUser(client, userId!);
        if (!cancelled) {
          useNotificationsStore.getState().setItems(items);
        }
      } catch (error) {
        console.error("Failed to load announcements", formatSupabaseError(error));
        if (!cancelled) {
          useNotificationsStore.getState().setItems([]);
        }
      } finally {
        if (!cancelled) {
          useNotificationsStore.getState().setLoading(false);
        }
      }
    }

    void hydrate();

    if (!notificationsEnabled) {
      return () => {
        cancelled = true;
      };
    }

    const channel = client
      .channel(`announcements:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const row = payload.new as AnnouncementRow;
          if (!row?.id || row.active === false) {
            return;
          }

          useNotificationsStore.getState().upsertItem({
            ...row,
            readAt: null,
            dismissedAt: null,
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [authLoading, notificationsEnabled, userId]);
}
