import type { X01GameState } from "@/types/x01";

export function getX01VisitEffectiveScore(state: X01GameState, dartCount: number): number {
  if (dartCount <= 0) {
    return 0;
  }

  return state.history.slice(-dartCount).reduce((sum, entry) => sum + entry.effectiveScore, 0);
}
