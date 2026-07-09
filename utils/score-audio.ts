import { DANIEL_TURN_CACHE_GENERATION } from "@/lib/local-say/env";
import { buildScoreClipStoragePath } from "@/lib/voice-clips/paths";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { buildVisitTotalCallout } from "@/utils/score-callout";
import { speakFreePhrase } from "@/utils/free-speech";
import {
  ensureVoiceClipCacheReady,
  fetchCachedVoiceClip,
} from "@/utils/voice-clip-client";

const inFlightScoreFetches = new Map<string, Promise<Blob | null>>();

let activeScoreAudio: HTMLAudioElement | null = null;

function stopActiveScoreAudio(): void {
  if (!activeScoreAudio) {
    return;
  }

  activeScoreAudio.pause();
  activeScoreAudio.currentTime = 0;
  activeScoreAudio = null;
}

export function buildVisitScoreSlug(total: number, busted = false): string {
  return buildVisitTotalCallout(total, busted).toLowerCase().replace(/\s+/g, "-");
}

function buildVisitScoreCacheKey(slug: string): string {
  return `visit-score:${getVoiceClipProfile()}:${DANIEL_TURN_CACHE_GENERATION}:${slug}`;
}

async function fetchVisitScoreAudio(total: number, busted = false): Promise<Blob | null> {
  const slug = buildVisitScoreSlug(total, busted);
  const text = buildVisitTotalCallout(total, busted);

  return fetchCachedVoiceClip({
    cacheKey: buildVisitScoreCacheKey(slug),
    storagePath: buildScoreClipStoragePath(slug),
    text,
    inFlight: inFlightScoreFetches,
  });
}

async function playScoreBlob(blob: Blob): Promise<void> {
  stopActiveScoreAudio();

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  audio.volume = 0.95;
  audio.playbackRate = 1;
  activeScoreAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeScoreAudio === audio) {
          activeScoreAudio = null;
        }

        if (failed) {
          reject(new Error("Score clip playback failed"));
          return;
        }

        resolve();
      };

      audio.onended = () => cleanup(false);
      audio.onerror = () => cleanup(true);
      void audio.play().catch(() => cleanup(true));
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function playVisitTotalClip(total: number, busted = false): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const clip = await fetchVisitScoreAudio(total, busted);
  if (clip) {
    await playScoreBlob(clip);
    return true;
  }

  await speakFreePhrase(buildVisitTotalCallout(total, busted));
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function prefetchVisitScoreClip(total: number, busted = false): void {
  void fetchVisitScoreAudio(total, busted);
}

export function primeScoreClips(): void {
  void ensureVoiceClipCacheReady();
  prefetchVisitScoreClip(140);
}
