import { useEffect, useRef, useState } from "react";
import { announceGameOnAsync, prefetchMatchPlayerVoices } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";

const STORAGE_KEY = "dartos:game-on-announced";

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

function markMatchAnnounced(matchId: string): void {
  const announced = getAnnouncedMatchIds();
  announced.add(matchId);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...announced]));
}

export function useMatchGameOnAnnouncement({
  matchId,
  startingPlayerName,
  playerNames = [],
  resumeReady = true,
  onAfterAnnounce,
}: {
  matchId?: string | null;
  startingPlayerName?: string | null;
  playerNames?: string[];
  resumeReady?: boolean;
  onAfterAnnounce?: () => void;
}): { matchIntroReady: boolean } {
  const [matchIntroReady, setMatchIntroReady] = useState(false);
  const onAfterAnnounceRef = useRef(onAfterAnnounce);
  onAfterAnnounceRef.current = onAfterAnnounce;
  const announcingRef = useRef(false);
  const activeMatchIdRef = useRef<string | null>(null);
  const playerNamesKey = playerNames.join("\0");

  useEffect(() => {
    activeMatchIdRef.current = matchId ?? null;

    if (!resumeReady) {
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

    const namesToPrefetch =
      playerNames.length > 0 ? playerNames : [startingPlayerName];
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

    void (async () => {
      try {
        const announced = await announceGameOnAsync(startingPlayerName);
        if (
          !announced ||
          activeMatchIdRef.current !== announceForMatchId
        ) {
          return;
        }

        markMatchAnnounced(announceForMatchId);
        onAfterAnnounceRef.current?.();
      } finally {
        announcingRef.current = false;

        if (activeMatchIdRef.current === announceForMatchId) {
          setMatchIntroReady(true);
        }
      }
    })();

    return () => {
      if (activeMatchIdRef.current === announceForMatchId) {
        activeMatchIdRef.current = null;
      }
    };
  }, [matchId, resumeReady, startingPlayerName, playerNamesKey, playerNames]);

  return { matchIntroReady };
}
