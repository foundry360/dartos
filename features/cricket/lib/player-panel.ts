import type { CSSProperties } from "react";

export const ACTIVE_PLAYER_PANEL_CLASS = "border-2 transition-colors";

export function activePlayerPanelStyle(
  color: string,
  isActive: boolean,
): CSSProperties | undefined {
  if (!isActive) {
    return undefined;
  }

  return {
    backgroundColor: `${color}40`,
    borderColor: color,
  };
}
