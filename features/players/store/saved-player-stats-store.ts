"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  initialStats,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";

interface SavedPlayerStatsStore {
  byProfileId: Record<string, SessionStats>;
  getStats: (profileId: string) => SessionStats;
  recordVisit: (profileId: string, visitScore: number) => void;
  recordVisitScore: (profileId: string, visitScore: number) => void;
  recordDartHit: (profileId: string, segment: "single" | "double" | "triple" | "bull") => void;
  recordDartMiss: (profileId: string) => void;
  recordLegResult: (profileId: string, won: boolean) => void;
  recordMatchResult: (profileId: string, won: boolean) => void;
  removeProfile: (profileId: string) => void;
  hydrateFromCloud: (statsByProfileId: Record<string, SessionStats>) => void;
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

export const useSavedPlayerStatsStore = create<SavedPlayerStatsStore>()(
  persist(
    (set, get) => ({
      byProfileId: {},

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

        set({ byProfileId: merged });
      },
    }),
    { name: "dartscorer-saved-player-stats" },
  ),
);

function pickAuthoritativeStats(local: SessionStats, remote: SessionStats): SessionStats {
  if (local.dartsThrown > remote.dartsThrown) {
    return local;
  }

  return remote;
}
