"use client";

import { create } from "zustand";

export interface MatchHistoryEntry {
  id: string;
  opponentId: string | null;
  opponentName: string;
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
    opponentId: string | null;
    opponentName: string;
    userWon: boolean;
    matchType: string;
    userLegs: number;
    opponentLegs: number;
    playedAt?: string;
  }) => MatchHistoryEntry;
  removeMatch: (matchId: string) => MatchHistoryEntry | null;
  reset: () => void;
}

function sortMatches(matches: MatchHistoryEntry[]) {
  return [...matches].sort(
    (left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime(),
  );
}

export const useMatchHistoryStore = create<MatchHistoryStore>()((set) => ({
  matches: [],
  hydrated: false,

  hydrateFromCloud: (cloudMatches) =>
    set({
      matches: sortMatches(cloudMatches),
      hydrated: true,
    }),

  setHydrated: (hydrated) => set({ hydrated }),

  addMatch: (input) => {
    const entry: MatchHistoryEntry = {
      id: crypto.randomUUID(),
      opponentId: input.opponentId,
      opponentName: input.opponentName,
      userWon: input.userWon,
      matchType: input.matchType,
      userLegs: input.userLegs,
      opponentLegs: input.opponentLegs,
      playedAt: input.playedAt ?? new Date().toISOString(),
    };

    set((state) => ({
      matches: sortMatches([entry, ...state.matches]),
    }));

    return entry;
  },

  removeMatch: (matchId) => {
    let removed: MatchHistoryEntry | null = null;

    set((state) => {
      const index = state.matches.findIndex((match) => match.id === matchId);

      if (index === -1) {
        return state;
      }

      removed = state.matches[index] ?? null;

      return {
        matches: state.matches.filter((match) => match.id !== matchId),
      };
    });

    return removed;
  },

  reset: () => set({ matches: [], hydrated: false }),
}));
