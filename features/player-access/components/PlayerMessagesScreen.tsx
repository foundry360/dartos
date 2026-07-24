"use client";

import { NotificationsInbox } from "@/features/notifications/components/NotificationsInbox";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { PLAYER_HOME_PATH } from "@/lib/auth/routes";
import "@/features/player-access/player-access.css";

export function PlayerMessagesScreen() {
  return (
    <PlayerAppShell
      heading="Messages"
      backHref={PLAYER_HOME_PATH}
      className="shell-page player-messages-page"
    >
      <div className="player-messages">
        <NotificationsInbox playerMode />
      </div>
    </PlayerAppShell>
  );
}
