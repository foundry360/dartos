"use client";

import { create } from "zustand";
import type { HeadToHeadRecord } from "@/lib/supabase/queries/head-to-head";

interface HeadToHeadStore {
  byOpponentId: Record<string, HeadToHeadRecord>;
  hydrated: boolean;
  /** Merge cloud rows with fresher local records so hydrate cannot wipe unsynced results. */
  hydrateFromCloud: (records: HeadToHeadRecord[]) => HeadToHeadRecord[];
  setHydrated: (hydrated: boolean) => void;
  recordMatch: (opponentId: string, userWon: boolean) => void;
  reverseMatch: (opponentId: string, userWon: boolean) => void;
  reset: () => void;
}

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

export const useHeadToHeadStore = create<HeadToHeadStore>()((set, get) => ({
  byOpponentId: {},
  hydrated: false,

  hydrateFromCloud: (records) => {
    const cloudByOpponentId = Object.fromEntries(
      records.map((record) => [record.opponentId, record]),
    );
    const localByOpponentId = get().byOpponentId;
    const merged: Record<string, HeadToHeadRecord> = { ...cloudByOpponentId };
    const localAhead: HeadToHeadRecord[] = [];

    for (const [opponentId, local] of Object.entries(localByOpponentId)) {
      const cloud = cloudByOpponentId[opponentId];
      if (!cloud || getHeadToHeadMatches(local) > getHeadToHeadMatches(cloud)) {
        merged[opponentId] = local;
        localAhead.push(local);
      }
    }

    set({
      byOpponentId: merged,
      hydrated: true,
    });

    return localAhead;
  },

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

  reverseMatch: (opponentId, userWon) =>
    set((state) => {
      const current = state.byOpponentId[opponentId];

      if (!current) {
        return state;
      }

      const nextRecord = {
        opponentId,
        userWins: Math.max(0, current.userWins - (userWon ? 1 : 0)),
        opponentWins: Math.max(0, current.opponentWins - (userWon ? 0 : 1)),
      };

      if (nextRecord.userWins === 0 && nextRecord.opponentWins === 0) {
        const { [opponentId]: _removed, ...remainingRecords } = state.byOpponentId;

        return {
          byOpponentId: remainingRecords,
        };
      }

      return {
        byOpponentId: {
          ...state.byOpponentId,
          [opponentId]: nextRecord,
        },
      };
    }),

  reset: () => set({ byOpponentId: {}, hydrated: false }),
}));
