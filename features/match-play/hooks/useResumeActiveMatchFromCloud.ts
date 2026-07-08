"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const snapshots = useActiveMatchCloudStore((state) => state.snapshots);
  const cloudHydrated = useActiveMatchCloudStore((state) => state.hydrated);
  const [resumeAttempted, setResumeAttempted] = useState(false);
  const autoResumeAttemptedRef = useRef(false);

  useEffect(() => {
    if (!cloudHydrated) {
      return;
    }

    const existingGame =
      gameMode === "x01" ? useX01Store.getState().game : useCricketStore.getState().game;

    if (existingGame) {
      setResumeAttempted(true);
      return;
    }

    if (autoResumeAttemptedRef.current) {
      setResumeAttempted(true);
      return;
    }

    const candidates = snapshots.filter(
      (snapshot) =>
        snapshot.gameMode === gameMode && snapshot.gameState.status === "playing",
    );
    const cloudSnapshot = matchId
      ? candidates.find((snapshot) => snapshot.id === matchId)
      : candidates[0];

    if (!cloudSnapshot) {
      autoResumeAttemptedRef.current = true;
      setResumeAttempted(true);
      return;
    }

    if (gameMode === "x01" && x01GameType) {
      const gameState = cloudSnapshot.gameState as X01GameState;

      if (String(gameState.gameType) !== x01GameType) {
        autoResumeAttemptedRef.current = true;
        setResumeAttempted(true);
        return;
      }
    }

    restoreActiveMatchSnapshot(cloudSnapshot);
    autoResumeAttemptedRef.current = true;
    setResumeAttempted(true);
  }, [cloudHydrated, gameMode, matchId, snapshots, x01GameType]);

  return {
    ready: cloudHydrated && resumeAttempted,
  };
}
