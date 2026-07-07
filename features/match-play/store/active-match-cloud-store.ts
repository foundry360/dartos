"use client";

import { create } from "zustand";
import type { ActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";

interface ActiveMatchCloudStore {
  snapshot: ActiveMatchSnapshot | null;
  hydrated: boolean;
  setSnapshot: (snapshot: ActiveMatchSnapshot | null) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
}

export const useActiveMatchCloudStore = create<ActiveMatchCloudStore>()((set) => ({
  snapshot: null,
  hydrated: false,
  setSnapshot: (snapshot) => set({ snapshot }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () => set({ snapshot: null, hydrated: false }),
}));
