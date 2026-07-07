"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProfileCard } from "@/features/profile/components/ProfileCard";
import {
  CHART_ACCENT,
  CHART_GRID,
  CHART_MUTED,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import { buildAverageTrendData } from "@/features/profile/lib/profile-dashboard";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

interface ProfileAverageTrendProps {
  stats: SessionStats;
}

export function ProfileAverageTrend({ stats }: ProfileAverageTrendProps) {
  const data = buildAverageTrendData(stats.recentVisitScores ?? []);
  const hasData = data.length > 0;

  return (
    <ProfileCard className="profile-average-trend">
      <h3 className="profile-panel-title">Average Trend — Last 10 Matches</h3>
      <div className="profile-average-trend__chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={hasData ? data : [{ label: "M1", average: 0 }]}
            margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[60, 100]}
              tick={{ fill: CHART_MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            {hasData ? (
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value) => [`${value ?? 0}`, "Average"]}
                labelFormatter={(label) => String(label)}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="average"
              stroke={CHART_ACCENT}
              strokeWidth={2.5}
              dot={{ r: 3, fill: CHART_ACCENT, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: CHART_ACCENT, strokeWidth: 0 }}
              isAnimationActive={hasData}
              strokeOpacity={hasData ? 1 : 0.25}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ProfileCard>
  );
}
