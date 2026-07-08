import {
  buildFinalRoundBullClipPath,
  buildRoundCompleteClipPath,
  buildScoreHalvedClipPath,
  getHalveItCalloutClipPath,
  getHalveItCalloutPhrase,
  getHalveItGameCompleteClipEntries,
  getHalveItRoundClipEntries,
  HALVE_IT_CLIP_BASE_PATH,
  type HalveItCallout,
} from "@/lib/halve-it-callouts";
import {
  resolveHalveItAnnouncementsAfterVisit,
  resolveHalveItRoundCalloutFromState,
} from "@/features/classic-games/lib/halve-it-engine";
import type { HalveItGameState } from "@/types/halve-it";
import { speakFreePhrase } from "@/utils/free-speech";

let activeHalveItAudio: HTMLAudioElement | null = null;

function stopActiveHalveItAudio(): void {
  if (!activeHalveItAudio) {
    return;
  }

  activeHalveItAudio.pause();
  activeHalveItAudio.currentTime = 0;
  activeHalveItAudio = null;
}

export function primeHalveItClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getHalveItRoundClipEntries()) {
    const audio = new Audio(`${HALVE_IT_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const entry of getHalveItGameCompleteClipEntries()) {
    const audio = new Audio(`${HALVE_IT_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    buildFinalRoundBullClipPath(),
    buildRoundCompleteClipPath(),
    buildScoreHalvedClipPath(),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playHalveItClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveHalveItAudio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeHalveItAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeHalveItAudio === audio) {
          activeHalveItAudio = null;
        }

        if (failed) {
          reject(new Error("Halve-It clip playback failed"));
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

export async function announceHalveItCallout(callout: HalveItCallout): Promise<void> {
  const clipPath = getHalveItCalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playHalveItClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getHalveItCalloutPhrase(callout));
}

export async function announceHalveItCallouts(callouts: HalveItCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceHalveItCallout(callout);
  }
}

export function announceHalveItRound(state: HalveItGameState): void {
  const callout = resolveHalveItRoundCalloutFromState(state);
  if (!callout) {
    return;
  }

  void announceHalveItCallout(callout);
}

export function announceHalveItAfterTurn(
  before: HalveItGameState,
  after: HalveItGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveHalveItAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceHalveItCallouts(callouts);
}
