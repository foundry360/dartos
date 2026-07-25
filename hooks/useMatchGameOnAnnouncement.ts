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

/** Stop any queued Game On / voice and mark the match so iOS unlock taps won't retry it. */
export function dismissMatchGameOnAnnouncement(matchId?: string | null): void {
  if (matchId) {
    markMatchGameOnAnnounced(matchId);
  }
  cancelVoiceAnnouncements();
}

function clearMatchGameOnAnnounced(matchId: string): void {
  const announced = getAnnouncedMatchIds();
  if (!announced.delete(matchId)) {
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...announced]));
}

export function useMatchGameOnAnnouncement({
  matchId,
  startingPlayerName,
  playerNames = [],
  resumeReady = true,
  enabled = true,
  /** When the match is finished, drop pending Game On retries (e.g. Back to Home tap). */
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
  const announceEnabled = enabled && matchStatus !== "finished";
  const [matchIntroReady, setMatchIntroReady] = useState(() => !resumeReady);
  const onAfterAnnounceRef = useRef(onAfterAnnounce);
  onAfterAnnounceRef.current = onAfterAnnounce;
  const announceEnabledRef = useRef(announceEnabled);
  announceEnabledRef.current = announceEnabled;
  const announcingRef = useRef(false);
  const activeMatchIdRef = useRef<string | null>(null);
  const announceRunRef = useRef(0);
  const starterNameByMatchRef = useRef(new Map<string, string>());
  const pendingRetryRef = useRef<{ matchId: string; playerName: string } | null>(null);

  useEffect(() => {
    activeMatchIdRef.current = matchId ?? null;

    if (!announceEnabled || !resumeReady) {
      // Match finished / left: never let a later unlock tap play a stale Game On.
      if (matchId && matchStatus === "finished") {
        markMatchGameOnAnnounced(matchId);
      }
      pendingRetryRef.current = null;
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

    const announcePlayerName = starterNameByMatchRef.current.get(matchId) ?? startingPlayerName;

    const namesToPrefetch = playerNames.length > 0 ? playerNames : [announcePlayerName];
    prefetchMatchPlayerVoices(namesToPrefetch);

    if (getAnnouncedMatchIds().has(matchId)) {
      pendingRetryRef.current = null;
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
        if (!unlocked) {
          if (announceEnabledRef.current && activeMatchIdRef.current === announceForMatchId) {
            pendingRetryRef.current = {
              matchId: announceForMatchId,
              playerName: announcePlayerName,
            };
          }
          return;
        }

        if (!announceEnabledRef.current || activeMatchIdRef.current !== announceForMatchId) {
          return;
        }

        const announced = await announceGameOnAsync(announcePlayerName);
        if (
          runId !== announceRunRef.current ||
          activeMatchIdRef.current !== announceForMatchId ||
          !announceEnabledRef.current
        ) {
          return;
        }

        if (announced) {
          markMatchGameOnAnnounced(announceForMatchId);
          pendingRetryRef.current = null;
          onAfterAnnounceRef.current?.();
          return;
        }

        // PWA/iOS often blocks the first post-navigation play — retry on next tap.
        pendingRetryRef.current = {
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

      const pending = pendingRetryRef.current;
      if (!pending || announcingRef.current) {
        return;
      }

      if (
        activeMatchIdRef.current !== pending.matchId ||
        getAnnouncedMatchIds().has(pending.matchId)
      ) {
        pendingRetryRef.current = null;
        return;
      }

      announcingRef.current = true;
      void (async () => {
        try {
          unlockSoundEffects();
          const unlocked = await unlockVoicePlayback();
          if (
            !unlocked ||
            !pendingRetryRef.current ||
            !announceEnabledRef.current ||
            activeMatchIdRef.current !== pending.matchId
          ) {
            return;
          }

          const announced = await announceGameOnAsync(pending.playerName);
          if (
            !announced ||
            !announceEnabledRef.current ||
            pendingRetryRef.current?.matchId !== pending.matchId ||
            activeMatchIdRef.current !== pending.matchId
          ) {
            return;
          }

          markMatchGameOnAnnounced(pending.matchId);
          pendingRetryRef.current = null;
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
