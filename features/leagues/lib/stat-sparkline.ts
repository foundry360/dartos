export type StatSparklinePoint = {
  /** Day number within the selected period (1 … periodDays). */
  day: number;
  value: number;
};

const MAX_CHART_POINTS = 10;

/** Inclusive day markers from 1 through periodDays, capped at maxPoints. */
export function samplePeriodDays(
  periodDays: number,
  maxPoints = MAX_CHART_POINTS,
): number[] {
  const totalDays = Math.max(1, Math.floor(periodDays));
  const count = Math.min(totalDays, Math.max(2, Math.floor(maxPoints)));

  if (count >= totalDays) {
    return Array.from({ length: totalDays }, (_, index) => index + 1);
  }

  return Array.from({ length: count }, (_, index) =>
    Math.round(1 + (index * (totalDays - 1)) / (count - 1)),
  );
}

/** Deterministic trend for a stat across a rolling period, ending on `value`. */
export function buildStatSparklineSeries(
  value: number,
  seedKey = "",
  periodDays: number,
  maxPoints = MAX_CHART_POINTS,
): StatSparklinePoint[] {
  const days = samplePeriodDays(periodDays, maxPoints);

  if (value <= 0) {
    return days.map((day) => ({ day, value: 0 }));
  }

  let hash = 0;
  for (let index = 0; index < seedKey.length; index += 1) {
    hash = (hash * 31 + seedKey.charCodeAt(index)) | 0;
  }
  const seed = Math.abs(hash) || value;

  return days.map((day, index) => {
    if (index === days.length - 1) {
      return { day, value };
    }

    const progress = index / (days.length - 1);
    const wave = Math.sin(seed * 0.17 + index * 0.95) * 0.16;
    const baseline = value * (0.52 + progress * 0.38);
    return {
      day,
      value: Math.max(0, Math.round(baseline * (1 + wave))),
    };
  });
}

/** Period growth from first sparkline point to last. */
export function getStatSparklineGrowth(
  points: StatSparklinePoint[],
): number | null {
  if (points.length < 2) {
    return null;
  }

  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;

  if (first === 0 && last === 0) {
    return 0;
  }

  if (first === 0) {
    return null;
  }

  return ((last - first) / first) * 100;
}

export function formatStatGrowthPercent(growth: number | null): string | null {
  if (growth === null || Number.isNaN(growth)) {
    return null;
  }

  const rounded = Math.round(growth);
  if (rounded === 0) {
    return "0%";
  }

  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
