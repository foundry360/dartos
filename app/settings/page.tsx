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

function parseSettingsSection(value: string | null): SettingsSectionId {
  if (value && SETTINGS_SECTIONS.some((section) => section.id === value)) {
    return value as SettingsSectionId;
  }

  return DEFAULT_SETTINGS_SECTION;
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    parseSettingsSection(sectionParam),
  );

  useEffect(() => {
    setActiveSection(parseSettingsSection(sectionParam));
  }, [sectionParam]);

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
