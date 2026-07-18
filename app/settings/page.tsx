"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import {
  DEFAULT_SETTINGS_SECTION,
  SettingsNav,
} from "@/features/settings/components/SettingsNav";
import { SettingsDetailPanel } from "@/features/settings/components/SettingsDetailPanel";
import type { SettingsSectionId } from "@/features/settings/lib/settings-sections";
import { SETTINGS_SECTIONS } from "@/features/settings/lib/settings-sections";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";

function parseSettingsSection(value: string | null): SettingsSectionId {
  const normalized =
    value === "wallet" ? "billing" : value === "appearance" ? "preferences" : value;

  if (normalized && SETTINGS_SECTIONS.some((section) => section.id === normalized)) {
    return normalized as SettingsSectionId;
  }

  return DEFAULT_SETTINGS_SECTION;
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const { allowed: canManageLeagues, loading: accessLoading } =
    useLeagueManagementAccess();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    parseSettingsSection(sectionParam),
  );

  useEffect(() => {
    setActiveSection(parseSettingsSection(sectionParam));
  }, [sectionParam]);

  useEffect(() => {
    if (accessLoading || !canManageLeagues) {
      return;
    }

    if (activeSection === "players") {
      setActiveSection(DEFAULT_SETTINGS_SECTION);
    }
  }, [accessLoading, activeSection, canManageLeagues]);

  return (
    <div className="settings-layout">
      <SettingsNav activeSection={activeSection} onSelect={setActiveSection} />
      <SettingsDetailPanel section={activeSection} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <MobileAppShell title="Settings" lockViewport className="settings-page">
      <Suspense fallback={<div className="settings-layout settings-layout--loading" />}>
        <SettingsPageContent />
      </Suspense>
    </MobileAppShell>
  );
}
