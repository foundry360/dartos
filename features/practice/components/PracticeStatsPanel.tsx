"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PracticeStatsDetailPanel } from "@/features/practice/components/PracticeStatsDetailPanel";
import {
  DEFAULT_PRACTICE_STATS_DRILL,
  PracticeStatsNav,
} from "@/features/practice/components/PracticeStatsNav";
import { filterPracticeSessionsByPeriod } from "@/features/practice/lib/practice-session-period";
import {
  countSessionsByPracticeStatsDrill,
  filterSessionsByPracticeStatsDrill,
  parsePracticeStatsDrill,
  type PracticeStatsDrillId,
} from "@/features/practice/lib/practice-stats-drills";
import {
  resolvePracticeStatsSessions,
} from "@/lib/dev/practice-stats-preview";
import { usePracticeStatsStore } from "@/features/practice/store/practice-stats-store";
import type { StatsPeriod } from "@/features/statistics/lib/stats-period";

interface PracticeStatsPanelProps {
  period: StatsPeriod;
}

function PracticeStatsPanelContent({ period }: PracticeStatsPanelProps) {
  const searchParams = useSearchParams();
  const drillParam = searchParams.get("drill");
  const { user, loading: authLoading } = useAuth();
  const sessions = usePracticeStatsStore((state) => state.sessions);
  const hydrated = usePracticeStatsStore((state) => state.hydrated);
  const sampleParam = searchParams.get("sample");
  const displaySessions = resolvePracticeStatsSessions(sessions, sampleParam);
  const periodSessions = useMemo(
    () => filterPracticeSessionsByPeriod(displaySessions, period),
    [displaySessions, period],
  );
  const sessionCounts = useMemo(
    () => countSessionsByPracticeStatsDrill(periodSessions),
    [periodSessions],
  );
  const [activeDrill, setActiveDrill] = useState<PracticeStatsDrillId>(
    parsePracticeStatsDrill(drillParam),
  );
  const drillSessions = useMemo(
    () => filterSessionsByPracticeStatsDrill(periodSessions, activeDrill),
    [activeDrill, periodSessions],
  );

  useEffect(() => {
    setActiveDrill(parsePracticeStatsDrill(drillParam));
  }, [drillParam]);

  useEffect(() => {
    if (sessionCounts[activeDrill] > 0) {
      return;
    }

    const firstDrillWithData = Object.entries(sessionCounts).find(([, count]) => count > 0)?.[0];

    if (firstDrillWithData) {
      setActiveDrill(firstDrillWithData as PracticeStatsDrillId);
    }
  }, [activeDrill, period, sessionCounts]);

  if (authLoading || !hydrated) {
    return (
      <div className="settings-layout settings-layout--loading">
        <GlassPanel className="stats-panel">
          <p className="stats-panel__subtitle">Loading practice stats from the cloud…</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      <PracticeStatsNav activeDrill={activeDrill} onSelect={setActiveDrill} />
      <PracticeStatsDetailPanel
        drill={activeDrill}
        sessions={drillSessions}
        requiresSignIn={!user && displaySessions.length === 0}
      />
    </div>
  );
}

export function PracticeStatsPanel({ period }: PracticeStatsPanelProps) {
  return (
    <Suspense
      fallback={
        <div className="settings-layout settings-layout--loading">
          <GlassPanel className="stats-panel">
            <p className="stats-panel__subtitle">Loading practice stats…</p>
          </GlassPanel>
        </div>
      }
    >
      <PracticeStatsPanelContent period={period} />
    </Suspense>
  );
}

export { DEFAULT_PRACTICE_STATS_DRILL };
