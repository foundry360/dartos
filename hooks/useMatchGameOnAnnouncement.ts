import { useEffect, useRef, useState } from "react";
import { announceGameOnAsync, prefetchMatchPlayerVoices } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";

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

    markMatchGameOnAnnounced(announceForMatchId);

    const safetyTimerId = window.setTimeout(() => {
      if (activeMatchIdRef.current === announceForMatchId) {
        setMatchIntroReady(true);
      }
    }, MATCH_INTRO_SAFETY_MS);

    void (async () => {
      try {
        const announced = await announceGameOnAsync(announcePlayerName);
        if (
          runId !== announceRunRef.current ||
          !announced ||
          activeMatchIdRef.current !== announceForMatchId
        ) {
          return;
        }

        onAfterAnnounceRef.current?.();
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

  return { matchIntroReady };
}
