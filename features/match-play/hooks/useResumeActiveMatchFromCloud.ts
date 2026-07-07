"use client";

import { useEffect, useState } from "react";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { restoreActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { useX01Store } from "@/features/x01/store/x01-store";
import type { X01GameState } from "@/types/x01";

interface UseResumeActiveMatchFromCloudOptions {
  gameMode: "x01" | "cricket";
  x01GameType?: string;
}

export function useResumeActiveMatchFromCloud({
  gameMode,
  x01GameType,
}: UseResumeActiveMatchFromCloudOptions) {
  const cloudSnapshot = useActiveMatchCloudStore((state) => state.snapshot);
  const cloudHydrated = useActiveMatchCloudStore((state) => state.hydrated);
  const [resumeAttempted, setResumeAttempted] = useState(false);

  useEffect(() => {
    if (!cloudHydrated) {
      return;
    }

    const existingGame =
      gameMode === "x01" ? useX01Store.getState().game : useCricketStore.getState().game;

    if (existingGame?.status === "playing") {
      setResumeAttempted(true);
      return;
    }

    if (!cloudSnapshot || cloudSnapshot.gameMode !== gameMode) {
      setResumeAttempted(true);
      return;
    }

    if (gameMode === "x01" && x01GameType) {
      const gameState = cloudSnapshot.gameState as X01GameState;

      if (String(gameState.gameType) !== x01GameType) {
        setResumeAttempted(true);
        return;
      }
    }

    restoreActiveMatchSnapshot(cloudSnapshot);
    setResumeAttempted(true);
  }, [cloudHydrated, cloudSnapshot, gameMode, x01GameType]);

  return {
    ready: cloudHydrated && resumeAttempted,
  };
}
