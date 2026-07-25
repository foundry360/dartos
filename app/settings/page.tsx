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
import { isIPhoneDevice } from "@/utils/fullscreen";
import { cn } from "@/utils/cn";

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
  const [isIPhone, setIsIPhone] = useState(false);
  const [iphoneDetailOpen, setIphoneDetailOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    parseSettingsSection(sectionParam),
  );

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  useEffect(() => {
    setActiveSection(parseSettingsSection(sectionParam));
    if (sectionParam) {
      setIphoneDetailOpen(true);
    }
  }, [sectionParam]);

  useEffect(() => {
    if (accessLoading || !canManageLeagues) {
      return;
    }

    if (activeSection === "players") {
      setActiveSection(DEFAULT_SETTINGS_SECTION);
      if (isIPhone) {
        setIphoneDetailOpen(false);
      }
    }
  }, [accessLoading, activeSection, canManageLeagues, isIPhone]);

  const handleSelect = (section: SettingsSectionId) => {
    setActiveSection(section);
    if (isIPhone) {
      setIphoneDetailOpen(true);
    }
  };

  return (
    <div
      className={cn(
        "settings-layout",
        isIPhone &&
          (iphoneDetailOpen
            ? "settings-layout--iphone-detail"
            : "settings-layout--iphone-list"),
      )}
    >
      <SettingsNav
        activeSection={
          isIPhone && !iphoneDetailOpen ? null : activeSection
        }
        onSelect={handleSelect}
      />
      <SettingsDetailPanel
        section={activeSection}
        onBack={
          isIPhone && iphoneDetailOpen
            ? () => setIphoneDetailOpen(false)
            : undefined
        }
      />
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
