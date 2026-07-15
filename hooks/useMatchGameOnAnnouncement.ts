"use client";

import { useEffect, useRef, useState } from "react";
import { announceGameOnAsync, prefetchMatchPlayerVoices } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockSoundEffects } from "@/utils/sound-effects";
import { unlockVoicePlayback } from "@/utils/voice-playback";

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
  onAfterAnnounce,
}: {
  matchId?: string | null;
  startingPlayerName?: string | null;
  playerNames?: string[];
  resumeReady?: boolean;
  enabled?: boolean;
  onAfterAnnounce?: () => void;
}): { matchIntroReady: boolean } {
  const [matchIntroReady, setMatchIntroReady] = useState(() => !resumeReady);
  const onAfterAnnounceRef = useRef(onAfterAnnounce);
  onAfterAnnounceRef.current = onAfterAnnounce;
  const announcingRef = useRef(false);
  const activeMatchIdRef = useRef<string | null>(null);
  const announceRunRef = useRef(0);
  const starterNameByMatchRef = useRef(new Map<string, string>());
  const pendingRetryRef = useRef<{ matchId: string; playerName: string } | null>(null);

  useEffect(() => {
    activeMatchIdRef.current = matchId ?? null;

    if (!enabled || !resumeReady) {
      setMatchIntroReady(false);
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
        await unlockVoicePlayback();
        const announced = await announceGameOnAsync(announcePlayerName);
        if (runId !== announceRunRef.current || activeMatchIdRef.current !== announceForMatchId) {
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
  }, [enabled, matchId, resumeReady]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const retryPendingGameOn = () => {
      const pending = pendingRetryRef.current;
      if (!pending || announcingRef.current) {
        return;
      }

      if (getAnnouncedMatchIds().has(pending.matchId)) {
        pendingRetryRef.current = null;
        return;
      }

      announcingRef.current = true;
      void (async () => {
        try {
          unlockSoundEffects();
          const unlocked = await unlockVoicePlayback();
          if (!unlocked || !pendingRetryRef.current) {
            return;
          }

          const announced = await announceGameOnAsync(pending.playerName);
          if (!announced || pendingRetryRef.current?.matchId !== pending.matchId) {
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

    window.addEventListener("pointerdown", retryPendingGameOn, { passive: true });
    window.addEventListener("keydown", retryPendingGameOn);

    return () => {
      window.removeEventListener("pointerdown", retryPendingGameOn);
      window.removeEventListener("keydown", retryPendingGameOn);
    };
  }, [enabled]);

  return { matchIntroReady };
}
