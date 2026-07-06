"use client";

import { useCricketStore } from "@/features/cricket/store/cricket-store";
import type { CricketMatchSetup } from "@/types/player-setup";

export function useStartCricketMatch() {
  const startGame = useCricketStore((state) => state.startGame);

  return (setup: CricketMatchSetup) => {
    startGame(setup);
  };
}
