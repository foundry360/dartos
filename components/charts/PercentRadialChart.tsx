"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { CHART_ACCENT, CHART_TRACK } from "@/components/charts/chart-theme";
import { cn } from "@/utils/cn";

interface PercentRadialChartProps {
  percent: number;
  caption: string;
  className?: string;
  size?: number;
  fluid?: boolean;
  barSize?: number;
}

export function PercentRadialChart({
  percent,
  caption,
  className,
  size = 96,
  fluid = false,
  barSize = 8,
}: PercentRadialChartProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const data = [{ name: caption, value: clamped, fill: CHART_ACCENT }];

  return (
    <div
      className={cn("stats-radial-chart", fluid && "stats-radial-chart--fluid", className)}
      style={fluid ? undefined : { width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={barSize}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            background={{ fill: CHART_TRACK }}
            dataKey="value"
            cornerRadius={999}
            isAnimationActive
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="stats-radial-chart__label">
        <span className="stats-radial-chart__value">
          {clamped.toFixed(clamped % 1 === 0 ? 0 : 1)}%
        </span>
        <span className="stats-radial-chart__caption">{caption}</span>
      </div>
    </div>
  );
}
