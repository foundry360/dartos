"use client";

import { AccuracyHorizontalChart } from "@/components/charts/AccuracyHorizontalChart";
import { OutcomeBarChart } from "@/components/charts/OutcomeBarChart";
import { PercentRadialChart } from "@/components/charts/PercentRadialChart";
import { VisitAreaChart } from "@/components/charts/VisitAreaChart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  buildProfileDashboard,
  formatProfileAverage,
  formatProfileCount,
} from "@/features/profile/lib/profile-stats";
import type { StatsPeriod } from "@/features/statistics/lib/stats-period";
import { getStatsPeriodChartHint } from "@/features/statistics/lib/stats-period";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

interface ProfileStatsDashboardProps {
  stats: SessionStats;
  period?: StatsPeriod;
  layout?: "default" | "fill";
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
      <p className="stats-summary-card__value">{value}</p>
      {children ? <div className="stats-summary-card__chart">{children}</div> : null}
    </GlassPanel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stats-mini-stat">
      <span className="stats-mini-stat__label">{label}</span>
      <span className="stats-mini-stat__value">{value}</span>
    </div>
  );
}

export function ProfileStatsDashboard({
  stats,
  period = "lifetime",
  layout = "default",
}: ProfileStatsDashboardProps) {
  const dashboard = buildProfileDashboard(stats);
  const trendHint = getStatsPeriodChartHint(period);
  const fill = layout === "fill";

  return (
    <div className={fill ? "stats-dashboard stats-dashboard--fill" : "stats-dashboard"}>
      <div className="stats-dashboard__summary">
        <SummaryCard
          label="3-dart average"
          value={formatProfileAverage(dashboard.threeDartAverage)}
          hint={trendHint}
        >
          <VisitAreaChart scores={dashboard.visitTrend} compact fill={fill} />
        </SummaryCard>
        <SummaryCard
          label="Checkout %"
          value={dashboard.checkoutAttempts > 0 ? `${dashboard.checkoutPercent.toFixed(1)}%` : "—"}
          hint="Recent attempts"
        >
          <OutcomeBarChart
            results={dashboard.recentCheckoutResults}
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
            <h2 className="stats-panel__title">Scoring trend</h2>
            <p className="stats-panel__subtitle">Visit totals from your latest turns</p>
          </div>
          <span className="stats-panel__badge">
            {dashboard.visitTrend.length > 0 ? `${dashboard.visitTrend.length} visits` : "Waiting for data"}
          </span>
        </div>

        <div
          className={
            fill
              ? "stats-panel__hero-chart stats-panel__hero-chart--tile stats-panel__chart-fill"
              : "stats-panel__hero-chart stats-panel__hero-chart--tile"
          }
        >
          <VisitAreaChart scores={dashboard.visitTrend} panel fill={fill} />
        </div>

        <div className="stats-panel__mini-grid stats-panel__mini-grid--tile">
          <MiniStat label="First 9 avg" value={formatProfileAverage(dashboard.firstNineAverage)} />
          <MiniStat label="Highest visit" value={formatProfileCount(dashboard.highestVisit)} />
          <MiniStat label="100+ visits" value={formatProfileCount(dashboard.visits100Plus)} />
          <MiniStat label="140+ visits" value={formatProfileCount(dashboard.visits140Plus)} />
        </div>
      </GlassPanel>

      <GlassPanel className="stats-panel stats-panel--tile">
        <div className="stats-panel__header stats-panel__header--stacked">
          <div>
            <h2 className="stats-panel__title">Accuracy</h2>
            <p className="stats-panel__subtitle">Hit rate by segment</p>
          </div>
        </div>

        {fill ? (
          <div className="stats-panel__accuracy-stack stats-panel__accuracy-stack--fill">
            <div className="stats-panel__chart-fill stats-panel__accuracy-chart--tile">
              <AccuracyHorizontalChart segments={dashboard.accuracySegments} compact fill={fill} />
            </div>

            <div className="stats-panel__rings stats-panel__rings--accuracy stats-panel__rings--panel-donuts stats-panel__rings--accuracy-row stats-panel__rings--tile">
              <PercentRadialChart
                percent={dashboard.accuracySegments[0]?.percent ?? 0}
                caption="Treble"
                size={144}
                barSize={12}
                fluid={fill}
              />
              <PercentRadialChart
                percent={dashboard.accuracySegments[1]?.percent ?? 0}
                caption="Double"
                size={144}
                barSize={12}
                fluid={fill}
              />
              <PercentRadialChart
                percent={dashboard.accuracySegments[2]?.percent ?? 0}
                caption="Single"
                size={144}
                barSize={12}
                fluid={fill}
              />
              <PercentRadialChart
                percent={dashboard.accuracySegments[3]?.percent ?? 0}
                caption="Bull"
                size={144}
                barSize={12}
                fluid={fill}
              />
            </div>
          </div>
        ) : (
          <>
            <AccuracyHorizontalChart segments={dashboard.accuracySegments} compact fill={fill} />

            <div className="stats-panel__rings stats-panel__rings--accuracy stats-panel__rings--tile">
              <PercentRadialChart
                percent={dashboard.accuracySegments[0]?.percent ?? 0}
                caption="Treble"
                size={84}
                barSize={9}
                fluid={fill}
              />
              <PercentRadialChart
                percent={dashboard.accuracySegments[1]?.percent ?? 0}
                caption="Double"
                size={84}
                barSize={9}
                fluid={fill}
              />
              <PercentRadialChart
                percent={dashboard.accuracySegments[2]?.percent ?? 0}
                caption="Single"
                size={84}
                barSize={9}
                fluid={fill}
              />
              <PercentRadialChart
                percent={dashboard.accuracySegments[3]?.percent ?? 0}
                caption="Bull"
                size={84}
                barSize={9}
                fluid={fill}
              />
            </div>
          </>
        )}
      </GlassPanel>

      <GlassPanel className="stats-panel stats-panel--tile">
        <div className="stats-panel__header stats-panel__header--stacked">
          <div>
            <h2 className="stats-panel__title">Match performance</h2>
            <p className="stats-panel__subtitle">Legs, checkouts, and momentum</p>
          </div>
        </div>

        <div
          className={
            fill
              ? "stats-panel__match-grid stats-panel__match-grid--tile stats-panel__match-grid--fill"
              : "stats-panel__match-grid stats-panel__match-grid--tile"
          }
        >
          <div
            className={
              fill
                ? "stats-panel__match-chart stats-panel__match-chart--tile stats-panel__chart-fill"
                : "stats-panel__match-chart stats-panel__match-chart--tile"
            }
          >
            <span className="stats-panel__chart-label">Recent legs</span>
            <OutcomeBarChart
              results={dashboard.recentLegResults}
              compact
              fill={fill}
              successLabel="Won"
              missLabel="Lost"
            />
          </div>

          <div className="stats-panel__rings stats-panel__rings--match stats-panel__rings--panel-donuts stats-panel__rings--match-row stats-panel__rings--tile">
            <PercentRadialChart
              percent={dashboard.legWinPercent}
              caption="Leg win"
              size={144}
              barSize={14}
              fluid={fill}
            />
            <PercentRadialChart
              percent={dashboard.checkoutPercent}
              caption="Checkout"
              size={144}
              barSize={14}
              fluid={fill}
            />
          </div>

          <div className="stats-panel__mini-grid stats-panel__mini-grid--tile stats-panel__mini-grid--match">
            <MiniStat label="Legs played" value={formatProfileCount(dashboard.legsPlayed)} />
            <MiniStat label="Legs won" value={formatProfileCount(dashboard.legsWon)} />
            <MiniStat label="Breaks" value={formatProfileCount(dashboard.breaksOfThrow)} />
            <MiniStat label="Total points" value={formatProfileCount(dashboard.totalScore)} />
          </div>
        </div>
      </GlassPanel>
      </div>

    </div>
  );
}
