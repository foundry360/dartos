"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProfileStore {
  avatarUrl: string | null;
  displayName: string | null;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setDisplayName: (displayName: string | null) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      avatarUrl: null,
      displayName: null,
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setDisplayName: (displayName) => set({ displayName }),
    }),
    { name: "dartscorer-profile" },
  ),
);
