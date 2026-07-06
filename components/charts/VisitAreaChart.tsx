"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFillContainer } from "@/components/charts/ChartFillContainer";
import {
  buildVisitChartData,
  CHART_ACCENT,
  CHART_ACCENT_SOFT,
  CHART_GRID,
  CHART_MUTED,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import { cn } from "@/utils/cn";

interface VisitAreaChartProps {
  scores: number[];
  className?: string;
  compact?: boolean;
  panel?: boolean;
  fill?: boolean;
  empty?: boolean;
}

function getChartHeight(compact: boolean, panel: boolean): number {
  if (compact) {
    return 56;
  }

  if (panel) {
    return 120;
  }

  return 220;
}

function VisitAreaChartInner({
  data,
  height,
  compact,
  panel,
  empty,
  className,
}: {
  data: ReturnType<typeof buildVisitChartData>;
  height: number;
  compact: boolean;
  panel: boolean;
  empty: boolean;
  className?: string;
}) {
  const minimal = compact || panel;

  return (
    <div
      className={cn("stats-chart stats-chart--area", minimal && "stats-chart--compact", className)}
      style={height ? { height } : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={
            minimal ? { top: 8, right: 4, left: -28, bottom: 0 } : { top: 12, right: 8, left: -16, bottom: 0 }
          }
        >
          {!minimal ? (
            <>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="visit"
                tick={{ fill: CHART_MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={
                  empty
                    ? undefined
                    : { value: "Visit", position: "insideBottom", offset: -2, fill: CHART_MUTED, fontSize: 10 }
                }
              />
              <YAxis
                tick={{ fill: CHART_MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value) => [`${value ?? 0}`, "Score"]}
                labelFormatter={(label) => `Visit ${label}`}
              />
            </>
          ) : (
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value) => [`${value ?? 0}`, "Score"]}
              labelFormatter={(label) => `Visit ${label}`}
            />
          )}
          <Area
            type="monotone"
            dataKey="score"
            stroke={CHART_ACCENT}
            strokeWidth={compact ? 2 : 2.5}
            fill={CHART_ACCENT_SOFT}
            fillOpacity={empty ? 0.15 : 1}
            strokeOpacity={empty ? 0.35 : 1}
            isAnimationActive={!empty}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VisitAreaChart({
  scores,
  className,
  compact = false,
  panel = false,
  fill = false,
  empty = scores.length === 0,
}: VisitAreaChartProps) {
  const data = buildVisitChartData(scores);
  const fixedHeight = getChartHeight(compact, panel);

  if (fill) {
    return (
      <ChartFillContainer className={className} minHeight={compact ? 72 : 100}>
        {(height) => (
          <VisitAreaChartInner
            data={data}
            height={height}
            compact={compact}
            panel={panel}
            empty={empty}
          />
        )}
      </ChartFillContainer>
    );
  }

  return (
    <VisitAreaChartInner
      data={data}
      height={fixedHeight}
      compact={compact}
      panel={panel}
      empty={empty}
      className={className}
    />
  );
}
