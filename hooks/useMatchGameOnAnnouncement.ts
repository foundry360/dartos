import { useEffect, useRef } from "react";
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
}): void {
  const onAfterAnnounceRef = useRef(onAfterAnnounce);
  onAfterAnnounceRef.current = onAfterAnnounce;
  const announcingRef = useRef(false);
  const playerNamesKey = playerNames.join("\0");

  useEffect(() => {
    if (!resumeReady || !matchId || !startingPlayerName) {
      return;
    }

    if (!getMatchAudioPreferences().voice) {
      return;
    }

    const namesToPrefetch =
      playerNames.length > 0 ? playerNames : [startingPlayerName];
    prefetchMatchPlayerVoices(namesToPrefetch);

    if (getAnnouncedMatchIds().has(matchId)) {
      return;
    }

    if (announcingRef.current) {
      return;
    }

    announcingRef.current = true;

    void (async () => {
      try {
        const announced = await announceGameOnAsync(startingPlayerName);
        if (announced) {
          markMatchAnnounced(matchId);
          onAfterAnnounceRef.current?.();
        }
      } finally {
        announcingRef.current = false;
      }
    })();
  }, [matchId, resumeReady, startingPlayerName, playerNamesKey, playerNames]);
}
