"use client";

import { useState } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { ProfileStatsDashboard } from "@/features/profile/components/ProfileStatsDashboard";
import {
  STATS_PERIOD_OPTIONS,
  type StatsPeriod,
} from "@/features/statistics/lib/stats-period";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";

export default function StatisticsPage() {
  const stats = useStatisticsStore((state) => state.stats);
  const hydrated = useStatisticsStore((state) => state.hydrated);
  const hydrating = useStatisticsStore((state) => state.hydrating);
  const [period, setPeriod] = useState<StatsPeriod>("lifetime");

  return (
    <MobileAppShell
      title="Statistics"
      className="statistics-page shell-page"
      lockViewport
      headerContent={
        <PillToggleGroup
          options={STATS_PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
          ariaLabel="Statistics time period"
          size="sm"
          className="statistics-page__period-toggle"
        />
      }
    >
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
