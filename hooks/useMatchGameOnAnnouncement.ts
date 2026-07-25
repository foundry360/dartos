"use client";

import { useEffect, useRef, useState } from "react";
import { announceGameOnAsync, prefetchMatchPlayerVoices } from "@/utils/speech";
import {
  armGameOnAnnouncements,
  blockGameOnAnnouncements,
  getGameOnGateGeneration,
  isGameOnGateChangedSince,
  isGameOnPlaybackBlocked,
} from "@/utils/game-on-gate";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import {
  cancelVoiceAnnouncements,
  stripActiveVoiceClip,
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

/**
 * Invalidate Game On for this match without stopping other voice
 * (e.g. game-shot still playing when the match finishes).
 */
export function suppressMatchGameOnRetry(matchId?: string | null): void {
  blockGameOnAnnouncements();
  // Cricket can finish while Game On is still on the shared <audio> element.
  // Strip it without cancelling the voice queue (match-win lines may be queued).
  stripActiveVoiceClip();
  if (matchId) {
    markMatchGameOnAnnounced(matchId);
  }
}

/** Stop voice and block Game On — use on Home / leave / rematch / end taps. */
export function dismissMatchGameOnAnnouncement(matchId?: string | null): void {
  suppressMatchGameOnRetry(matchId);
  cancelVoiceAnnouncements();
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
  // re-arm Game On after Match Complete → Back to Home.
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
      // Match finished / left: never allow a later unlock tap to play Game On.
      if (matchId && matchStatus === "finished") {
        suppressMatchGameOnRetry(matchId);
      } else if (!matchId || matchStatus !== "playing") {
        blockGameOnAnnouncements();
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
      setMatchIntroReady(true);
      return;
    }

    if (announcingRef.current) {
      return;
    }

    // New playing match — allow exactly one intro attempt (no tap-retry listeners).
    armGameOnAnnouncements();
    announcingRef.current = true;
    setMatchIntroReady(false);

    const announceForMatchId = matchId;
    const runId = ++announceRunRef.current;
    const gateGenerationAtStart = getGameOnGateGeneration();

    const safetyTimerId = window.setTimeout(() => {
      if (activeMatchIdRef.current === announceForMatchId) {
        setMatchIntroReady(true);
      }
    }, MATCH_INTRO_SAFETY_MS);

    const isStale = () =>
      isGameOnPlaybackBlocked() ||
      isGameOnGateChangedSince(gateGenerationAtStart) ||
      runId !== announceRunRef.current ||
      activeMatchIdRef.current !== announceForMatchId ||
      !announceEnabledRef.current;

    void (async () => {
      try {
        // Time-box: Safari may never settle unlock when this runs on mount (no gesture).
        const unlocked = await Promise.race([
          unlockVoicePlayback(),
          new Promise<boolean>((resolve) => {
            window.setTimeout(() => resolve(false), 500);
          }),
        ]);

        if (isStale()) {
          markMatchGameOnAnnounced(announceForMatchId);
          return;
        }

        if (!unlocked) {
          // Do NOT register a next-tap retry — Leave / Home taps unlock iOS audio
          // and were replaying a stale Game On. Skip intro for this match.
          markMatchGameOnAnnounced(announceForMatchId);
          return;
        }

        const announced = await announceGameOnAsync(announcePlayerName, isStale);

        // Always mark announced after the attempt so later taps never replay it.
        markMatchGameOnAnnounced(announceForMatchId);

        if (isStale()) {
          return;
        }

        if (announced) {
          onAfterAnnounceRef.current?.();
        }
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

  return { matchIntroReady };
}
