"use client";

import { create } from "zustand";
import {
  initialStats,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";
import { pickAuthoritativeStats } from "@/features/statistics/lib/merge-session-stats";

interface SavedPlayerStatsStore {
  byProfileId: Record<string, SessionStats>;
  hydrated: boolean;
  getStats: (profileId: string) => SessionStats;
  recordVisit: (profileId: string, visitScore: number) => void;
  recordVisitScore: (profileId: string, visitScore: number) => void;
  recordDartHit: (profileId: string, segment: "single" | "double" | "triple" | "bull") => void;
  recordDartMiss: (profileId: string) => void;
  recordLegResult: (profileId: string, won: boolean) => void;
  recordMatchResult: (profileId: string, won: boolean) => void;
  recordCheckoutAttempt: (profileId: string, success: boolean) => void;
  removeProfile: (profileId: string) => void;
  hydrateFromCloud: (statsByProfileId: Record<string, SessionStats>) => void;
  setHydrated: (hydrated: boolean) => void;
  resetAll: () => void;
}

function updateProfileStats(
  byProfileId: Record<string, SessionStats>,
  profileId: string,
  updater: (stats: SessionStats) => SessionStats,
): Record<string, SessionStats> {
  const current = byProfileId[profileId] ?? initialStats;

  return {
    ...byProfileId,
    [profileId]: updater(current),
  };
}

export const useSavedPlayerStatsStore = create<SavedPlayerStatsStore>()((set, get) => ({
  byProfileId: {},
  hydrated: false,

  getStats: (profileId) => get().byProfileId[profileId] ?? initialStats,

  recordVisit: (profileId, visitScore) => {
    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        dartsThrown: stats.dartsThrown + 3,
        totalScore: stats.totalScore + visitScore,
        visits: stats.visits + 1,
        highestVisit: Math.max(stats.highestVisit, visitScore),
        visits100Plus: stats.visits100Plus + (visitScore >= 100 ? 1 : 0),
        visits140Plus: stats.visits140Plus + (visitScore >= 140 ? 1 : 0),
        recentVisitScores: [...(stats.recentVisitScores ?? []), visitScore].slice(-24),
      })),
    });
  },

  recordVisitScore: (profileId, visitScore) => {
    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        totalScore: stats.totalScore + visitScore,
        visits: stats.visits + 1,
        highestVisit: Math.max(stats.highestVisit, visitScore),
        visits100Plus: stats.visits100Plus + (visitScore >= 100 ? 1 : 0),
        visits140Plus: stats.visits140Plus + (visitScore >= 140 ? 1 : 0),
        recentVisitScores: [...(stats.recentVisitScores ?? []), visitScore].slice(-24),
      })),
    });
  },

  recordDartHit: (profileId, segment) => {
    const key =
      segment === "single"
        ? "singlesHit"
        : segment === "double"
          ? "doublesHit"
          : segment === "triple"
            ? "triplesHit"
            : "bullHit";

    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        dartsThrown: stats.dartsThrown + 1,
        [key]: stats[key] + 1,
      })),
    });
  },

  recordDartMiss: (profileId) => {
    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        dartsThrown: stats.dartsThrown + 1,
      })),
    });
  },

  recordLegResult: (profileId, won) => {
    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        legsPlayed: stats.legsPlayed + 1,
        legsWon: stats.legsWon + (won ? 1 : 0),
        recentLegResults: [...(stats.recentLegResults ?? []), won].slice(-16),
      })),
    });
  },

  recordMatchResult: (profileId, won) => {
    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        matchesPlayed: stats.matchesPlayed + 1,
        matchesWon: stats.matchesWon + (won ? 1 : 0),
      })),
    });
  },

  recordCheckoutAttempt: (profileId, success) => {
    set({
      byProfileId: updateProfileStats(get().byProfileId, profileId, (stats) => ({
        ...stats,
        checkoutAttempts: stats.checkoutAttempts + 1,
        checkoutSuccesses: stats.checkoutSuccesses + (success ? 1 : 0),
        recentCheckoutResults: [...(stats.recentCheckoutResults ?? []), success].slice(-16),
      })),
    });
  },

  removeProfile: (profileId) => {
    const next = { ...get().byProfileId };
    delete next[profileId];
    set({ byProfileId: next });
  },

  hydrateFromCloud: (statsByProfileId) => {
    const localByProfileId = get().byProfileId;
    const merged: Record<string, SessionStats> = {};
    const profileIds = new Set([
      ...Object.keys(localByProfileId),
      ...Object.keys(statsByProfileId),
    ]);

    for (const profileId of profileIds) {
      const localStats = localByProfileId[profileId] ?? initialStats;
      const remoteStats = statsByProfileId[profileId];

      merged[profileId] = remoteStats
        ? pickAuthoritativeStats(localStats, remoteStats)
        : localStats;
    }

    set({ byProfileId: merged, hydrated: true });
  },

  setHydrated: (hydrated) => set({ hydrated }),

  resetAll: () => set({ byProfileId: {}, hydrated: false }),
}));
