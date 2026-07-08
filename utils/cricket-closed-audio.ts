import type { CricketTarget, CricketVariant } from "@/lib/constants";
import { getCricketTargets } from "@/lib/constants";
import {
  buildCricketClosedClipPath,
  isCricketClosedTargetForVariant,
} from "@/lib/cricket/cricket-closed-callouts";

let activeClosedAudio: HTMLAudioElement | null = null;

function stopActiveClosedAudio(): void {
  if (!activeClosedAudio) {
    return;
  }

  activeClosedAudio.pause();
  activeClosedAudio.currentTime = 0;
  activeClosedAudio = null;
}

export function primeCricketClosedClips(variant: CricketVariant = "classic"): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const target of getCricketTargets(variant)) {
    const audio = new Audio(buildCricketClosedClipPath(target, variant));
    audio.preload = "auto";
    audio.load();
  }
}

export async function playCricketTargetClosedClip(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): Promise<boolean> {
  if (typeof window === "undefined" || !isCricketClosedTargetForVariant(target, variant)) {
    return false;
  }

  stopActiveClosedAudio();

  const audio = new Audio(buildCricketClosedClipPath(target, variant));
  audio.volume = 0.95;
  audio.preload = "auto";
  activeClosedAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeClosedAudio === audio) {
          activeClosedAudio = null;
        }

        if (failed) {
          reject(new Error("Cricket closed clip playback failed"));
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

export function announceCricketTargetClosed(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): void {
  void playCricketTargetClosedClip(target, variant);
}
