"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayScreenHero } from "@/components/play/PlayScreenHero";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { ResetIcon } from "@/components/ui/ResetIcon";
import { ProfileStatsDashboard } from "@/features/profile/components/ProfileStatsDashboard";
import {
  STATS_PERIOD_OPTIONS,
  type StatsPeriod,
} from "@/features/statistics/lib/stats-period";
import { createClient } from "@/lib/supabase/client";
import { upsertPlayerStats } from "@/lib/supabase/queries/player-stats";
import {
  initialStats,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";

export default function StatisticsPage() {
  const { user } = useAuth();
  const stats = useStatisticsStore((state) => state.stats);
  const hydrated = useStatisticsStore((state) => state.hydrated);
  const hydrating = useStatisticsStore((state) => state.hydrating);
  const setStats = useStatisticsStore((state) => state.setStats);
  const [resetting, setResetting] = useState(false);
  const [period, setPeriod] = useState<StatsPeriod>("lifetime");

  const handleReset = async () => {
    setResetting(true);

    try {
      setStats(initialStats);

      if (user) {
        const supabase = createClient();
        if (supabase) {
          await upsertPlayerStats(supabase, user.id, initialStats);
        }
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <MobileAppShell title="Statistics" className="statistics-page shell-page" lockViewport>
      <PlayScreenHero
        eyebrow="DartScorer"
        title="Statistics"
        titleActions={
          <>
            <PillToggleGroup
              options={STATS_PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
              ariaLabel="Statistics time period"
              size="sm"
              className="statistics-page__period-toggle"
            />
            <button
              type="button"
              className="statistics-page__reset-btn"
              aria-label={resetting ? "Resetting statistics" : "Reset statistics"}
              disabled={resetting || hydrating}
              onClick={handleReset}
            >
              <ResetIcon className={resetting ? "statistics-page__reset-icon--spinning" : undefined} />
            </button>
          </>
        }
      />

      <section className="statistics-page__content">
        {hydrating || !hydrated ? (
          <GlassPanel className="stats-panel">
            <p className="stats-panel__subtitle">Loading your stats from the cloud…</p>
          </GlassPanel>
        ) : (
          <ProfileStatsDashboard stats={stats} period={period} layout="fill" />
        )}
      </section>
    </MobileAppShell>
  );
}
