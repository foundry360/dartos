"use client";

import { create } from "zustand";
import {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME_ID,
  type BoardTheme,
} from "@/lib/board-themes";

interface BoardThemesState {
  themes: BoardTheme[];
  source: "local" | "supabase";
  setRemoteThemes: (themes: BoardTheme[]) => void;
  resetThemes: () => void;
}

export const useBoardThemesStore = create<BoardThemesState>((set) => ({
  themes: BOARD_THEMES,
  source: "local",
  setRemoteThemes: (themes) =>
    set({
      themes: themes.length > 0 ? themes : BOARD_THEMES,
      source: themes.length > 0 ? "supabase" : "local",
    }),
  resetThemes: () =>
    set({
      themes: BOARD_THEMES,
      source: "local",
    }),
}));

export function getActiveBoardThemes(): BoardTheme[] {
  const themes = useBoardThemesStore.getState().themes;
  return themes.length > 0 ? themes : BOARD_THEMES;
}

export function getActiveBoardTheme(id: string): BoardTheme {
  const themes = getActiveBoardThemes();
  return themes.find((theme) => theme.id === id) ?? themes[0] ?? BOARD_THEMES[0]!;
}

export function getActiveBoardThemeColors(id: string = DEFAULT_BOARD_THEME_ID) {
  return getActiveBoardTheme(id).colors;
}

export function isKnownBoardThemeId(value: string): boolean {
  return getActiveBoardThemes().some((theme) => theme.id === value);
}
