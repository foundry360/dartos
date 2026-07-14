"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { NotificationBellIcon } from "@/features/notifications/components/NotificationBellIcon";
import {
  getUnreadNotificationCount,
  useNotificationsStore,
} from "@/features/notifications/store/notifications-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  dismissAnnouncement,
  markAnnouncementsRead,
} from "@/lib/supabase/queries/announcements";
import { APP_NAME } from "@/lib/theme";
import { cn } from "@/utils/cn";

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NotificationsPanel() {
  const { user } = useAuth();
  const open = useNotificationsStore((state) => state.panelOpen);
  const items = useNotificationsStore((state) => state.items);
  const loading = useNotificationsStore((state) => state.loading);
  const setPanelOpen = useNotificationsStore((state) => state.setPanelOpen);
  const markReadLocal = useNotificationsStore((state) => state.markReadLocal);
  const dismissLocal = useNotificationsStore((state) => state.dismissLocal);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);

  useEffect(() => {
    if (!open || !user?.id) {
      return;
    }

    const unreadIds = items.filter((item) => !item.readAt).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    markReadLocal(unreadIds);

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void markAnnouncementsRead(supabase, user.id, unreadIds).catch((error) => {
      console.error("Failed to mark announcements read", formatSupabaseError(error));
    });
  }, [items, markReadLocal, open, user?.id]);

  const handleDismiss = (announcementId: string) => {
    dismissLocal(announcementId);

    if (!user?.id) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void dismissAnnouncement(supabase, user.id, announcementId).catch((error) => {
      console.error("Failed to dismiss announcement", formatSupabaseError(error));
    });
  };

  return (
    <SlidePanel
      open={open}
      title="Notifications"
      onClose={() => setPanelOpen(false)}
      className="notifications-panel"
    >
      {!notificationsEnabled ? (
        <p className="notifications-panel__banner">
          Notifications are off. You won’t see new unread badges until you enable them in Settings →
          Gameplay.
        </p>
      ) : null}

      {loading ? (
        <p className="notifications-panel__empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="notifications-panel__empty">No {APP_NAME} messages right now.</p>
      ) : (
        <ul className="notifications-panel__list">
          {items.map((item) => {
            const unread = Boolean(notificationsEnabled && !item.readAt);

            return (
              <li
                key={item.id}
                className={cn(
                  "notifications-panel__item",
                  unread && "notifications-panel__item--unread",
                  item.severity === "important" && "notifications-panel__item--important",
                )}
              >
                <div className="notifications-panel__item-header">
                  <h4 className="notifications-panel__item-title">{item.title}</h4>
                  <time className="notifications-panel__item-date" dateTime={item.published_at}>
                    {formatPublishedAt(item.published_at)}
                  </time>
                </div>
                <p className="notifications-panel__item-body">{item.body}</p>
                <div className="notifications-panel__item-actions">
                  {item.cta_href && item.cta_label ? (
                    <Link
                      href={item.cta_href}
                      className="notifications-panel__cta"
                      onClick={() => setPanelOpen(false)}
                    >
                      {item.cta_label}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="notifications-panel__dismiss"
                    onClick={() => handleDismiss(item.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SlidePanel>
  );
}

export function NotificationsBellButton() {
  const items = useNotificationsStore((state) => state.items);
  const setPanelOpen = useNotificationsStore((state) => state.setPanelOpen);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const unreadCount = notificationsEnabled ? getUnreadNotificationCount(items) : 0;

  return (
    <button
      type="button"
      className="home-header-notifications"
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      onClick={() => setPanelOpen(true)}
    >
      <NotificationBellIcon className="home-header-notifications__icon" />
      {unreadCount > 0 ? (
        <span className="home-header-notifications__badge" aria-hidden>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
