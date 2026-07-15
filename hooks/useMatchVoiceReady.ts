"use client";

import { useEffect } from "react";
import { unlockSoundEffects } from "@/utils/sound-effects";
import { primeScoreClips } from "@/utils/score-audio";
import { warmVoiceCache } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { bindIosAudioUnlockListeners, unlockVoicePlayback } from "@/utils/voice-playback";

interface UseMatchVoiceReadyOptions {
  /** When false, voice gating is skipped (e.g. no active game). */
  enabled?: boolean;
  /** Game-specific clip prefetch — runs on the unlocking user gesture. */
  onUnlock?: () => void;
}

/**
 * Attempts voice + SFX unlock on the play screen but never blocks match flow.
 * Gameplay, bot turns, and intros must not wait on this hook.
 */
export function useMatchVoiceReady(options: UseMatchVoiceReadyOptions = {}): boolean {
  const { enabled = true, onUnlock } = options;
  const prefs = getMatchAudioPreferences();
  const needsGesture = enabled && (prefs.voice || prefs.sound);

  useEffect(() => {
    if (!needsGesture) {
      return;
    }

    const primeAfterUnlock = () => {
      if (prefs.voice) {
        warmVoiceCache();
        primeScoreClips();
      }
      onUnlock?.();
    };

    const tryUnlock = () => {
      unlockSoundEffects();
      void unlockVoicePlayback().then(() => {
        // Always prime caches after a gesture — unlock is synchronous on iOS now.
        primeAfterUnlock();
      });
    };

    // Never unlock on mount — Safari suspends resume() outside a gesture and the
    // pending promise stranded every later unlock attempt on iPad.
    return bindIosAudioUnlockListeners(tryUnlock);
  }, [needsGesture, onUnlock, prefs.sound, prefs.voice]);

  return true;
}

/** @deprecated Use useMatchVoiceReady */
export function useVoicePlaybackGestureUnlock(requireGesture: boolean): boolean {
  return useMatchVoiceReady({ enabled: requireGesture });
}
