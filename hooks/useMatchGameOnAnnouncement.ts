"use client";

import { useEffect, useRef, useState } from "react";
import { announceGameOnAsync, prefetchMatchPlayerVoices } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockSoundEffects } from "@/utils/sound-effects";
import {
  bindIosAudioUnlockListeners,
  cancelVoiceAnnouncements,
  unlockVoicePlayback,
} from "@/utils/voice-playback";

const STORAGE_KEY = "dartos:game-on-announced";
/** Never block bot turns or match start waiting on Game On audio. */
const MATCH_INTRO_SAFETY_MS = 4_000;

/**
 * Module-level so Match Complete / leave can clear pending retries synchronously
 * inside the same iOS tap that would otherwise unlock and play a stale Game On.
 */
let pendingGameOnRetry: { matchId: string; playerName: string } | null = null;
let gameOnDismissGeneration = 0;

function getAnnouncedMatchIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markMatchGameOnAnnounced(matchId: string): void {
  const announced = getAnnouncedMatchIds();
  announced.add(matchId);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...announced]));
}

/**
 * Invalidate in-flight / pending Game On retries without stopping other voice
 * (e.g. game-shot callouts still playing when the match finishes).
 */
export function suppressMatchGameOnRetry(matchId?: string | null): void {
  gameOnDismissGeneration += 1;
  pendingGameOnRetry = null;
  if (matchId) {
    markMatchGameOnAnnounced(matchId);
  }
}

/** Stop voice and suppress Game On — use on Home / leave / rematch taps. */
export function dismissMatchGameOnAnnouncement(matchId?: string | null): void {
  suppressMatchGameOnRetry(matchId);
  cancelVoiceAnnouncements();
}

function clearMatchGameOnAnnounced(matchId: string): void {
  const announced = getAnnouncedMatchIds();
  if (!announced.delete(matchId)) {
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...announced]));
}

function isGameOnDismissedSince(sinceGeneration: number): boolean {
  return sinceGeneration !== gameOnDismissGeneration;
}

export function useMatchGameOnAnnouncement({
  matchId,
  startingPlayerName,
  playerNames = [],
  resumeReady = true,
  enabled = true,
  /** Only announce while actively playing — never after finish / reset. */
  matchStatus,
  onAfterAnnounce,
}: {
  matchId?: string | null;
  startingPlayerName?: string | null;
  playerNames?: string[];
  resumeReady?: boolean;
  enabled?: boolean;
  matchStatus?: string | null;
  onAfterAnnounce?: () => void;
}): { matchIntroReady: boolean } {
  // Require an explicit playing status so reset()/unmount (status undefined) cannot
  // re-arm iOS unlock retries after Match Complete → Back to Home.
  const announceEnabled =
    enabled && Boolean(matchId) && matchStatus === "playing";
  const [matchIntroReady, setMatchIntroReady] = useState(() => !resumeReady);
  const onAfterAnnounceRef = useRef(onAfterAnnounce);
  onAfterAnnounceRef.current = onAfterAnnounce;
  const announceEnabledRef = useRef(announceEnabled);
  announceEnabledRef.current = announceEnabled;
  const announcingRef = useRef(false);
  const activeMatchIdRef = useRef<string | null>(null);
  const announceRunRef = useRef(0);
  const starterNameByMatchRef = useRef(new Map<string, string>());

  useEffect(() => {
    activeMatchIdRef.current = matchId ?? null;

    if (!announceEnabled || !resumeReady) {
      // Match finished / left: never let a later unlock tap play a stale Game On.
      if (matchId && matchStatus === "finished") {
        suppressMatchGameOnRetry(matchId);
      } else if (!matchId) {
        pendingGameOnRetry = null;
      }
      setMatchIntroReady(!announceEnabled ? true : false);
      return;
    }

    if (!matchId || !startingPlayerName) {
      setMatchIntroReady(true);
      return;
    }

    if (!getMatchAudioPreferences().voice) {
      setMatchIntroReady(true);
      return;
    }

    if (!starterNameByMatchRef.current.has(matchId)) {
      starterNameByMatchRef.current.set(matchId, startingPlayerName);
    }

    const announcePlayerName =
      starterNameByMatchRef.current.get(matchId) ?? startingPlayerName;

    const namesToPrefetch =
      playerNames.length > 0 ? playerNames : [announcePlayerName];
    prefetchMatchPlayerVoices(namesToPrefetch);

    if (getAnnouncedMatchIds().has(matchId)) {
      if (pendingGameOnRetry?.matchId === matchId) {
        pendingGameOnRetry = null;
      }
      setMatchIntroReady(true);
      return;
    }

    if (announcingRef.current) {
      return;
    }

    announcingRef.current = true;
    setMatchIntroReady(false);

    const announceForMatchId = matchId;
    const runId = ++announceRunRef.current;
    const dismissGenerationAtStart = gameOnDismissGeneration;

    const safetyTimerId = window.setTimeout(() => {
      if (activeMatchIdRef.current === announceForMatchId) {
        setMatchIntroReady(true);
      }
    }, MATCH_INTRO_SAFETY_MS);

    void (async () => {
      try {
        // Time-box: Safari may never settle unlock when this runs on mount (no gesture).
        const unlocked = await Promise.race([
          unlockVoicePlayback(),
          new Promise<boolean>((resolve) => {
            window.setTimeout(() => resolve(false), 500);
          }),
        ]);
        if (
          isGameOnDismissedSince(dismissGenerationAtStart) ||
          !announceEnabledRef.current ||
          activeMatchIdRef.current !== announceForMatchId
        ) {
          return;
        }

        if (!unlocked) {
          pendingGameOnRetry = {
            matchId: announceForMatchId,
            playerName: announcePlayerName,
          };
          return;
        }

        const announced = await announceGameOnAsync(
          announcePlayerName,
          () =>
            isGameOnDismissedSince(dismissGenerationAtStart) ||
            runId !== announceRunRef.current ||
            activeMatchIdRef.current !== announceForMatchId ||
            !announceEnabledRef.current,
        );
        if (
          isGameOnDismissedSince(dismissGenerationAtStart) ||
          runId !== announceRunRef.current ||
          activeMatchIdRef.current !== announceForMatchId ||
          !announceEnabledRef.current
        ) {
          return;
        }

        if (announced) {
          markMatchGameOnAnnounced(announceForMatchId);
          pendingGameOnRetry = null;
          onAfterAnnounceRef.current?.();
          return;
        }

        // PWA/iOS often blocks the first post-navigation play — retry on next tap.
        pendingGameOnRetry = {
          matchId: announceForMatchId,
          playerName: announcePlayerName,
        };
        clearMatchGameOnAnnounced(announceForMatchId);
      } finally {
        announcingRef.current = false;

        if (activeMatchIdRef.current === announceForMatchId) {
          setMatchIntroReady(true);
        }
      }
    })();

    return () => {
      window.clearTimeout(safetyTimerId);
      announceRunRef.current += 1;

      if (activeMatchIdRef.current === announceForMatchId) {
        activeMatchIdRef.current = null;
      }
    };
  }, [announceEnabled, matchId, matchStatus, resumeReady]);

  useEffect(() => {
    if (!announceEnabled) {
      return;
    }

    const retryPendingGameOn = () => {
      if (!announceEnabledRef.current) {
        return;
      }

      const pending = pendingGameOnRetry;
      if (!pending || announcingRef.current) {
        return;
      }

      if (
        activeMatchIdRef.current !== pending.matchId ||
        getAnnouncedMatchIds().has(pending.matchId)
      ) {
        pendingGameOnRetry = null;
        return;
      }

      announcingRef.current = true;
      const dismissGenerationAtStart = gameOnDismissGeneration;
      const retryMatchId = pending.matchId;
      const retryPlayerName = pending.playerName;

      void (async () => {
        try {
          unlockSoundEffects();
          const unlocked = await unlockVoicePlayback();
          if (
            !unlocked ||
            isGameOnDismissedSince(dismissGenerationAtStart) ||
            !announceEnabledRef.current ||
            activeMatchIdRef.current !== retryMatchId ||
            pendingGameOnRetry?.matchId !== retryMatchId
          ) {
            return;
          }

          const announced = await announceGameOnAsync(
            retryPlayerName,
            () =>
              isGameOnDismissedSince(dismissGenerationAtStart) ||
              !announceEnabledRef.current ||
              pendingGameOnRetry?.matchId !== retryMatchId ||
              activeMatchIdRef.current !== retryMatchId,
          );
          if (
            !announced ||
            isGameOnDismissedSince(dismissGenerationAtStart) ||
            !announceEnabledRef.current ||
            pendingGameOnRetry?.matchId !== retryMatchId ||
            activeMatchIdRef.current !== retryMatchId
          ) {
            return;
          }

          markMatchGameOnAnnounced(retryMatchId);
          pendingGameOnRetry = null;
          onAfterAnnounceRef.current?.();
        } finally {
          announcingRef.current = false;
        }
      })();
    };

    return bindIosAudioUnlockListeners(retryPendingGameOn);
  }, [announceEnabled]);

  return { matchIntroReady };
}
