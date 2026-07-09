"use client";

import { useState } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { PracticeSetupHeaderButton } from "@/features/practice/components/PracticeSetupHeaderButton";
import { PracticeStatsPanel } from "@/features/practice/components/PracticeStatsPanel";
import {
  STATS_PERIOD_OPTIONS,
  type StatsPeriod,
} from "@/features/statistics/lib/stats-period";

export default function PracticeStatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>("lifetime");

  return (
    <MobileAppShell
      title="Practice Stats"
      className="practice-stats-page settings-page shell-page"
      lockViewport
      headerContent={
        <>
          <PillToggleGroup
            options={STATS_PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            ariaLabel="Practice stats time period"
            size="sm"
            className="statistics-page__period-toggle"
          />
          <PracticeSetupHeaderButton />
        </>
      }
    >
      <PracticeStatsPanel period={period} />
    </MobileAppShell>
  );
}
