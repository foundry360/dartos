"use client";

import { useEffect } from "react";
import { primeScoreClips } from "@/utils/score-audio";
import { warmVoiceCache } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockVoicePlayback } from "@/utils/voice-playback";

interface UseMatchVoiceReadyOptions {
  /** When false, voice gating is skipped (e.g. no active game). */
  enabled?: boolean;
  /** Game-specific clip prefetch — runs on the unlocking user gesture. */
  onUnlock?: () => void;
}

/**
 * Attempts voice unlock on the play screen but never blocks match flow.
 * Gameplay, bot turns, and intros must not wait on this hook.
 */
export function useMatchVoiceReady(options: UseMatchVoiceReadyOptions = {}): boolean {
  const { enabled = true, onUnlock } = options;
  const voiceEnabled = getMatchAudioPreferences().voice;
  const needsGesture = enabled && voiceEnabled;

  useEffect(() => {
    if (!needsGesture) {
      return;
    }

    const primeAfterUnlock = () => {
      warmVoiceCache();
      primeScoreClips();
      onUnlock?.();
    };

    const tryUnlock = () => {
      void unlockVoicePlayback().then((unlocked) => {
        if (unlocked) {
          primeAfterUnlock();
        }
      });
    };

    tryUnlock();

    window.addEventListener("pointerdown", tryUnlock, { passive: true });
    window.addEventListener("keydown", tryUnlock);

    return () => {
      window.removeEventListener("pointerdown", tryUnlock);
      window.removeEventListener("keydown", tryUnlock);
    };
  }, [needsGesture, onUnlock]);

  return true;
}

/** @deprecated Use useMatchVoiceReady */
export function useVoicePlaybackGestureUnlock(requireGesture: boolean): boolean {
  return useMatchVoiceReady({ enabled: requireGesture });
}
