export const CHART_ACCENT = "#6f9e24";
export const CHART_ACCENT_SOFT = "rgba(111, 158, 36, 0.28)";
export const CHART_FOREGROUND = "#d4d4d8";
export const CHART_MUTED = "#a1a1aa";
export const CHART_MUTED_SOFT = "rgba(161, 161, 170, 0.35)";
export const CHART_GRID = "rgba(255, 255, 255, 0.08)";
export const CHART_TRACK = "rgba(255, 255, 255, 0.12)";
export const CHART_PLACEHOLDER = "#000000";

export const chartTooltipStyle = {
  contentStyle: {
    background: "#17171d",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "0.75rem",
    color: CHART_FOREGROUND,
    fontSize: "0.8125rem",
  },
  labelStyle: { color: CHART_MUTED },
  itemStyle: { color: CHART_ACCENT },
};

export function buildVisitChartData(scores: number[]) {
  if (scores.length === 0) {
    return [
      { visit: 1, score: 0 },
      { visit: 2, score: 0 },
    ];
  }

  return scores.map((score, index) => ({
    visit: index + 1,
    score,
  }));
}

export function buildOutcomeChartData(results: boolean[]) {
  if (results.length === 0) {
    return [
      { label: "—", value: 0.35, success: false },
      { label: "—", value: 0.35, success: false },
      { label: "—", value: 0.35, success: false },
    ];
  }

  return results.map((success, index) => ({
    label: `${index + 1}`,
    value: success ? 1 : 0.38,
    success,
  }));
}

export function buildAccuracyChartData(
  segments: Array<{ label: string; percent: number; hits: number }>,
) {
  return segments.map((segment) => ({
    name: segment.label,
    percent: segment.percent,
    hits: segment.hits,
  }));
}
