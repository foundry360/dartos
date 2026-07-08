"use client";

import { create } from "zustand";
import {
  DEFAULT_BOARD_THEME_ID,
  type BoardThemeId,
  isBoardThemeId,
} from "@/lib/board-themes";
import {
  persistSoundEnabled,
  persistVoiceAnnouncementsEnabled,
  hasPersistedSoundEnabled,
  hasPersistedVoiceAnnouncementsEnabled,
  readPersistedSoundEnabled,
  readPersistedVoiceAnnouncementsEnabled,
} from "@/utils/sound-session-storage";

export const DEFAULT_SETTINGS = {
  hapticsEnabled: true,
  soundEnabled: false,
  voiceAnnouncementsEnabled: false,
  confirmFinishTurn: false,
  boardThemeId: DEFAULT_BOARD_THEME_ID as BoardThemeId,
};

interface SettingsState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  voiceAnnouncementsEnabled: boolean;
  confirmFinishTurn: boolean;
  boardThemeId: BoardThemeId;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVoiceAnnouncementsEnabled: (enabled: boolean) => void;
  setConfirmFinishTurn: (enabled: boolean) => void;
  setBoardThemeId: (boardThemeId: BoardThemeId) => void;
  hydrateFromSession: () => void;
  applyFromCloud: (settings: Partial<typeof DEFAULT_SETTINGS>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...DEFAULT_SETTINGS,
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setSoundEnabled: (soundEnabled) => {
    persistSoundEnabled(soundEnabled);
    set({ soundEnabled });
  },
  setVoiceAnnouncementsEnabled: (voiceAnnouncementsEnabled) => {
    persistVoiceAnnouncementsEnabled(voiceAnnouncementsEnabled);
    set({ voiceAnnouncementsEnabled });
  },
  setConfirmFinishTurn: (confirmFinishTurn) => set({ confirmFinishTurn }),
  setBoardThemeId: (boardThemeId) => set({ boardThemeId }),
  hydrateFromSession: () => {
    if (typeof window === "undefined") {
      return;
    }

    set({
      soundEnabled: hasPersistedSoundEnabled()
        ? readPersistedSoundEnabled()
        : DEFAULT_SETTINGS.soundEnabled,
      voiceAnnouncementsEnabled: hasPersistedVoiceAnnouncementsEnabled()
        ? readPersistedVoiceAnnouncementsEnabled()
        : DEFAULT_SETTINGS.voiceAnnouncementsEnabled,
    });
  },
  applyFromCloud: (settings) =>
    set((state) => {
      const soundEnabled = settings.soundEnabled ?? state.soundEnabled;
      const voiceAnnouncementsEnabled =
        settings.voiceAnnouncementsEnabled ?? state.voiceAnnouncementsEnabled;
      persistSoundEnabled(soundEnabled);
      persistVoiceAnnouncementsEnabled(voiceAnnouncementsEnabled);

      return {
        hapticsEnabled: settings.hapticsEnabled ?? state.hapticsEnabled,
        soundEnabled,
        voiceAnnouncementsEnabled,
        confirmFinishTurn: settings.confirmFinishTurn ?? state.confirmFinishTurn,
        boardThemeId:
          settings.boardThemeId && isBoardThemeId(settings.boardThemeId)
            ? settings.boardThemeId
            : state.boardThemeId,
      };
    }),
  reset: () => set({ ...DEFAULT_SETTINGS }),
}));
