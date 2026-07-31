"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { FriendsScreen } from "@/features/friends/components/FriendsScreen";
import { APP_HOME_PATH } from "@/lib/auth/routes";

export default function FriendsPage() {
  return (
    <MobileAppShell
      title="Friends"
      backHref={APP_HOME_PATH}
      backAriaLabel="Back to Home"
      showHeaderProfile={false}
      className="shell-page friends-shell"
    >
      <FriendsScreen />
    </MobileAppShell>
  );
}
