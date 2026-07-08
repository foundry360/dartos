import { useEffect, useRef } from "react";
import { announceGameOnAsync, prefetchGameOnVoices } from "@/utils/speech";
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
    prefetchGameOnVoices(namesToPrefetch);

    if (getAnnouncedMatchIds().has(matchId)) {
      return;
    }

    void (async () => {
      const announced = await announceGameOnAsync(startingPlayerName);
      if (announced) {
        markMatchAnnounced(matchId);
        onAfterAnnounceRef.current?.();
      }
    })();
  }, [matchId, resumeReady, startingPlayerName, playerNamesKey, playerNames]);
}
