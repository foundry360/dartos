"use client";

import { useEffect, useState } from "react";
import { primeScoreClips } from "@/utils/score-audio";
import { warmVoiceCache } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { isVoicePlaybackUnlocked, unlockVoicePlayback } from "@/utils/voice-playback";

interface UseMatchVoiceReadyOptions {
  /** When false, voice gating is skipped (e.g. no active game). */
  enabled?: boolean;
  /** Game-specific clip prefetch — runs on the unlocking user gesture. */
  onUnlock?: () => void;
}

/**
 * Production PWAs block audio until a user gesture on the current document.
 * Match intros, bot turns, and round-end callouts all need this unlock first.
 */
export function useMatchVoiceReady(options: UseMatchVoiceReadyOptions = {}): boolean {
  const { enabled = true, onUnlock } = options;
  const voiceEnabled = getMatchAudioPreferences().voice;
  const needsGesture = enabled && voiceEnabled;

  const [ready, setReady] = useState(() => {
    if (!needsGesture) {
      return true;
    }

    return isVoicePlaybackUnlocked();
  });

  useEffect(() => {
    if (!needsGesture) {
      setReady(true);
      return;
    }

    if (isVoicePlaybackUnlocked()) {
      setReady(true);
      return;
    }

    setReady(false);

    const markReady = () => {
      warmVoiceCache();
      primeScoreClips();
      onUnlock?.();
      setReady(true);
    };

    void unlockVoicePlayback().then((unlocked) => {
      if (unlocked) {
        markReady();
      }
    });

    const unlock = () => {
      void unlockVoicePlayback().then((unlocked) => {
        if (!unlocked) {
          return;
        }

        markReady();
      });
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [needsGesture, onUnlock]);

  return ready;
}

/** @deprecated Use useMatchVoiceReady */
export function useVoicePlaybackGestureUnlock(requireGesture: boolean): boolean {
  return useMatchVoiceReady({ enabled: requireGesture });
}
