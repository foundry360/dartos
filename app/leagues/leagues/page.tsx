"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import "@/features/organizations/organizations-page.css";

export default function LeagueListPlaceholderPage() {
  return (
    <MobileAppShell className="organizations-page shell-page" title="Leagues">
      <div className="organizations-screen">
        <GlassPanel>
          <h1 className="settings-panel__subheading text-2xl font-bold">All leagues</h1>
          <p className="settings-panel__subdescription mt-2">
            Full leagues list coming soon.
          </p>
          <Link href="/leagues" className="mt-4 block">
            <TouchButton fullWidth size="lg" variant="secondary">
              Back to League Management
            </TouchButton>
          </Link>
        </GlassPanel>
      </div>
    </MobileAppShell>
  );
}
