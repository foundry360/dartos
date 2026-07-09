"use client";

import { PercentRadialChart } from "@/components/charts/PercentRadialChart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { isEmptyStatValue } from "@/features/profile/lib/empty-stat-value";
import { buildDrillStatsSummary, type DrillStatCard } from "@/features/practice/lib/drill-stats-summary";
import {
  formatPracticeSessionDate,
  formatPracticeSessionSummary,
} from "@/features/practice/lib/format-practice-session-summary";
import type { PracticeStatsDrillId } from "@/features/practice/lib/practice-stats-drills";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";
import { cn } from "@/utils/cn";

interface DrillStatsViewProps {
  drillId: PracticeStatsDrillId;
  sessions: PracticeSessionHistoryEntry[];
}

function StatCard({ label, value, hint, donut }: DrillStatCard) {
  return (
    <GlassPanel className={cn("drill-stats-card", donut && "drill-stats-card--donut")}>
      <div className="drill-stats-card__copy">
        <div className="drill-stats-card__header">
          <span className="drill-stats-card__label">{label}</span>
          {hint ? <span className="drill-stats-card__hint">{hint}</span> : null}
        </div>
        <p className={cn("drill-stats-card__value", isEmptyStatValue(value) && "stat-value--empty")}>
          {value}
        </p>
      </div>
      {donut ? (
        <div className="drill-stats-card__donut">
          <PercentRadialChart
            percent={donut.fillPercent}
            caption={donut.caption}
            displayValue={donut.displayValue}
            size={128}
            barSize={11}
            empty={donut.empty}
          />
        </div>
      ) : null}
    </GlassPanel>
  );
}

export function DrillStatsView({ drillId, sessions }: DrillStatsViewProps) {
  const summary = buildDrillStatsSummary(drillId, sessions);

  return (
    <div className="drill-stats-view">
      <div className="drill-stats-view__cards">
        {summary.cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <GlassPanel className="stats-panel drill-stats-view__history">
        <div className="stats-panel__header drill-stats-view__history-header">
          <h3 className="drill-stats-view__section-title">Session history</h3>
          {sessions.length > 0 ? (
            <span className="stats-panel__badge">{sessions.length} saved</span>
          ) : null}
        </div>

        {sessions.length > 0 ? (
          <ul className="practice-stats-list">
            {sessions.map((session) => (
              <li key={session.id} className="practice-stats-list__row">
                <div className="practice-stats-list__copy">
                  <p className="practice-stats-list__title">{session.drillTitle}</p>
                  <p className="practice-stats-list__meta">
                    {formatPracticeSessionDate(session.completedAt)}
                  </p>
                </div>
                <p className="practice-stats-list__summary">
                  {formatPracticeSessionSummary(session)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="stats-panel__subtitle practice-stats-history__empty">
            Finish this drill while signed in to start building stats here.
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
