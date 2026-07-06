import type { CSSProperties } from "react";

export const ACTIVE_PLAYER_PANEL_CLASS = "border-2 transition-colors";

export const ACTIVE_PLAYER_SCOREBOARD_CLASS = "border-2 cricket-active-player-pulse";

export function activePlayerPanelStyle(
  color: string,
  isActive: boolean,
): CSSProperties | undefined {
  if (!isActive) {
    return undefined;
  }

  return {
    backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`,
    borderColor: color,
  };
}

/** Scoreboard header only — border color comes from CSS pulse animation. */
export function activeScoreboardPlayerStyle(
  color: string,
  isActive: boolean,
): CSSProperties | undefined {
  if (!isActive) {
    return undefined;
  }

  return {
    backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`,
    ["--player-color" as string]: color,
  };
}
