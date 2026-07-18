"use client";

import { create } from "zustand";
import {
  DEFAULT_BOARD_THEME_ID,
  type BoardThemeId,
  isBoardThemeId,
} from "@/lib/board-themes";
import {
  DEFAULT_APP_LANGUAGE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_ZONE,
  isAppLanguageSetting,
  isDateFormatSetting,
  type AppLanguageSetting,
  type DateFormatSetting,
} from "@/features/settings/lib/location-region";
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
  soundEnabled: true,
  voiceAnnouncementsEnabled: true,
  notificationsEnabled: true,
  confirmFinishTurn: false,
  boardThemeId: DEFAULT_BOARD_THEME_ID as BoardThemeId,
  timeZone: DEFAULT_TIME_ZONE,
  dateFormat: DEFAULT_DATE_FORMAT,
  language: DEFAULT_APP_LANGUAGE,
};

interface SettingsState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  voiceAnnouncementsEnabled: boolean;
  notificationsEnabled: boolean;
  confirmFinishTurn: boolean;
  boardThemeId: BoardThemeId;
  timeZone: string;
  dateFormat: DateFormatSetting;
  language: AppLanguageSetting;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVoiceAnnouncementsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setConfirmFinishTurn: (enabled: boolean) => void;
  setBoardThemeId: (boardThemeId: BoardThemeId) => void;
  setTimeZone: (timeZone: string) => void;
  setDateFormat: (dateFormat: DateFormatSetting) => void;
  setLanguage: (language: AppLanguageSetting) => void;
  hydrateFromSession: () => void;
  applyFromCloud: (settings: Partial<typeof DEFAULT_SETTINGS>) => void;
  reset: () => void;
}

const LOCATION_REGION_STORAGE_KEY = "dartos.settings.location-region";

function readPersistedLocationRegion(): Partial<{
  timeZone: string;
  dateFormat: DateFormatSetting;
  language: AppLanguageSetting;
}> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LOCATION_REGION_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as {
      timeZone?: string;
      dateFormat?: string;
      language?: string;
    };

    return {
      timeZone:
        typeof parsed.timeZone === "string" ? parsed.timeZone : undefined,
      dateFormat:
        typeof parsed.dateFormat === "string" &&
        isDateFormatSetting(parsed.dateFormat)
          ? parsed.dateFormat
          : undefined,
      language:
        typeof parsed.language === "string" &&
        isAppLanguageSetting(parsed.language)
          ? parsed.language
          : undefined,
    };
  } catch {
    return {};
  }
}

function persistLocationRegion(input: {
  timeZone: string;
  dateFormat: DateFormatSetting;
  language: AppLanguageSetting;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCATION_REGION_STORAGE_KEY, JSON.stringify(input));
  } catch {
    // ignore quota / private mode
  }
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
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
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setConfirmFinishTurn: (confirmFinishTurn) => set({ confirmFinishTurn }),
  setBoardThemeId: (boardThemeId) => set({ boardThemeId }),
  setTimeZone: (timeZone) => {
    set({ timeZone });
    const state = get();
    persistLocationRegion({
      timeZone,
      dateFormat: state.dateFormat,
      language: state.language,
    });
  },
  setDateFormat: (dateFormat) => {
    set({ dateFormat });
    const state = get();
    persistLocationRegion({
      timeZone: state.timeZone,
      dateFormat,
      language: state.language,
    });
  },
  setLanguage: (language) => {
    set({ language });
    const state = get();
    persistLocationRegion({
      timeZone: state.timeZone,
      dateFormat: state.dateFormat,
      language,
    });
  },
  hydrateFromSession: () => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted = readPersistedLocationRegion();

    set({
      soundEnabled: hasPersistedSoundEnabled()
        ? readPersistedSoundEnabled()
        : DEFAULT_SETTINGS.soundEnabled,
      voiceAnnouncementsEnabled: hasPersistedVoiceAnnouncementsEnabled()
        ? readPersistedVoiceAnnouncementsEnabled()
        : DEFAULT_SETTINGS.voiceAnnouncementsEnabled,
      timeZone: persisted.timeZone ?? DEFAULT_SETTINGS.timeZone,
      dateFormat: persisted.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
      language: persisted.language ?? DEFAULT_SETTINGS.language,
    });
  },
  applyFromCloud: (settings) =>
    set((state) => {
      const soundEnabled = settings.soundEnabled ?? state.soundEnabled;
      const voiceAnnouncementsEnabled =
        settings.voiceAnnouncementsEnabled ?? state.voiceAnnouncementsEnabled;
      persistSoundEnabled(soundEnabled);
      persistVoiceAnnouncementsEnabled(voiceAnnouncementsEnabled);

      const next = {
        hapticsEnabled: settings.hapticsEnabled ?? state.hapticsEnabled,
        soundEnabled,
        voiceAnnouncementsEnabled,
        notificationsEnabled:
          settings.notificationsEnabled ?? state.notificationsEnabled,
        confirmFinishTurn: settings.confirmFinishTurn ?? state.confirmFinishTurn,
        boardThemeId:
          settings.boardThemeId && isBoardThemeId(settings.boardThemeId)
            ? settings.boardThemeId
            : state.boardThemeId,
        timeZone:
          typeof settings.timeZone === "string"
            ? settings.timeZone
            : state.timeZone,
        dateFormat:
          settings.dateFormat !== undefined &&
          isDateFormatSetting(settings.dateFormat)
            ? settings.dateFormat
            : state.dateFormat,
        language:
          settings.language !== undefined &&
          isAppLanguageSetting(settings.language)
            ? settings.language
            : state.language,
      };

      persistLocationRegion({
        timeZone: next.timeZone,
        dateFormat: next.dateFormat,
        language: next.language,
      });

      return next;
    }),
  reset: () => set({ ...DEFAULT_SETTINGS }),
}));
