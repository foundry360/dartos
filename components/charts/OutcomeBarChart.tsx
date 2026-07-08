"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFillContainer } from "@/components/charts/ChartFillContainer";
import {
  buildOutcomeChartData,
  CHART_ACCENT,
  CHART_MUTED_SOFT,
  CHART_PLACEHOLDER,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import { cn } from "@/utils/cn";

interface OutcomeBarChartProps {
  results: boolean[];
  className?: string;
  compact?: boolean;
  fill?: boolean;
  successLabel?: string;
  missLabel?: string;
}

function OutcomeBarChartInner({
  data,
  height,
  compact,
  empty,
  successLabel,
  missLabel,
  className,
}: {
  data: ReturnType<typeof buildOutcomeChartData>;
  height: number;
  compact: boolean;
  empty: boolean;
  successLabel: string;
  missLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn("stats-chart stats-chart--bars", compact && "stats-chart--compact", className)}
      style={height ? { height } : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barCategoryGap={compact ? 2 : 4} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <Tooltip
            {...chartTooltipStyle}
            formatter={(_value, _name, item) => {
              const success =
                item && "payload" in item
                  ? Boolean((item.payload as { success?: boolean }).success)
                  : false;
              return [success ? successLabel : missLabel, "Result"];
            }}
            labelFormatter={(label) => (empty ? "No data yet" : `#${label}`)}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={!empty}>
            {data.map((entry, index) => (
              <Cell
                key={`${entry.label}-${index}`}
                fill={
                  empty
                    ? CHART_PLACEHOLDER
                    : entry.success
                      ? CHART_ACCENT
                      : CHART_MUTED_SOFT
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OutcomeBarChart({
  results,
  className,
  compact = false,
  fill = false,
  successLabel = "Success",
  missLabel = "Miss",
}: OutcomeBarChartProps) {
  const data = buildOutcomeChartData(results);
  const empty = results.length === 0;
  const fixedHeight = compact ? 56 : 120;

  if (fill) {
    return (
      <ChartFillContainer className={className} minHeight={compact ? 72 : 80}>
        {(height) => (
          <OutcomeBarChartInner
            data={data}
            height={height}
            compact={compact}
            empty={empty}
            successLabel={successLabel}
            missLabel={missLabel}
          />
        )}
      </ChartFillContainer>
    );
  }

  return (
    <OutcomeBarChartInner
      data={data}
      height={fixedHeight}
      compact={compact}
      empty={empty}
      successLabel={successLabel}
      missLabel={missLabel}
      className={className}
    />
  );
}
