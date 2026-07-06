"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SessionStats {
  dartsThrown: number;
  totalScore: number;
  visits: number;
  highestVisit: number;
  visits100Plus: number;
  visits140Plus: number;
  firstNineScore: number;
  firstNineVisits: number;
  singlesHit: number;
  doublesHit: number;
  triplesHit: number;
  bullHit: number;
  checkoutAttempts: number;
  checkoutSuccesses: number;
  matchesPlayed: number;
  matchesWon: number;
  legsPlayed: number;
  legsWon: number;
  breaksOfThrow: number;
}

interface StatisticsStore {
  stats: SessionStats;
  setStats: (stats: SessionStats) => void;
  recordVisit: (visitScore: number) => void;
  recordFirstNineVisit: (visitScore: number) => void;
  recordDartHit: (segment: "single" | "double" | "triple" | "bull") => void;
  recordCheckoutAttempt: (success: boolean) => void;
  recordMatchResult: (won: boolean) => void;
  recordLegResult: (won: boolean, brokeThrow?: boolean) => void;
  reset: () => void;
}

export const initialStats: SessionStats = {
  dartsThrown: 0,
  totalScore: 0,
  visits: 0,
  highestVisit: 0,
  visits100Plus: 0,
  visits140Plus: 0,
  firstNineScore: 0,
  firstNineVisits: 0,
  singlesHit: 0,
  doublesHit: 0,
  triplesHit: 0,
  bullHit: 0,
  checkoutAttempts: 0,
  checkoutSuccesses: 0,
  matchesPlayed: 0,
  matchesWon: 0,
  legsPlayed: 0,
  legsWon: 0,
  breaksOfThrow: 0,
};

export const useStatisticsStore = create<StatisticsStore>()(
  persist(
    (set, get) => ({
      stats: initialStats,

      setStats: (stats) => set({ stats }),

      recordVisit: (visitScore) => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            dartsThrown: stats.dartsThrown + 3,
            totalScore: stats.totalScore + visitScore,
            visits: stats.visits + 1,
            highestVisit: Math.max(stats.highestVisit, visitScore),
            visits100Plus: stats.visits100Plus + (visitScore >= 100 ? 1 : 0),
            visits140Plus: stats.visits140Plus + (visitScore >= 140 ? 1 : 0),
          },
        });
      },

      recordFirstNineVisit: (visitScore) => {
        const { stats } = get();
        if (stats.firstNineVisits >= 3) {
          return;
        }

        set({
          stats: {
            ...stats,
            firstNineScore: stats.firstNineScore + visitScore,
            firstNineVisits: stats.firstNineVisits + 1,
          },
        });
      },

      recordDartHit: (segment) => {
        const { stats } = get();
        const key =
          segment === "single"
            ? "singlesHit"
            : segment === "double"
              ? "doublesHit"
              : segment === "triple"
                ? "triplesHit"
                : "bullHit";

        set({
          stats: {
            ...stats,
            dartsThrown: stats.dartsThrown + 1,
            [key]: stats[key] + 1,
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

      recordLegResult: (won, brokeThrow = false) => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            legsPlayed: stats.legsPlayed + 1,
            legsWon: stats.legsWon + (won ? 1 : 0),
            breaksOfThrow: stats.breaksOfThrow + (brokeThrow ? 1 : 0),
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

export function getFirstNineAverage(stats: SessionStats): number {
  if (stats.firstNineVisits === 0) {
    return 0;
  }

  return Math.round((stats.firstNineScore / stats.firstNineVisits) * 100) / 100;
}

export function getHitPercentage(hits: number, dartsThrown: number): number {
  if (dartsThrown === 0) {
    return 0;
  }

  return Math.round((hits / dartsThrown) * 1000) / 10;
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

export function getLegWinPercentage(stats: SessionStats): number {
  if (stats.legsPlayed === 0) {
    return 0;
  }

  return Math.round((stats.legsWon / stats.legsPlayed) * 1000) / 10;
}
