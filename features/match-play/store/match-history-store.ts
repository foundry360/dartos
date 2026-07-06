"use client";

import { create } from "zustand";

export interface MatchHistoryEntry {
  id: string;
  opponentId: string;
  userWon: boolean;
  matchType: string;
  userLegs: number;
  opponentLegs: number;
  playedAt: string;
}

interface MatchHistoryStore {
  matches: MatchHistoryEntry[];
  hydrated: boolean;
  hydrateFromCloud: (matches: MatchHistoryEntry[]) => void;
  setHydrated: (hydrated: boolean) => void;
  addMatch: (input: {
    opponentId: string;
    userWon: boolean;
    matchType: string;
    userLegs: number;
    opponentLegs: number;
    playedAt?: string;
  }) => MatchHistoryEntry;
  reset: () => void;
}

export const useMatchHistoryStore = create<MatchHistoryStore>()((set) => ({
  matches: [],
  hydrated: false,

  hydrateFromCloud: (matches) =>
    set({
      matches,
      hydrated: true,
    }),

  setHydrated: (hydrated) => set({ hydrated }),

  addMatch: (input) => {
    const entry: MatchHistoryEntry = {
      id: crypto.randomUUID(),
      opponentId: input.opponentId,
      userWon: input.userWon,
      matchType: input.matchType,
      userLegs: input.userLegs,
      opponentLegs: input.opponentLegs,
      playedAt: input.playedAt ?? new Date().toISOString(),
    };

    set((state) => ({
      matches: [entry, ...state.matches],
    }));

    return entry;
  },

  reset: () => set({ matches: [], hydrated: false }),
}));
