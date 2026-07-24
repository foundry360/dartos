"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { InstallAppPanel } from "@/features/install/components/InstallAppPanel";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { PLAYER_HOME_PATH } from "@/lib/auth/routes";
import "@/features/player-access/player-access.css";

export function PlayerInstallScreen() {
  return (
    <PlayerAppShell
      heading="Install app"
      backHref={PLAYER_HOME_PATH}
      className="shell-page"
    >
      <div className="player-install">
        <GlassPanel>
          <InstallAppPanel />
        </GlassPanel>
      </div>
    </PlayerAppShell>
  );
}
