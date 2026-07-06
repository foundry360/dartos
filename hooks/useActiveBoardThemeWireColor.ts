"use client";

import { useMemo } from "react";
import { BOARD_THEMES, getBoardThemeWireColor } from "@/lib/board-themes";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";

export function useActiveBoardThemeWireColor(): string {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);

  return useMemo(() => {
    const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;
    const theme =
      availableThemes.find((entry) => entry.id === boardThemeId) ??
      availableThemes[0] ??
      BOARD_THEMES[0]!;

    return getBoardThemeWireColor(theme.colors);
  }, [boardThemeId, themes]);
}
