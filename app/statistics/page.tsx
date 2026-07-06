"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  getCheckoutPercentage,
  getThreeDartAverage,
  getWinPercentage,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";

export default function StatisticsPage() {
  const stats = useStatisticsStore((state) => state.stats);
  const reset = useStatisticsStore((state) => state.reset);

  const metrics = [
    { label: "3-Dart Average", value: getThreeDartAverage(stats).toFixed(2) },
    { label: "Highest Visit", value: String(stats.highestVisit) },
    { label: "Checkout %", value: `${getCheckoutPercentage(stats)}%` },
    { label: "Win %", value: `${getWinPercentage(stats)}%` },
    { label: "Darts Thrown", value: String(stats.dartsThrown) },
    { label: "Matches Played", value: String(stats.matchesPlayed) },
  ];

  return (
    <AppShell className="pb-safe-bottom">
      <PageHeader title="Statistics" subtitle="Lifetime session metrics" backHref="/" />

      <div className="grid grid-cols-2 gap-3 px-4">
        {metrics.map((metric) => (
          <GlassPanel key={metric.label}>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-black tabular-nums">{metric.value}</p>
          </GlassPanel>
        ))}
      </div>

      <div className="mt-6 px-4">
        <GlassPanel>
          <h2 className="text-lg">Match History</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Supabase-backed match replay and export will appear here once your backend is
            connected. Local session stats are tracked offline in the meantime.
          </p>
        </GlassPanel>
      </div>

      <div className="mt-6 px-4">
        <TouchButton variant="danger" fullWidth onClick={reset}>
          Reset Local Statistics
        </TouchButton>
      </div>
    </AppShell>
  );
}
