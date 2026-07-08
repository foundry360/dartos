import {
  buildFinalRoundBullClipPath,
  buildRoundCompleteClipPath,
  buildShanghaiAchievedClipPath,
  getShanghaiCalloutClipPath,
  getShanghaiCalloutPhrase,
  getShanghaiPlayerWinsClipEntries,
  getShanghaiRoundClipEntries,
  SHANGHAI_CLIP_BASE_PATH,
  type ShanghaiCallout,
} from "@/lib/shanghai-callouts";
import {
  resolveShanghaiAnnouncementsAfterVisit,
  resolveShanghaiRoundCalloutFromState,
} from "@/features/classic-games/lib/shanghai-engine";
import type { ShanghaiGameState } from "@/types/shanghai";
import { speakFreePhrase } from "@/utils/free-speech";

let activeShanghaiAudio: HTMLAudioElement | null = null;

function stopActiveShanghaiAudio(): void {
  if (!activeShanghaiAudio) {
    return;
  }

  activeShanghaiAudio.pause();
  activeShanghaiAudio.currentTime = 0;
  activeShanghaiAudio = null;
}

export function primeShanghaiClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getShanghaiRoundClipEntries()) {
    const audio = new Audio(`${SHANGHAI_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const entry of getShanghaiPlayerWinsClipEntries()) {
    const audio = new Audio(`${SHANGHAI_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    buildFinalRoundBullClipPath(),
    buildRoundCompleteClipPath(),
    buildShanghaiAchievedClipPath(),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playShanghaiClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveShanghaiAudio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeShanghaiAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeShanghaiAudio === audio) {
          activeShanghaiAudio = null;
        }

        if (failed) {
          reject(new Error("Shanghai clip playback failed"));
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

export async function announceShanghaiCallout(callout: ShanghaiCallout): Promise<void> {
  const clipPath = getShanghaiCalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playShanghaiClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getShanghaiCalloutPhrase(callout));
}

export async function announceShanghaiCallouts(callouts: ShanghaiCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceShanghaiCallout(callout);
  }
}

export function resolveShanghaiRoundCallout(state: ShanghaiGameState): ShanghaiCallout | null {
  return resolveShanghaiRoundCalloutFromState(state);
}

export function announceShanghaiRound(state: ShanghaiGameState): void {
  const callout = resolveShanghaiRoundCallout(state);
  if (!callout) {
    return;
  }

  void announceShanghaiCallout(callout);
}

export function announceShanghaiAfterTurn(
  before: ShanghaiGameState,
  after: ShanghaiGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveShanghaiAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceShanghaiCallouts(callouts);
}
