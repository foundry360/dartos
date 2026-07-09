"use client";

import Link from "next/link";
import { DrillStatsView } from "@/features/practice/components/DrillStatsView";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  PRACTICE_STATS_DRILLS,
  type PracticeStatsDrillId,
} from "@/features/practice/lib/practice-stats-drills";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";
import { LOGIN_PATH } from "@/lib/auth/routes";

interface PracticeStatsDetailPanelProps {
  drill: PracticeStatsDrillId;
  sessions: PracticeSessionHistoryEntry[];
  loading?: boolean;
  requiresSignIn?: boolean;
}

export function PracticeStatsDetailPanel({
  drill,
  sessions,
  loading = false,
  requiresSignIn = false,
}: PracticeStatsDetailPanelProps) {
  const meta = PRACTICE_STATS_DRILLS.find((entry) => entry.id === drill);

  if (!meta) {
    return null;
  }

  if (loading) {
    return (
      <section className="settings-panel" aria-labelledby="practice-stats-panel-title">
        <GlassPanel className="stats-panel">
          <p className="stats-panel__subtitle">Loading practice stats from the cloud…</p>
        </GlassPanel>
      </section>
    );
  }

  if (requiresSignIn) {
    return (
      <section className="settings-panel" aria-labelledby="practice-stats-panel-title">
        <header className="settings-panel__header">
          <h2 id="practice-stats-panel-title" className="settings-panel__title">
            {meta.label}
          </h2>
        </header>
        <GlassPanel className="stats-panel space-y-4">
          <p className="stats-panel__subtitle">
            Sign in to save and review completed practice drill stats.
          </p>
          <Link href={LOGIN_PATH}>
            <TouchButton fullWidth size="lg">
              Sign in
            </TouchButton>
          </Link>
        </GlassPanel>
      </section>
    );
  }

  return (
    <section className="settings-panel" aria-labelledby="practice-stats-panel-title">
      <header className="settings-panel__header">
        <h2 id="practice-stats-panel-title" className="settings-panel__title">
          {meta.label}
        </h2>
      </header>

      <div className="settings-panel__content">
        <DrillStatsView drillId={drill} sessions={sessions} />
      </div>
    </section>
  );
}
