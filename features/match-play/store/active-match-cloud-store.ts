"use client";

import { create } from "zustand";
import type { ActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import { sortActiveMatchSnapshots } from "@/features/match-play/lib/active-match-snapshot";

interface ActiveMatchCloudStore {
  snapshots: ActiveMatchSnapshot[];
  hydrated: boolean;
  setSnapshots: (snapshots: ActiveMatchSnapshot[]) => void;
  upsertSnapshot: (snapshot: ActiveMatchSnapshot) => void;
  removeSnapshot: (matchId: string) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
}

export const useActiveMatchCloudStore = create<ActiveMatchCloudStore>()((set, get) => ({
  snapshots: [],
  hydrated: false,
  setSnapshots: (snapshots) => set({ snapshots: sortActiveMatchSnapshots(snapshots) }),
  upsertSnapshot: (snapshot) => {
    const merged = new Map(get().snapshots.map((entry) => [entry.id, entry]));
    merged.set(snapshot.id, snapshot);
    set({ snapshots: sortActiveMatchSnapshots([...merged.values()]) });
  },
  removeSnapshot: (matchId) => {
    set({
      snapshots: get().snapshots.filter((snapshot) => snapshot.id !== matchId),
    });
  },
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () => set({ snapshots: [], hydrated: false }),
}));
