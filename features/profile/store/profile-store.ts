"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DefaultMatch,
  FavoritePractice,
  PreferredGame,
  SkillLevel,
  ThrowingHand,
} from "@/types/profile";

interface ProfileStore {
  avatarUrl: string | null;
  displayName: string | null;
  nickname: string | null;
  throwingHand: ThrowingHand | null;
  skillLevel: SkillLevel | null;
  preferredGame: PreferredGame | null;
  homeLeague: string | null;
  favoriteDouble: string | null;
  favoritePractice: FavoritePractice | null;
  defaultMatch: DefaultMatch | null;
  memberSince: string | null;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setDisplayName: (displayName: string | null) => void;
  setNickname: (nickname: string | null) => void;
  setThrowingHand: (throwingHand: ThrowingHand | null) => void;
  setSkillLevel: (skillLevel: SkillLevel | null) => void;
  setPreferredGame: (preferredGame: PreferredGame | null) => void;
  setHomeLeague: (homeLeague: string | null) => void;
  setFavoriteDouble: (favoriteDouble: string | null) => void;
  setFavoritePractice: (favoritePractice: FavoritePractice | null) => void;
  setDefaultMatch: (defaultMatch: DefaultMatch | null) => void;
  setMemberSince: (memberSince: string | null) => void;
  applyPreferences: (preferences: {
    throwingHand?: ThrowingHand | null;
    skillLevel?: SkillLevel | null;
    preferredGame?: PreferredGame | null;
    homeLeague?: string | null;
    favoriteDouble?: string | null;
    favoritePractice?: FavoritePractice | null;
    defaultMatch?: DefaultMatch | null;
    memberSince?: string | null;
  }) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      avatarUrl: null,
      displayName: null,
      nickname: null,
      throwingHand: null,
      skillLevel: null,
      preferredGame: null,
      homeLeague: null,
      favoriteDouble: null,
      favoritePractice: null,
      defaultMatch: null,
      memberSince: null,
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setDisplayName: (displayName) => set({ displayName }),
      setNickname: (nickname) => set({ nickname }),
      setThrowingHand: (throwingHand) => set({ throwingHand }),
      setSkillLevel: (skillLevel) => set({ skillLevel }),
      setPreferredGame: (preferredGame) => set({ preferredGame }),
      setHomeLeague: (homeLeague) => set({ homeLeague }),
      setFavoriteDouble: (favoriteDouble) => set({ favoriteDouble }),
      setFavoritePractice: (favoritePractice) => set({ favoritePractice }),
      setDefaultMatch: (defaultMatch) => set({ defaultMatch }),
      setMemberSince: (memberSince) => set({ memberSince }),
      applyPreferences: (preferences) => set((state) => ({ ...state, ...preferences })),
    }),
    { name: "dartscorer-profile" },
  ),
);
