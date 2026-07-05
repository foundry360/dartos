"use client";

import { useState } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import {
  DEFAULT_SETTINGS_SECTION,
  SettingsNav,
} from "@/features/settings/components/SettingsNav";
import { SettingsDetailPanel } from "@/features/settings/components/SettingsDetailPanel";
import type { SettingsSectionId } from "@/features/settings/lib/settings-sections";

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>(DEFAULT_SETTINGS_SECTION);

  return (
    <MobileAppShell title="Settings" lockViewport className="settings-page">
      <div className="settings-layout">
        <SettingsNav activeSection={activeSection} onSelect={setActiveSection} />
        <SettingsDetailPanel section={activeSection} />
      </div>
    </MobileAppShell>
  );
}
