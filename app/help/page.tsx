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

function parseHelpSection(value: string | null): HelpSectionId {
  if (value && HELP_SECTIONS.some((section) => section.id === value)) {
    return value as HelpSectionId;
  }

  return DEFAULT_HELP_SECTION;
}

function HelpPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<HelpSectionId>(
    parseHelpSection(sectionParam),
  );

  useEffect(() => {
    setActiveSection(parseHelpSection(sectionParam));
  }, [sectionParam]);

  return (
    <div className="settings-layout">
      <HelpNav activeSection={activeSection} onSelect={setActiveSection} />
      <HelpDetailPanel section={activeSection} />
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
