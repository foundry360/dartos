"use client";

import { create } from "zustand";
import {
  initialStats,
  useStatisticsStore,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";
import { addSessionStats } from "@/features/statistics/lib/add-session-stats";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";

export interface PendingMatchStatsPayload {
  account: SessionStats;
  savedByProfileId: Record<string, SessionStats>;
}

interface PendingMatchStatsStore extends PendingMatchStatsPayload {
  reset: () => void;
  restore: (payload: PendingMatchStatsPayload) => void;
  exportPayload: () => PendingMatchStatsPayload;
  mutateAccount: (updater: (stats: SessionStats) => SessionStats) => void;
  mutateSavedPlayer: (
    profileId: string,
    updater: (stats: SessionStats) => SessionStats,
  ) => void;
}

export const usePendingMatchStatsStore = create<PendingMatchStatsStore>()((set, get) => ({
  account: initialStats,
  savedByProfileId: {},

  reset: () => set({ account: initialStats, savedByProfileId: {} }),

  restore: (payload) =>
    set({
      account: { ...initialStats, ...payload.account },
      savedByProfileId: Object.fromEntries(
        Object.entries(payload.savedByProfileId).map(([profileId, stats]) => [
          profileId,
          { ...initialStats, ...stats },
        ]),
      ),
    }),

  exportPayload: () => ({
    account: get().account,
    savedByProfileId: get().savedByProfileId,
  }),

  mutateAccount: (updater) =>
    set((state) => ({
      account: updater(state.account),
    })),

  mutateSavedPlayer: (profileId, updater) =>
    set((state) => {
      const current = state.savedByProfileId[profileId] ?? initialStats;

      return {
        savedByProfileId: {
          ...state.savedByProfileId,
          [profileId]: updater(current),
        },
      };
    }),
}));

export function commitPendingMatchStatsToOfficial() {
  const pending = usePendingMatchStatsStore.getState().exportPayload();
  const hasAccountActivity = pending.account.dartsThrown > 0 || pending.account.visits > 0;
  const hasSavedActivity = Object.values(pending.savedByProfileId).some(
    (stats) => stats.dartsThrown > 0 || stats.visits > 0,
  );

  if (!hasAccountActivity && !hasSavedActivity) {
    usePendingMatchStatsStore.getState().reset();
    return;
  }

  if (hasAccountActivity) {
    const official = useStatisticsStore.getState().stats;
    useStatisticsStore.getState().setStats(addSessionStats(official, pending.account));
  }

  for (const [profileId, delta] of Object.entries(pending.savedByProfileId)) {
    const current = useSavedPlayerStatsStore.getState().getStats(profileId);
    useSavedPlayerStatsStore.setState((state) => ({
      byProfileId: {
        ...state.byProfileId,
        [profileId]: addSessionStats(current, delta),
      },
    }));
  }

  usePendingMatchStatsStore.getState().reset();
}

export function discardPendingMatchStats() {
  usePendingMatchStatsStore.getState().reset();
}
