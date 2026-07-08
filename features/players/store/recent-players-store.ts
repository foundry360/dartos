"use client";

import { create } from "zustand";
import { prefetchScorecardVoice } from "@/utils/prefetch-scorecard-voice";

interface RecentGuestPlayer {
  id: string;
  name: string;
  lastUsedAt: number;
}

interface RecentPlayersState {
  guests: RecentGuestPlayer[];
  rememberGuest: (name: string) => void;
  hydrateGuests: (names: string[]) => void;
  getGuestNames: () => string[];
  reset: () => void;
}

function createGuestId(name: string) {
  return `guest-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

export const useRecentPlayersStore = create<RecentPlayersState>()((set, get) => ({
  guests: [],

  rememberGuest: (name) => {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    if (/^player \d+$/i.test(trimmed)) {
      return;
    }

    const existing = get().guests.filter(
      (guest) => guest.name.toLowerCase() !== trimmed.toLowerCase(),
    );

    set({
      guests: [
        { id: createGuestId(trimmed), name: trimmed, lastUsedAt: Date.now() },
        ...existing,
      ].slice(0, 12),
    });

    prefetchScorecardVoice({ name: trimmed });
  },

  hydrateGuests: (names) => {
    set({
      guests: names
        .map((name) => name.trim())
        .filter(Boolean)
        .filter((name, index, list) => list.findIndex((entry) => entry.toLowerCase() === name.toLowerCase()) === index)
        .slice(0, 12)
        .map((name, index) => ({
          id: createGuestId(name),
          name,
          lastUsedAt: Date.now() - index,
        })),
    });
  },

  getGuestNames: () => get().guests.map((guest) => guest.name),

  reset: () => set({ guests: [] }),
}));
