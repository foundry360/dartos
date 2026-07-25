"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { HelpDetailPanel } from "@/features/help/components/HelpDetailPanel";
import {
  DEFAULT_HELP_SECTION,
  HelpNav,
} from "@/features/help/components/HelpNav";
import {
  HELP_SECTIONS,
  type HelpSectionId,
} from "@/features/help/lib/help-sections";
import { isIPhoneDevice } from "@/utils/fullscreen";
import { cn } from "@/utils/cn";

function parseHelpSection(value: string | null): HelpSectionId {
  if (value && HELP_SECTIONS.some((section) => section.id === value)) {
    return value as HelpSectionId;
  }

  return DEFAULT_HELP_SECTION;
}

function HelpPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [isIPhone, setIsIPhone] = useState(false);
  const [iphoneDetailOpen, setIphoneDetailOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<HelpSectionId>(
    parseHelpSection(sectionParam),
  );

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  useEffect(() => {
    setActiveSection(parseHelpSection(sectionParam));
    if (sectionParam) {
      setIphoneDetailOpen(true);
    }
  }, [sectionParam]);

  const handleSelect = (section: HelpSectionId) => {
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
      <HelpNav
        activeSection={
          isIPhone && !iphoneDetailOpen ? null : activeSection
        }
        onSelect={handleSelect}
      />
      <HelpDetailPanel
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

export default function HelpPage() {
  return (
    <MobileAppShell title="Get Started" lockViewport className="help-page-shell">
      <Suspense fallback={<div className="settings-layout settings-layout--loading" />}>
        <HelpPageContent />
      </Suspense>
    </MobileAppShell>
  );
}
