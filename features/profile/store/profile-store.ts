"use client";

import { create } from "zustand";
import type {
  DefaultMatch,
  FavoritePractice,
  PreferredGame,
  SkillLevel,
  ThrowingHand,
} from "@/types/profile";

export const DEFAULT_PROFILE_STATE = {
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
};

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
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>()((set) => ({
  ...DEFAULT_PROFILE_STATE,
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
  reset: () => set({ ...DEFAULT_PROFILE_STATE }),
}));
