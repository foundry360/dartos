"use client";

import { create } from "zustand";
import type { HeadToHeadRecord } from "@/lib/supabase/queries/head-to-head";

interface HeadToHeadStore {
  byOpponentId: Record<string, HeadToHeadRecord>;
  hydrated: boolean;
  hydrateFromCloud: (records: HeadToHeadRecord[]) => void;
  setHydrated: (hydrated: boolean) => void;
  recordMatch: (opponentId: string, userWon: boolean) => void;
  reset: () => void;
}

export const useHeadToHeadStore = create<HeadToHeadStore>()((set) => ({
  byOpponentId: {},
  hydrated: false,

  hydrateFromCloud: (records) =>
    set({
      byOpponentId: Object.fromEntries(records.map((record) => [record.opponentId, record])),
      hydrated: true,
    }),

  setHydrated: (hydrated) => set({ hydrated }),

  recordMatch: (opponentId, userWon) =>
    set((state) => {
      const current = state.byOpponentId[opponentId] ?? {
        opponentId,
        userWins: 0,
        opponentWins: 0,
      };

      return {
        byOpponentId: {
          ...state.byOpponentId,
          [opponentId]: {
            opponentId,
            userWins: current.userWins + (userWon ? 1 : 0),
            opponentWins: current.opponentWins + (userWon ? 0 : 1),
          },
        },
      };
    }),

  reset: () => set({ byOpponentId: {}, hydrated: false }),
}));

export function getHeadToHeadMatches(record: HeadToHeadRecord) {
  return record.userWins + record.opponentWins;
}

export function getHeadToHeadWinRate(record: HeadToHeadRecord) {
  const matches = getHeadToHeadMatches(record);

  if (matches === 0) {
    return 0;
  }

  return Math.round((record.userWins / matches) * 1000) / 10;
}
