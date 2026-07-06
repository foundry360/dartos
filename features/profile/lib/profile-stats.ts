import type { SessionStats } from "@/features/statistics/store/statistics-store";
import {
  getCheckoutPercentage,
  getFirstNineAverage,
  getHitPercentage,
  getLegWinPercentage,
  getThreeDartAverage,
} from "@/features/statistics/store/statistics-store";

export interface ProfileAccuracySegment {
  label: string;
  shortLabel: string;
  percent: number;
  hits: number;
}

export interface ProfileDashboard {
  threeDartAverage: number;
  firstNineAverage: number;
  highestVisit: number;
  visits100Plus: number;
  visits140Plus: number;
  totalScore: number;
  dartsThrown: number;
  visitTrend: number[];
  accuracySegments: ProfileAccuracySegment[];
  legWinPercent: number;
  checkoutPercent: number;
  legsPlayed: number;
  legsWon: number;
  breaksOfThrow: number;
  checkoutAttempts: number;
  recentLegResults: boolean[];
  recentCheckoutResults: boolean[];
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function buildProfileDashboard(stats: SessionStats): ProfileDashboard {
  const visitTrend = stats.recentVisitScores ?? [];
  const recentLegResults = stats.recentLegResults ?? [];
  const recentCheckoutResults = stats.recentCheckoutResults ?? [];

  return {
    threeDartAverage: getThreeDartAverage(stats),
    firstNineAverage: getFirstNineAverage(stats),
    highestVisit: stats.highestVisit,
    visits100Plus: stats.visits100Plus,
    visits140Plus: stats.visits140Plus,
    totalScore: stats.totalScore,
    dartsThrown: stats.dartsThrown,
    visitTrend,
    accuracySegments: [
      {
        label: "Treble",
        shortLabel: "T20",
        percent: getHitPercentage(stats.triplesHit, stats.dartsThrown),
        hits: stats.triplesHit,
      },
      {
        label: "Doubles",
        shortLabel: "D",
        percent: getHitPercentage(stats.doublesHit, stats.dartsThrown),
        hits: stats.doublesHit,
      },
      {
        label: "Singles",
        shortLabel: "S",
        percent: getHitPercentage(stats.singlesHit, stats.dartsThrown),
        hits: stats.singlesHit,
      },
      {
        label: "Bull",
        shortLabel: "B",
        percent: getHitPercentage(stats.bullHit, stats.dartsThrown),
        hits: stats.bullHit,
      },
    ],
    legWinPercent: getLegWinPercentage(stats),
    checkoutPercent: getCheckoutPercentage(stats),
    legsPlayed: stats.legsPlayed,
    legsWon: stats.legsWon,
    breaksOfThrow: stats.breaksOfThrow,
    checkoutAttempts: stats.checkoutAttempts,
    recentLegResults,
    recentCheckoutResults,
  };
}

export function formatProfileAverage(value: number): string {
  return value > 0 ? value.toFixed(2) : "—";
}

export function formatProfileCount(value: number): string {
  return value > 0 ? formatNumber(value) : "—";
}
