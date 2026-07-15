"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import "@/features/organizations/organizations-page.css";

/** Placeholder league detail — full screen TBD. */
export default function LeagueDetailPlaceholderPage() {
  const params = useParams<{ leagueId: string }>();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";

  return (
    <MobileAppShell className="organizations-page shell-page" title="League">
      <div className="organizations-screen">
        <GlassPanel>
          <h1 className="settings-panel__subheading text-2xl font-bold">League detail</h1>
          <p className="settings-panel__subdescription mt-2">
            League detail screen coming soon.
          </p>
          {leagueId ? (
            <p className="settings-panel__subdescription mt-1">ID: {leagueId}</p>
          ) : null}
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
