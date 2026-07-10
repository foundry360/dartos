import { primeScoreClips } from "@/utils/score-audio";
import { warmVoiceCache } from "@/utils/speech";
import { unlockVoicePlayback } from "@/utils/voice-playback";

const NAVIGATION_UNLOCK_BUDGET_MS = 400;

function primeVoice(onPrime?: () => void): void {
  warmVoiceCache();
  primeScoreClips();
  onPrime?.();
}

/** Best-effort unlock during an active user gesture, capped so navigation never hangs. */
export async function unlockVoiceForNavigation(): Promise<void> {
  await Promise.race([
    unlockVoicePlayback(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, NAVIGATION_UNLOCK_BUDGET_MS);
    }),
  ]);
}

async function primeAfterUnlock(onPrime?: () => void): Promise<boolean> {
  primeVoice(onPrime);
  await unlockVoiceForNavigation();
  return true;
}

/** Call synchronously from button/tap handlers before match navigation or announcements. */
export function prepareMatchVoice(onPrime?: () => void): void {
  void primeAfterUnlock(onPrime);
}

/** Prefer on Start Match — primes clips and unlocks audio without blocking past ~400ms. */
export async function prepareMatchVoiceAsync(onPrime?: () => void): Promise<boolean> {
  return primeAfterUnlock(onPrime);
}
