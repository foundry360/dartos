import {
  buildHitMissClipPath,
  buildHitMissPhrase,
  type HitMissCallout,
} from "@/lib/hit-miss-callouts";
import { speakFreePhrase } from "@/utils/free-speech";

let activeHitMissAudio: HTMLAudioElement | null = null;

function stopActiveHitMissAudio(): void {
  if (!activeHitMissAudio) {
    return;
  }

  activeHitMissAudio.pause();
  activeHitMissAudio.currentTime = 0;
  activeHitMissAudio = null;
}

export function primeHitMissClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const callout of ["hit", "miss"] as const) {
    const audio = new Audio(buildHitMissClipPath(callout));
    audio.preload = "auto";
    audio.load();
  }
}

export async function playHitMissClip(callout: HitMissCallout): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveHitMissAudio();

  const audio = new Audio(buildHitMissClipPath(callout));
  audio.volume = 0.95;
  audio.preload = "auto";
  activeHitMissAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeHitMissAudio === audio) {
          activeHitMissAudio = null;
        }

        if (failed) {
          reject(new Error("Hit/miss clip playback failed"));
          return;
        }

        resolve();
      };

      audio.onended = () => cleanup(false);
      audio.onerror = () => cleanup(true);
      void audio.play().catch(() => cleanup(true));
    });

    return true;
  } catch {
    return false;
  }
}

export async function announceHitMiss(callout: HitMissCallout): Promise<void> {
  const playedClip = await playHitMissClip(callout);
  if (playedClip) {
    return;
  }

  await speakFreePhrase(buildHitMissPhrase(callout));
}

export function announceHitMissCallout(callout: HitMissCallout): void {
  void announceHitMiss(callout);
}
