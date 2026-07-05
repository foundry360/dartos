"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_BOARD_THEME_ID,
  type BoardThemeId,
  isBoardThemeId,
} from "@/lib/board-themes";

interface SettingsState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  confirmFinishTurn: boolean;
  boardThemeId: BoardThemeId;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setConfirmFinishTurn: (enabled: boolean) => void;
  setBoardThemeId: (boardThemeId: BoardThemeId) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      soundEnabled: false,
      confirmFinishTurn: false,
      boardThemeId: DEFAULT_BOARD_THEME_ID,
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setConfirmFinishTurn: (confirmFinishTurn) => set({ confirmFinishTurn }),
      setBoardThemeId: (boardThemeId) => set({ boardThemeId }),
    }),
    {
      name: "dartscorer-settings",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SettingsState>;

        return {
          ...state,
          boardThemeId:
            state.boardThemeId && isBoardThemeId(state.boardThemeId)
              ? state.boardThemeId
              : DEFAULT_BOARD_THEME_ID,
        };
      },
    },
  ),
);
