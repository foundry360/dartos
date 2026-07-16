"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { LeagueHeaderProfile } from "@/features/leagues/components/LeagueHeaderProfile";
import "@/features/organizations/organizations-page.css";

export default function ActivityListPlaceholderPage() {
  return (
    <MobileAppShell
      className="organizations-page shell-page"
      title="Activity"
      headerContent={<LeagueHeaderProfile />}
    >
      <div className="organizations-screen">
        <GlassPanel>
          <h1 className="settings-panel__subheading text-2xl font-bold">
            Recent activity
          </h1>
          <p className="settings-panel__subdescription mt-2">
            Full activity feed coming soon.
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
