"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFillContainer } from "@/components/charts/ChartFillContainer";
import {
  CHART_PLACEHOLDER,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import {
  getPracticeCategoryColor,
  type PracticeCompletionTrendPoint,
} from "@/features/practice/lib/practice-stats-dashboard";
import { cn } from "@/utils/cn";

interface PracticeCompletionChartProps {
  points: PracticeCompletionTrendPoint[];
  className?: string;
  compact?: boolean;
  panel?: boolean;
  fill?: boolean;
  empty?: boolean;
}

const EMPTY_CHART_POINTS: PracticeCompletionTrendPoint[] = [
  { index: 1, drillTitle: "—", summary: "—", category: "target", value: 1 },
  { index: 2, drillTitle: "—", summary: "—", category: "target", value: 1 },
  { index: 3, drillTitle: "—", summary: "—", category: "target", value: 1 },
];

function getChartHeight(compact: boolean, panel: boolean): number {
  if (compact) {
    return 56;
  }

  if (panel) {
    return 120;
  }

  return 220;
}

function PracticeCompletionChartInner({
  data,
  height,
  compact,
  empty,
  className,
}: {
  data: PracticeCompletionTrendPoint[];
  height: number;
  compact: boolean;
  empty: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("stats-chart stats-chart--bars", compact && "stats-chart--compact", className)}
      style={height ? { height } : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          barCategoryGap={compact ? 2 : 4}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <Tooltip
            {...chartTooltipStyle}
            formatter={(_value, _name, item) => {
              if (empty || !item || !("payload" in item)) {
                return ["No data yet", "Result"];
              }

              const point = item.payload as PracticeCompletionTrendPoint;
              return [point.summary, "Result"];
            }}
            labelFormatter={(_label, payload) => {
              if (empty || !payload?.[0]) {
                return "No data yet";
              }

              const point = payload[0].payload as PracticeCompletionTrendPoint;
              return point.drillTitle;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={!empty}>
            {data.map((entry) => (
              <Cell
                key={entry.index}
                fill={
                  empty ? CHART_PLACEHOLDER : getPracticeCategoryColor(entry.category)
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!compact && !empty ? (
        <p className="practice-completion-chart__caption">Each bar is one completed drill</p>
      ) : null}
    </div>
  );
}

export function PracticeCompletionChart({
  points,
  className,
  compact = false,
  panel = false,
  fill = false,
  empty = points.length === 0,
}: PracticeCompletionChartProps) {
  const data = empty ? EMPTY_CHART_POINTS : points;
  const fixedHeight = getChartHeight(compact, panel);

  if (fill) {
    return (
      <ChartFillContainer className={className} minHeight={compact ? 72 : 100}>
        {(height) => (
          <PracticeCompletionChartInner
            data={data}
            height={height}
            compact={compact}
            empty={empty}
          />
        )}
      </ChartFillContainer>
    );
  }

  return (
    <PracticeCompletionChartInner
      data={data}
      height={fixedHeight}
      compact={compact}
      empty={empty}
      className={className}
    />
  );
}
