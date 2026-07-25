"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { NotificationsInbox } from "@/features/notifications/components/NotificationsInbox";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import "@/features/home/home-page.css";

export default function HomeNotificationsPage() {
  return (
    <MobileAppShell
      title="Notifications"
      backHref={APP_HOME_PATH}
      backAriaLabel="Back to Home"
      showHeaderProfile={false}
      className="shell-page home-notifications-page"
    >
      <div className="home-notifications">
        <NotificationsInbox />
      </div>
    </MobileAppShell>
  );
}
