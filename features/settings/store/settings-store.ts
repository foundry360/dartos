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
  readPersistedSoundEnabled,
  readPersistedVoiceAnnouncementsEnabled,
} from "@/utils/sound-settings";

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
  applyFromCloud: (settings: Partial<typeof DEFAULT_SETTINGS>) => void;
  reset: () => void;
}

function readInitialSoundEnabled(): boolean {
  if (typeof window === "undefined" || sessionStorage.getItem("dartos:sound-enabled") == null) {
    return DEFAULT_SETTINGS.soundEnabled;
  }

  return readPersistedSoundEnabled();
}

function readInitialVoiceAnnouncementsEnabled(): boolean {
  if (typeof window === "undefined" || sessionStorage.getItem("dartos:voice-enabled") == null) {
    return DEFAULT_SETTINGS.voiceAnnouncementsEnabled;
  }

  return readPersistedVoiceAnnouncementsEnabled();
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...DEFAULT_SETTINGS,
  soundEnabled: readInitialSoundEnabled(),
  voiceAnnouncementsEnabled: readInitialVoiceAnnouncementsEnabled(),
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
