"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionStats {
  dartsThrown: number;
  totalScore: number;
  visits: number;
  highestVisit: number;
  checkoutAttempts: number;
  checkoutSuccesses: number;
  matchesPlayed: number;
  matchesWon: number;
}

interface StatisticsStore {
  stats: SessionStats;
  recordVisit: (visitScore: number) => void;
  recordCheckoutAttempt: (success: boolean) => void;
  recordMatchResult: (won: boolean) => void;
  reset: () => void;
}

const initialStats: SessionStats = {
  dartsThrown: 0,
  totalScore: 0,
  visits: 0,
  highestVisit: 0,
  checkoutAttempts: 0,
  checkoutSuccesses: 0,
  matchesPlayed: 0,
  matchesWon: 0,
};

export const useStatisticsStore = create<StatisticsStore>()(
  persist(
    (set, get) => ({
      stats: initialStats,

      recordVisit: (visitScore) => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            dartsThrown: stats.dartsThrown + 3,
            totalScore: stats.totalScore + visitScore,
            visits: stats.visits + 1,
            highestVisit: Math.max(stats.highestVisit, visitScore),
          },
        });
      },

      recordCheckoutAttempt: (success) => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            checkoutAttempts: stats.checkoutAttempts + 1,
            checkoutSuccesses: stats.checkoutSuccesses + (success ? 1 : 0),
          },
        });
      },

      recordMatchResult: (won) => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            matchesPlayed: stats.matchesPlayed + 1,
            matchesWon: stats.matchesWon + (won ? 1 : 0),
          },
        });
      },

      reset: () => set({ stats: initialStats }),
    }),
    { name: "dartscorer-statistics" },
  ),
);

export function getThreeDartAverage(stats: SessionStats): number {
  if (stats.visits === 0) {
    return 0;
  }

  return Math.round((stats.totalScore / stats.visits) * 100) / 100;
}

export function getCheckoutPercentage(stats: SessionStats): number {
  if (stats.checkoutAttempts === 0) {
    return 0;
  }

  return Math.round((stats.checkoutSuccesses / stats.checkoutAttempts) * 1000) / 10;
}

export function getWinPercentage(stats: SessionStats): number {
  if (stats.matchesPlayed === 0) {
    return 0;
  }

  return Math.round((stats.matchesWon / stats.matchesPlayed) * 1000) / 10;
}
