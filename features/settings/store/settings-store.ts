"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  confirmFinishTurn: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setConfirmFinishTurn: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      soundEnabled: false,
      confirmFinishTurn: false,
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setConfirmFinishTurn: (confirmFinishTurn) => set({ confirmFinishTurn }),
    }),
    { name: "dartscorer-settings" },
  ),
);
