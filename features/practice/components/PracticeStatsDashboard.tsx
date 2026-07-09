"use client";

import { AccuracyHorizontalChart } from "@/components/charts/AccuracyHorizontalChart";
import { OutcomeBarChart } from "@/components/charts/OutcomeBarChart";
import { PercentRadialChart } from "@/components/charts/PercentRadialChart";
import { PracticeCompletionChart } from "@/components/charts/PracticeCompletionChart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { isEmptyStatValue } from "@/features/profile/lib/empty-stat-value";
import {
  formatPracticeSessionDate,
  formatPracticeSessionSummary,
} from "@/features/practice/lib/format-practice-session-summary";
import {
  buildPracticeStatsDashboard,
  formatPracticeCount,
  formatPracticePercent,
} from "@/features/practice/lib/practice-stats-dashboard";
import { getPracticeStatsPeriodChartHint } from "@/features/practice/lib/practice-session-period";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";
import type { StatsPeriod } from "@/features/statistics/lib/stats-period";
import { cn } from "@/utils/cn";

interface PracticeStatsDashboardProps {
  sessions: PracticeSessionHistoryEntry[];
  period?: StatsPeriod;
  layout?: "default" | "fill";
  samplePreview?: boolean;
}

function SummaryCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <GlassPanel className="stats-summary-card">
      <div className="stats-summary-card__header">
        <span className="stats-summary-card__label">{label}</span>
        {hint ? <span className="stats-summary-card__hint">{hint}</span> : null}
      </div>
      <p className={cn("stats-summary-card__value", isEmptyStatValue(value) && "stat-value--empty")}>
        {value}
      </p>
      {children ? <div className="stats-summary-card__chart">{children}</div> : null}
    </GlassPanel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stats-mini-stat">
      <span className="stats-mini-stat__label">{label}</span>
      <span className={cn("stats-mini-stat__value", isEmptyStatValue(value) && "stat-value--empty")}>
        {value}
      </span>
    </div>
  );
}

export function PracticeStatsDashboard({
  sessions,
  period = "lifetime",
  layout = "fill",
  samplePreview = false,
}: PracticeStatsDashboardProps) {
  const dashboard = buildPracticeStatsDashboard(sessions);
  const periodHint = getPracticeStatsPeriodChartHint(period);
  const hasRecentCompletions = dashboard.recentCompletions.length > 0;
  const hasOutcomeResults = dashboard.recentOutcomeResults.length > 0;
  const fill = layout === "fill";

  return (
    <div className={fill ? "stats-dashboard stats-dashboard--fill" : "stats-dashboard"}>
      <div className="stats-dashboard__summary">
        <SummaryCard
          label="Drills completed"
          value={formatPracticeCount(dashboard.completedCount)}
          hint={
            samplePreview
              ? "Sample data preview"
              : hasRecentCompletions
                ? periodHint
                : undefined
          }
        >
          <PracticeCompletionChart
            points={dashboard.recentCompletions}
            compact
            fill={fill}
            empty={!hasRecentCompletions}
          />
        </SummaryCard>
        <SummaryCard
          label="Success rate"
          value={formatPracticePercent(dashboard.overallSuccessPercent)}
          hint={hasOutcomeResults ? "Recent attempts" : undefined}
        >
          <OutcomeBarChart
            results={dashboard.recentOutcomeResults}
            compact
            fill={fill}
            successLabel="Made it"
            missLabel="Missed"
          />
        </SummaryCard>
      </div>

      <div className="stats-dashboard__panels">
        <GlassPanel className="stats-panel stats-panel--tile">
          <div className="stats-panel__header stats-panel__header--stacked">
            <div>
              <h2 className="stats-panel__title">Recent completions</h2>
              <p className="stats-panel__subtitle">
                One bar per finished drill — tap a bar for that session&apos;s result
              </p>
            </div>
            {hasRecentCompletions ? (
              <span className="stats-panel__badge">
                {dashboard.recentCompletions.length} sessions
              </span>
            ) : null}
          </div>

          <div
            className={
              fill
                ? "stats-panel__hero-chart stats-panel__hero-chart--tile stats-panel__chart-fill"
                : "stats-panel__hero-chart stats-panel__hero-chart--tile"
            }
          >
            <PracticeCompletionChart
              points={dashboard.recentCompletions}
              panel
              fill={fill}
              empty={!hasRecentCompletions}
            />
          </div>

          <div className="stats-panel__mini-grid stats-panel__mini-grid--tile stats-panel__mini-grid--match">
            <MiniStat label="Completed" value={formatPracticeCount(dashboard.completedCount)} />
            <MiniStat
              label="Success rate"
              value={formatPracticePercent(dashboard.overallSuccessPercent)}
            />
            <MiniStat
              label="Darts thrown"
              value={formatPracticeCount(dashboard.totalDartsThrown)}
            />
            <MiniStat
              label="Categories"
              value={formatPracticeCount(
                dashboard.drillCategorySegments.filter((segment) => segment.hits > 0).length,
              )}
            />
          </div>
        </GlassPanel>

        <GlassPanel className="stats-panel stats-panel--tile">
          <div className="stats-panel__header stats-panel__header--stacked">
            <div>
              <h2 className="stats-panel__title">Drill mix</h2>
              <p className="stats-panel__subtitle">Share of completed drills by category</p>
            </div>
            {dashboard.completedCount > 0 ? (
              <span className="stats-panel__badge">{dashboard.completedCount} total</span>
            ) : null}
          </div>

          {fill ? (
            <div className="stats-panel__accuracy-stack stats-panel__accuracy-stack--fill">
              <div className="stats-panel__chart-fill stats-panel__accuracy-chart--tile">
                <AccuracyHorizontalChart
                  segments={dashboard.drillCategorySegments}
                  compact
                  fill={fill}
                />
              </div>

              <div className="stats-panel__rings stats-panel__rings--match stats-panel__rings--panel-donuts stats-panel__rings--match-row stats-panel__rings--tile">
                <PercentRadialChart
                  percent={dashboard.overallSuccessPercent ?? 0}
                  caption="Success"
                  size={144}
                  barSize={12}
                  fluid={fill}
                  empty={dashboard.overallSuccessPercent == null}
                />
                <PercentRadialChart
                  percent={
                    dashboard.completedCount > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (dashboard.drillCategorySegments.filter((segment) => segment.hits > 0)
                              .length /
                              dashboard.drillCategorySegments.length) *
                              100,
                          ),
                        )
                      : 0
                  }
                  caption="Categories"
                  size={144}
                  barSize={12}
                  fluid={fill}
                  empty={dashboard.completedCount === 0}
                />
              </div>
            </div>
          ) : (
            <>
              <AccuracyHorizontalChart segments={dashboard.drillCategorySegments} compact fill={fill} />

              <div className="stats-panel__rings stats-panel__rings--accuracy stats-panel__rings--tile">
                <PercentRadialChart
                  percent={dashboard.overallSuccessPercent ?? 0}
                  caption="Success"
                  size={84}
                  barSize={9}
                  fluid={fill}
                  empty={dashboard.overallSuccessPercent == null}
                />
                <PercentRadialChart
                  percent={
                    dashboard.completedCount > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (dashboard.drillCategorySegments.filter((segment) => segment.hits > 0)
                              .length /
                              dashboard.drillCategorySegments.length) *
                              100,
                          ),
                        )
                      : 0
                  }
                  caption="Categories"
                  size={84}
                  barSize={9}
                  fluid={fill}
                  empty={dashboard.completedCount === 0}
                />
              </div>
            </>
          )}
        </GlassPanel>

        <GlassPanel className="stats-panel stats-panel--tile practice-stats-history-panel">
          <div className="stats-panel__header stats-panel__header--stacked">
            <div>
              <h2 className="stats-panel__title">Completed drills</h2>
              <p className="stats-panel__subtitle">Saved sessions from finished practice drills</p>
            </div>
            {dashboard.completedCount > 0 ? (
              <span className="stats-panel__badge">{dashboard.completedCount} saved</span>
            ) : null}
          </div>

          <div
            className={
              fill
                ? "practice-stats-history-scroll stats-panel__chart-fill"
                : "practice-stats-history-scroll"
            }
          >
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
                Finish a practice drill to populate your history.
              </p>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
