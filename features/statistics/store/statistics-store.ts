"use client";

import { create } from "zustand";

export interface SessionStats {
  dartsThrown: number;
  totalScore: number;
  visits: number;
  highestVisit: number;
  visits100Plus: number;
  visits140Plus: number;
  visits180Plus: number;
  highestCheckout: number;
  firstNineScore: number;
  firstNineVisits: number;
  firstTwelveScore: number;
  firstTwelveVisits: number;
  firstFifteenScore: number;
  firstFifteenVisits: number;
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
  /** Rolling window of recent visit totals for trend charts. */
  recentVisitScores: number[];
  /** Rolling window of recent leg outcomes (true = won). */
  recentLegResults: boolean[];
  /** Rolling window of recent checkout attempts (true = success). */
  recentCheckoutResults: boolean[];
}

interface StatisticsStore {
  stats: SessionStats;
  hydrated: boolean;
  hydrating: boolean;
  setStats: (stats: SessionStats) => void;
  setHydrated: (hydrated: boolean) => void;
  setHydrating: (hydrating: boolean) => void;
  recordVisit: (visitScore: number) => void;
  recordVisitScore: (visitScore: number) => void;
  recordFirstNineVisit: (visitScore: number) => void;
  recordDartHit: (segment: "single" | "double" | "triple" | "bull") => void;
  recordDartMiss: () => void;
  recordCheckoutAttempt: (success: boolean, checkoutScore?: number) => void;
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
  visits180Plus: 0,
  highestCheckout: 0,
  firstNineScore: 0,
  firstNineVisits: 0,
  firstTwelveScore: 0,
  firstTwelveVisits: 0,
  firstFifteenScore: 0,
  firstFifteenVisits: 0,
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
  recentVisitScores: [],
  recentLegResults: [],
  recentCheckoutResults: [],
};

export const useStatisticsStore = create<StatisticsStore>()((set, get) => ({
  stats: initialStats,
  hydrated: false,
  hydrating: false,

  setStats: (stats) => set({ stats }),

  setHydrated: (hydrated) => set({ hydrated }),

  setHydrating: (hydrating) => set({ hydrating }),

  recordVisit: (visitScore) => {
        const { stats } = get();
        const recentVisitScores = [...(stats.recentVisitScores ?? []), visitScore].slice(-24);
        set({
          stats: {
            ...stats,
            dartsThrown: stats.dartsThrown + 3,
            totalScore: stats.totalScore + visitScore,
            visits: stats.visits + 1,
            highestVisit: Math.max(stats.highestVisit, visitScore),
            visits100Plus: stats.visits100Plus + (visitScore >= 100 ? 1 : 0),
            visits140Plus: stats.visits140Plus + (visitScore >= 140 ? 1 : 0),
            visits180Plus: stats.visits180Plus + (visitScore === 180 ? 1 : 0),
            recentVisitScores,
          },
        });
      },

      recordVisitScore: (visitScore) => {
        const { stats } = get();
        const recentVisitScores = [...(stats.recentVisitScores ?? []), visitScore].slice(-24);
        set({
          stats: {
            ...stats,
            totalScore: stats.totalScore + visitScore,
            visits: stats.visits + 1,
            highestVisit: Math.max(stats.highestVisit, visitScore),
            visits100Plus: stats.visits100Plus + (visitScore >= 100 ? 1 : 0),
            visits140Plus: stats.visits140Plus + (visitScore >= 140 ? 1 : 0),
            visits180Plus: stats.visits180Plus + (visitScore === 180 ? 1 : 0),
            recentVisitScores,
          },
        });
      },

      recordFirstNineVisit: (visitScore) => {
        const { stats } = get();
        const updates: Partial<SessionStats> = {};

        if (stats.firstNineVisits < 3) {
          updates.firstNineScore = stats.firstNineScore + visitScore;
          updates.firstNineVisits = stats.firstNineVisits + 1;
        }

        if (stats.firstTwelveVisits < 4) {
          updates.firstTwelveScore = stats.firstTwelveScore + visitScore;
          updates.firstTwelveVisits = stats.firstTwelveVisits + 1;
        }

        if (stats.firstFifteenVisits < 5) {
          updates.firstFifteenScore = stats.firstFifteenScore + visitScore;
          updates.firstFifteenVisits = stats.firstFifteenVisits + 1;
        }

        if (Object.keys(updates).length === 0) {
          return;
        }

        set({
          stats: {
            ...stats,
            ...updates,
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

      recordDartMiss: () => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            dartsThrown: stats.dartsThrown + 1,
          },
        });
      },

      recordCheckoutAttempt: (success, checkoutScore) => {
        const { stats } = get();
        const recentCheckoutResults = [...(stats.recentCheckoutResults ?? []), success].slice(-16);
        set({
          stats: {
            ...stats,
            checkoutAttempts: stats.checkoutAttempts + 1,
            checkoutSuccesses: stats.checkoutSuccesses + (success ? 1 : 0),
            highestCheckout:
              success && checkoutScore
                ? Math.max(stats.highestCheckout, checkoutScore)
                : stats.highestCheckout,
            recentCheckoutResults,
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
        const recentLegResults = [...(stats.recentLegResults ?? []), won].slice(-16);
        set({
          stats: {
            ...stats,
            legsPlayed: stats.legsPlayed + 1,
            legsWon: stats.legsWon + (won ? 1 : 0),
            breaksOfThrow: stats.breaksOfThrow + (brokeThrow ? 1 : 0),
            recentLegResults,
          },
        });
      },

      reset: () => set({ stats: initialStats }),
}));

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

export function getFirstTwelveAverage(stats: SessionStats): number {
  if (stats.firstTwelveVisits === 0) {
    return 0;
  }

  return Math.round((stats.firstTwelveScore / stats.firstTwelveVisits) * 100) / 100;
}

export function getFirstFifteenAverage(stats: SessionStats): number {
  if (stats.firstFifteenVisits === 0) {
    return 0;
  }

  return Math.round((stats.firstFifteenScore / stats.firstFifteenVisits) * 100) / 100;
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
