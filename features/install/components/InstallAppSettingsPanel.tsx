"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { InstallAppPanel } from "@/features/install/components/InstallAppPanel";
import { APP_NAME } from "@/lib/theme";

export function InstallAppSettingsPanel() {
  return (
    <GlassPanel>
      <h3 className="settings-panel__subheading text-2xl font-bold">Install {APP_NAME}</h3>
      <p className="settings-panel__subdescription">
        Add {APP_NAME} to your device for full-screen play from your Home Screen or desktop.
      </p>
      <div className="mt-4">
        <InstallAppPanel variant="settings" />
      </div>
    </GlassPanel>
  );
}
