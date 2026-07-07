"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { HelpPanel } from "@/features/help/components/HelpPanel";

export default function HelpPage() {
  return (
    <MobileAppShell title="Help" className="help-page-shell shell-page">
      <div className="help-page-shell__content">
        <HelpPanel />
      </div>
    </MobileAppShell>
  );
}
