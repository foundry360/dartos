"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { CHART_ACCENT, CHART_PLACEHOLDER, CHART_TRACK } from "@/components/charts/chart-theme";
import { cn } from "@/utils/cn";
import { isEmptyStatValue } from "@/features/profile/lib/empty-stat-value";

interface ProfileValueGaugeProps {
  value: string;
  caption: string;
  fillPercent: number;
  className?: string;
  tone?: "accent" | "green";
  size?: number;
  fill?: boolean;
}

const TONE_COLORS = {
  accent: CHART_ACCENT,
  green: CHART_ACCENT,
} as const;

export function ProfileValueGauge({
  value,
  caption,
  fillPercent,
  className,
  tone = "accent",
  size = 168,
  fill = false,
}: ProfileValueGaugeProps) {
  const clamped = Math.min(Math.max(fillPercent, 0), 100);
  const empty = isEmptyStatValue(value);
  const data = [{ name: caption, value: clamped, fill: TONE_COLORS[tone] }];

  return (
    <div
      className={cn("profile-value-gauge", fill && "profile-value-gauge--fill", className)}
      style={fill ? undefined : { width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="74%"
          outerRadius="100%"
          barSize={10}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            background={{ fill: empty ? CHART_PLACEHOLDER : CHART_TRACK }}
            dataKey="value"
            cornerRadius={999}
            isAnimationActive
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="profile-value-gauge__label">
        <span className={cn("profile-value-gauge__value", empty && "stat-value--empty")}>{value}</span>
        <span className="profile-value-gauge__caption">{caption}</span>
      </div>
    </div>
  );
}
