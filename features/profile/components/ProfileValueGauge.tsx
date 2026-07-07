"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { CHART_ACCENT, CHART_TRACK } from "@/components/charts/chart-theme";
import { cn } from "@/utils/cn";

interface ProfileValueGaugeProps {
  value: string;
  caption: string;
  fillPercent: number;
  className?: string;
  tone?: "accent" | "green";
  size?: number;
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
}: ProfileValueGaugeProps) {
  const clamped = Math.min(Math.max(fillPercent, 0), 100);
  const data = [{ name: caption, value: clamped, fill: TONE_COLORS[tone] }];

  return (
    <div
      className={cn("profile-value-gauge", className)}
      style={{ width: size, height: size }}
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
            background={{ fill: CHART_TRACK }}
            dataKey="value"
            cornerRadius={999}
            isAnimationActive
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="profile-value-gauge__label">
        <span className="profile-value-gauge__value">{value}</span>
        <span className="profile-value-gauge__caption">{caption}</span>
      </div>
    </div>
  );
}
