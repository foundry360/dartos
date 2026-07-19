"use client";

import { useMemo } from "react";
import {
  BOARD_THEMES,
  getBoardThemeMarkColor,
  getBoardThemePrimaryColor,
} from "@/lib/board-themes";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";

function useActiveBoardTheme() {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);

  return useMemo(() => {
    const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;
    return (
      availableThemes.find((entry) => entry.id === boardThemeId) ??
      availableThemes[0] ??
      BOARD_THEMES[0]!
    );
  }, [boardThemeId, themes]);
}

export function useActiveBoardThemePrimaryColor(): string {
  const theme = useActiveBoardTheme();
  return useMemo(
    () => getBoardThemePrimaryColor(theme.colors),
    [theme],
  );
}

export function useActiveBoardThemeMarkColor(): string {
  const theme = useActiveBoardTheme();
  return useMemo(() => getBoardThemeMarkColor(theme.colors), [theme]);
}
