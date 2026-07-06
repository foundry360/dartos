"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentGuestPlayer {
  id: string;
  name: string;
  lastUsedAt: number;
}

interface RecentPlayersState {
  guests: RecentGuestPlayer[];
  rememberGuest: (name: string) => void;
}

function createGuestId(name: string) {
  return `guest-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

export const useRecentPlayersStore = create<RecentPlayersState>()(
  persist(
    (set, get) => ({
      guests: [],
      rememberGuest: (name) => {
        const trimmed = name.trim();

        if (!trimmed) {
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
      },
    }),
    { name: "dartscorer-recent-guests" },
  ),
);
