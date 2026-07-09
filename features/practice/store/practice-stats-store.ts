"use client";

import { create } from "zustand";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

interface PracticeStatsStore {
  sessions: PracticeSessionHistoryEntry[];
  hydrated: boolean;
  hydrateFromCloud: (sessions: PracticeSessionHistoryEntry[]) => void;
  setHydrated: (hydrated: boolean) => void;
  addSession: (entry: PracticeSessionHistoryEntry) => void;
  reset: () => void;
}

function sortSessions(sessions: PracticeSessionHistoryEntry[]) {
  return [...sessions].sort(
    (left, right) =>
      new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  );
}

export const usePracticeStatsStore = create<PracticeStatsStore>()((set) => ({
  sessions: [],
  hydrated: false,

  hydrateFromCloud: (cloudSessions) =>
    set({
      sessions: sortSessions(cloudSessions),
      hydrated: true,
    }),

  setHydrated: (hydrated) => set({ hydrated }),

  addSession: (entry) =>
    set((state) => ({
      sessions: sortSessions([entry, ...state.sessions]),
    })),

  reset: () => set({ sessions: [], hydrated: false }),
}));
