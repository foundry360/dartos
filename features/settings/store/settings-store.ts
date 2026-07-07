"use client";

import { create } from "zustand";
import {
  DEFAULT_BOARD_THEME_ID,
  type BoardThemeId,
  isBoardThemeId,
} from "@/lib/board-themes";

export const DEFAULT_SETTINGS = {
  hapticsEnabled: true,
  soundEnabled: false,
  confirmFinishTurn: false,
  boardThemeId: DEFAULT_BOARD_THEME_ID as BoardThemeId,
};

interface SettingsState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  confirmFinishTurn: boolean;
  boardThemeId: BoardThemeId;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setConfirmFinishTurn: (enabled: boolean) => void;
  setBoardThemeId: (boardThemeId: BoardThemeId) => void;
  applyFromCloud: (settings: Partial<typeof DEFAULT_SETTINGS>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...DEFAULT_SETTINGS,
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setConfirmFinishTurn: (confirmFinishTurn) => set({ confirmFinishTurn }),
  setBoardThemeId: (boardThemeId) => set({ boardThemeId }),
  applyFromCloud: (settings) =>
    set((state) => ({
      hapticsEnabled: settings.hapticsEnabled ?? state.hapticsEnabled,
      soundEnabled: settings.soundEnabled ?? state.soundEnabled,
      confirmFinishTurn: settings.confirmFinishTurn ?? state.confirmFinishTurn,
      boardThemeId:
        settings.boardThemeId && isBoardThemeId(settings.boardThemeId)
          ? settings.boardThemeId
          : state.boardThemeId,
    })),
  reset: () => set({ ...DEFAULT_SETTINGS }),
}));
