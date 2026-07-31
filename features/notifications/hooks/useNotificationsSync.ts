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
        try {
          const { deliverPendingLeagueInvites } = await import(
            "@/lib/supabase/queries/player-league-access"
          );
          await deliverPendingLeagueInvites(client);
        } catch (deliverError) {
          console.error(
            "Failed to deliver pending league invites",
            formatSupabaseError(deliverError),
          );
        }

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

    const applyAnnouncementChange = (row: AnnouncementRow | null | undefined) => {
      if (!row?.id || row.is_signup_default) {
        return;
      }

      if (row.recipient_user_id && row.recipient_user_id !== userId) {
        return;
      }

      if (row.active === false) {
        useNotificationsStore.getState().dismissLocal(row.id);
        return;
      }

      useNotificationsStore.getState().upsertItem({
        ...row,
        readAt: null,
        dismissedAt: null,
      });
    };

    const channel = client
      .channel(`announcements:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          applyAnnouncementChange(payload.new as AnnouncementRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "announcements" },
        (payload) => {
          applyAnnouncementChange(payload.new as AnnouncementRow);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [authLoading, notificationsEnabled, userId]);
}
