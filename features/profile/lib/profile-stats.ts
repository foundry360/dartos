import type { SessionStats } from "@/features/statistics/store/statistics-store";
import {
  getCheckoutPercentage,
  getFirstNineAverage,
  getHitPercentage,
  getLegWinPercentage,
  getThreeDartAverage,
} from "@/features/statistics/store/statistics-store";

export interface ProfileStat {
  label: string;
  value: string;
}

export interface ProfileStatSection {
  title: string;
  stats: ProfileStat[];
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatAverage(value: number): string {
  return value.toFixed(2);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function buildProfileStatSections(stats: SessionStats): ProfileStatSection[] {
  return [
    {
      title: "Scoring",
      stats: [
        {
          label: "3-dart average (501 / 301 / etc.)",
          value: formatAverage(getThreeDartAverage(stats)),
        },
        {
          label: "First 9 darts average",
          value: formatAverage(getFirstNineAverage(stats)),
        },
        {
          label: "Total points scored",
          value: formatNumber(stats.totalScore),
        },
        {
          label: "Highest score in a visit",
          value: stats.highestVisit > 0 ? String(stats.highestVisit) : "—",
        },
        {
          label: "Number of 140+ visits",
          value: formatNumber(stats.visits140Plus),
        },
        {
          label: "Number of 100+ visits",
          value: formatNumber(stats.visits100Plus),
        },
      ],
    },
    {
      title: "Accuracy",
      stats: [
        {
          label: "Single hit %",
          value: formatPercent(getHitPercentage(stats.singlesHit, stats.dartsThrown)),
        },
        {
          label: "Double hit %",
          value: formatPercent(getHitPercentage(stats.doublesHit, stats.dartsThrown)),
        },
        {
          label: "Triple hit %",
          value: formatPercent(getHitPercentage(stats.triplesHit, stats.dartsThrown)),
        },
        {
          label: "Bullseye hit %",
          value: formatPercent(getHitPercentage(stats.bullHit, stats.dartsThrown)),
        },
      ],
    },
    {
      title: "Match Performance",
      stats: [
        {
          label: "Legs played",
          value: formatNumber(stats.legsPlayed),
        },
        {
          label: "Legs won",
          value: formatNumber(stats.legsWon),
        },
        {
          label: "Win %",
          value: formatPercent(getLegWinPercentage(stats)),
        },
        {
          label: "Breaks of throw",
          value: formatNumber(stats.breaksOfThrow),
        },
        {
          label: "Checkout attempts",
          value: formatNumber(stats.checkoutAttempts),
        },
        {
          label: "Checkout %",
          value: formatPercent(getCheckoutPercentage(stats)),
        },
      ],
    },
  ];
}
