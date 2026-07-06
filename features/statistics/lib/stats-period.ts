export type StatsPeriod = "month" | "year" | "lifetime";

export const STATS_PERIOD_OPTIONS: Array<{ value: StatsPeriod; label: string }> = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "lifetime", label: "Lifetime" },
];

export function getStatsPeriodSubtitle(period: StatsPeriod): string {
  switch (period) {
    case "month":
      return "This month's stats synced to your account";
    case "year":
      return "This year's stats synced to your account";
    default:
      return "Lifetime stats synced to your account";
  }
}

export function getStatsPeriodChartHint(period: StatsPeriod): string {
  switch (period) {
    case "month":
      return "This month";
    case "year":
      return "This year";
    default:
      return "Last 24 visits";
  }
}
