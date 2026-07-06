"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFillContainer } from "@/components/charts/ChartFillContainer";
import {
  buildAccuracyChartData,
  CHART_ACCENT,
  CHART_ACCENT_SOFT,
  CHART_GRID,
  CHART_MUTED,
  CHART_FOREGROUND,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import { cn } from "@/utils/cn";

interface AccuracyHorizontalChartProps {
  segments: Array<{ label: string; percent: number; hits: number }>;
  className?: string;
  compact?: boolean;
  fill?: boolean;
}

function AccuracyHorizontalChartInner({
  data,
  height,
  compact,
  className,
}: {
  data: ReturnType<typeof buildAccuracyChartData>;
  height: number;
  compact: boolean;
  className?: string;
}) {
  const barCount = Math.max(data.length, 1);
  const barSize = compact
    ? Math.max(11, Math.min(32, Math.floor((height - 16) / barCount)))
    : Math.max(14, Math.min(32, Math.floor((height - 32) / barCount)));
  const axisFontSize = compact ? Math.min(13, 10 + Math.floor(height / 80)) : 12;
  const yAxisWidth = compact ? Math.max(44, Math.min(64, 42 + barCount * 3)) : 64;

  return (
    <div
      className={cn("stats-chart stats-chart--accuracy", compact && "stats-chart--compact", className)}
      style={height ? { height } : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={
            compact
              ? { top: 0, right: 8, left: 0, bottom: 0 }
              : { top: 4, right: 16, left: 4, bottom: 4 }
          }
          barCategoryGap={compact ? 8 : 12}
        >
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: CHART_MUTED, fontSize: compact ? 9 : 11 }}
            axisLine={false}
            tickLine={false}
            unit="%"
            hide={compact}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: CHART_FOREGROUND, fontSize: axisFontSize, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={yAxisWidth}
          />
          <Tooltip
            {...chartTooltipStyle}
            formatter={(value, _name, item) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              const hits = item && "payload" in item ? (item.payload as { hits?: number }).hits ?? 0 : 0;
              return [`${numeric.toFixed(1)}% · ${hits} hits`, "Hit rate"];
            }}
          />
          <Bar dataKey="percent" radius={[0, 6, 6, 0]} barSize={barSize} isAnimationActive>
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={index === 0 ? CHART_ACCENT : CHART_ACCENT_SOFT}
                stroke={index === 0 ? CHART_ACCENT : "transparent"}
                strokeWidth={index === 0 ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccuracyHorizontalChart({
  segments,
  className,
  compact = false,
  fill = false,
}: AccuracyHorizontalChartProps) {
  const data = buildAccuracyChartData(segments);
  const fixedHeight = compact ? 148 : 220;

  if (fill) {
    return (
      <ChartFillContainer className={className} minHeight={compact ? 88 : 140}>
        {(height) => (
          <AccuracyHorizontalChartInner data={data} height={height} compact={compact} />
        )}
      </ChartFillContainer>
    );
  }

  return (
    <AccuracyHorizontalChartInner
      data={data}
      height={fixedHeight}
      compact={compact}
      className={className}
    />
  );
}
