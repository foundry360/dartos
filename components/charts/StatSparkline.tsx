"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFillContainer } from "@/components/charts/ChartFillContainer";
import {
  CHART_ACCENT,
  CHART_GRID,
  CHART_MUTED,
} from "@/components/charts/chart-theme";
import type { StatSparklinePoint } from "@/features/leagues/lib/stat-sparkline";
import { cn } from "@/utils/cn";

interface StatSparklineProps {
  points: StatSparklinePoint[];
  empty?: boolean;
  className?: string;
  /** Fixed height; omit to fill the parent height. */
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

function StatYAxisLabel({
  viewBox,
  value,
}: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
  value: string;
}) {
  if (
    !viewBox ||
    typeof viewBox.x !== "number" ||
    typeof viewBox.y !== "number" ||
    typeof viewBox.height !== "number"
  ) {
    return null;
  }

  const x = viewBox.x - 2;
  const y = viewBox.y + viewBox.height / 2;

  return (
    <text
      x={x}
      y={y}
      transform={`rotate(-90, ${x}, ${y})`}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={CHART_MUTED}
      fontSize={11}
      fontWeight={650}
    >
      {value}
    </text>
  );
}

function StatSparklineChart({
  data,
  height,
  empty,
  xLabel,
  yLabel,
  stroke,
  yMax,
}: {
  data: Array<{ label: string; value: number }>;
  height: number;
  empty: boolean;
  xLabel: string;
  yLabel?: string;
  stroke: string;
  yMax: number | undefined;
}) {
  const markerRadius = data.length > 8 ? 2.5 : 3;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: yLabel ? 34 : 4, bottom: 10 }}
      >
        <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: CHART_MUTED, fontSize: 10 }}
          axisLine={{ stroke: CHART_GRID }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={10}
          height={36}
          tickMargin={0}
          label={{
            value: xLabel,
            position: "insideBottom",
            offset: 0,
            dy: 6,
            fill: CHART_MUTED,
            fontSize: 11,
            fontWeight: 650,
          }}
        />
        <YAxis
          tick={{ fill: CHART_MUTED, fontSize: 10 }}
          axisLine={{ stroke: CHART_GRID }}
          tickLine={false}
          width={28}
          tickMargin={2}
          allowDecimals={false}
          domain={yMax ? [0, yMax] : [0, "auto"]}
          tickCount={4}
          label={yLabel ? <StatYAxisLabel value={yLabel} /> : undefined}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2.25}
          strokeOpacity={empty ? 0.55 : 1}
          isAnimationActive={!empty}
          animationDuration={500}
          dot={{
            r: markerRadius,
            fill: stroke,
            strokeWidth: 0,
            fillOpacity: empty ? 0.55 : 1,
          }}
          activeDot={{
            r: markerRadius + 1,
            fill: stroke,
            strokeWidth: 0,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatSparkline({
  points,
  empty = false,
  className,
  height,
  xLabel = "Day",
  yLabel,
}: StatSparklineProps) {
  const data =
    points.length > 0
      ? points.map((point) => ({
          label: String(point.day),
          value: point.value,
        }))
      : [
          { label: "1", value: 0 },
          { label: "2", value: 0 },
        ];

  const stroke = empty ? CHART_MUTED : CHART_ACCENT;
  const maxValue = Math.max(...data.map((point) => point.value), 0);
  const yMax = maxValue <= 0 ? 1 : undefined;
  const fillParent = typeof height !== "number";

  const chart = (resolvedHeight: number) => (
    <StatSparklineChart
      data={data}
      height={resolvedHeight}
      empty={empty}
      xLabel={xLabel}
      yLabel={yLabel}
      stroke={stroke}
      yMax={yMax}
    />
  );

  if (fillParent) {
    return (
      <ChartFillContainer
        className={cn("stat-sparkline", empty && "stat-sparkline--empty", className)}
        minHeight={96}
      >
        {(measuredHeight) => chart(measuredHeight)}
      </ChartFillContainer>
    );
  }

  return (
    <div
      className={cn("stat-sparkline", empty && "stat-sparkline--empty", className)}
      style={{ height }}
      aria-hidden
    >
      {chart(height)}
    </div>
  );
}
