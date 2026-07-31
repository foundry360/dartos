"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getUnreadNotificationCount,
  useNotificationsStore,
} from "@/features/notifications/store/notifications-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  deleteAnnouncement,
  markAnnouncementRead,
  markAnnouncementsRead,
  markAnnouncementUnread,
} from "@/lib/supabase/queries/announcements";
import { respondFriendRequest } from "@/lib/supabase/queries/friends";
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

/** slug: friend-request:{requesterId}:{addresseeId} */
function friendRequestRequesterId(slug: string | null): string | null {
  if (!slug?.startsWith("friend-request:")) {
    return null;
  }
  const parts = slug.split(":");
  return parts.length === 3 && parts[1] ? parts[1] : null;
}

interface NotificationsInboxProps {
  className?: string;
  /** Called when a CTA link is followed (e.g. close slide panel). */
  onNavigate?: () => void;
  /** Softer copy for player-only surfaces without Settings → Gameplay. */
  playerMode?: boolean;
}

export function NotificationsInbox({
  className,
  onNavigate,
  playerMode = false,
}: NotificationsInboxProps) {
  const { user } = useAuth();
  const items = useNotificationsStore((state) => state.items);
  const loading = useNotificationsStore((state) => state.loading);
  const markReadLocal = useNotificationsStore((state) => state.markReadLocal);
  const markUnreadLocal = useNotificationsStore((state) => state.markUnreadLocal);
  const dismissLocal = useNotificationsStore((state) => state.dismissLocal);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const unreadCount = getUnreadNotificationCount(items);
  const [friendBusyId, setFriendBusyId] = useState<string | null>(null);
  const [friendError, setFriendError] = useState<string | null>(null);

  const handleFriendRespond = async (
    announcementId: string,
    requesterId: string,
    accept: boolean,
  ) => {
    const supabase = createClient();
    if (!supabase || !user?.id) {
      return;
    }

    setFriendBusyId(announcementId);
    setFriendError(null);
    try {
      await respondFriendRequest(supabase, requesterId, accept);
      dismissLocal(announcementId);
      onNavigate?.();
    } catch (error) {
      setFriendError(formatSupabaseError(error));
    } finally {
      setFriendBusyId(null);
    }
  };

  const handleMarkRead = (announcementId: string) => {
    markReadLocal([announcementId]);

    if (!user?.id) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void markAnnouncementRead(supabase, user.id, announcementId).catch((error) => {
      console.error("Failed to mark announcement read", formatSupabaseError(error));
    });
  };

  const handleMarkAllRead = () => {
    const unreadIds = items.filter((item) => !item.readAt).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    markReadLocal(unreadIds);

    if (!user?.id) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void markAnnouncementsRead(supabase, user.id, unreadIds).catch((error) => {
      console.error("Failed to mark announcements read", formatSupabaseError(error));
    });
  };

  const handleMarkUnread = (announcementId: string) => {
    markUnreadLocal(announcementId);

    if (!user?.id) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void markAnnouncementUnread(supabase, user.id, announcementId).catch((error) => {
      console.error("Failed to mark announcement unread", formatSupabaseError(error));
    });
  };

  const handleDelete = (announcementId: string) => {
    dismissLocal(announcementId);

    if (!user?.id) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    void deleteAnnouncement(supabase, user.id, announcementId).catch((error) => {
      console.error("Failed to delete announcement", formatSupabaseError(error));
    });
  };

  return (
    <div className={cn("notifications-panel__inbox", className)}>
      {!notificationsEnabled ? (
        <p className="notifications-panel__banner">
          {playerMode
            ? "Notifications are currently off for this account."
            : "Notifications are off. You won’t see new unread badges until you enable them in Settings → Gameplay."}
        </p>
      ) : null}

      {loading ? (
        <p className="notifications-panel__empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="notifications-panel__empty">You’re all caught up. No new messages.</p>
      ) : (
        <>
          {unreadCount > 0 ? (
            <div className="notifications-panel__toolbar">
              <button
                type="button"
                className="notifications-panel__mark-all"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            </div>
          ) : null}

          {friendError ? (
            <p className="notifications-panel__banner">{friendError}</p>
          ) : null}

          <ul className="notifications-panel__list">
            {items.map((item) => {
              const unread = !item.readAt;
              const friendRequesterId = friendRequestRequesterId(item.slug);
              const friendBusy = friendBusyId === item.id;

              return (
                <li
                  key={item.id}
                  className={cn(
                    "notifications-panel__item",
                    unread && "notifications-panel__item--unread",
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
                    {friendRequesterId ? (
                      <div className="notifications-panel__friend-actions">
                        <button
                          type="button"
                          className="notifications-panel__cta"
                          disabled={friendBusy}
                          onClick={() =>
                            void handleFriendRespond(item.id, friendRequesterId, true)
                          }
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="notifications-panel__action"
                          disabled={friendBusy}
                          onClick={() =>
                            void handleFriendRespond(item.id, friendRequesterId, false)
                          }
                        >
                          Decline
                        </button>
                      </div>
                    ) : item.cta_href && item.cta_label ? (
                      <Link
                        href={item.cta_href}
                        className="notifications-panel__cta"
                        onClick={onNavigate}
                      >
                        {item.cta_label}
                      </Link>
                    ) : (
                      <span />
                    )}
                    <div className="notifications-panel__item-meta-actions">
                      {unread ? (
                        <button
                          type="button"
                          className="notifications-panel__action"
                          onClick={() => handleMarkRead(item.id)}
                        >
                          Mark as read
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="notifications-panel__action"
                          onClick={() => handleMarkUnread(item.id)}
                        >
                          Mark as unread
                        </button>
                      )}
                      <button
                        type="button"
                        className="notifications-panel__delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
