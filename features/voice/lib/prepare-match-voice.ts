import { primeScoreClips } from "@/utils/score-audio";
import { warmVoiceCache } from "@/utils/speech";
import { isVoicePlaybackUnlocked, unlockVoicePlayback } from "@/utils/voice-playback";

async function primeAfterUnlock(onPrime?: () => void): Promise<boolean> {
  if (!isVoicePlaybackUnlocked()) {
    const unlocked = await unlockVoicePlayback();
    if (!unlocked && !isVoicePlaybackUnlocked()) {
      return false;
    }
  }

  warmVoiceCache();
  primeScoreClips();
  onPrime?.();
  return true;
}

/** Call synchronously from button/tap handlers before match navigation or announcements. */
export function prepareMatchVoice(onPrime?: () => void): void {
  void primeAfterUnlock(onPrime);
}

/** Await before navigating to the play screen so autoplay stays unlocked. */
export async function prepareMatchVoiceAsync(onPrime?: () => void): Promise<boolean> {
  return primeAfterUnlock(onPrime);
}
