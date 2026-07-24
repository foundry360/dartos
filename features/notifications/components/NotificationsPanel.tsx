"use client";

import Link from "next/link";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { NotificationBellIcon } from "@/features/notifications/components/NotificationBellIcon";
import { NotificationsInbox } from "@/features/notifications/components/NotificationsInbox";
import {
  getUnreadNotificationCount,
  useNotificationsStore,
} from "@/features/notifications/store/notifications-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { cn } from "@/utils/cn";

export function NotificationsPanel() {
  const open = useNotificationsStore((state) => state.panelOpen);
  const setPanelOpen = useNotificationsStore((state) => state.setPanelOpen);

  return (
    <SlidePanel
      open={open}
      title="Notifications"
      onClose={() => setPanelOpen(false)}
      className="notifications-panel"
    >
      <NotificationsInbox onNavigate={() => setPanelOpen(false)} />
    </SlidePanel>
  );
}

export function NotificationsBellButton({
  className,
  iconClassName,
  badgeClassName,
  href,
}: {
  className?: string;
  iconClassName?: string;
  badgeClassName?: string;
  /** When set, opens this route instead of the slide panel. */
  href?: string;
} = {}) {
  const items = useNotificationsStore((state) => state.items);
  const setPanelOpen = useNotificationsStore((state) => state.setPanelOpen);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const unreadCount = notificationsEnabled ? getUnreadNotificationCount(items) : 0;

  const label =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  const content = (
    <>
      <NotificationBellIcon
        className={cn("home-header-notifications__icon", iconClassName)}
      />
      {unreadCount > 0 ? (
        <span
          className={cn("home-header-notifications__badge", badgeClassName)}
          aria-hidden
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("home-header-notifications", className)}
        aria-label={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn("home-header-notifications", className)}
      aria-label={label}
      onClick={() => setPanelOpen(true)}
    >
      {content}
    </button>
  );
}
