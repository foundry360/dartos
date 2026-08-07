import {
  KOKORO_VOICE_CACHE_GENERATION,
  SCORE_CLIP_CACHE_GENERATION,
} from "@/lib/local-say/env";
import { buildScoreClipStoragePath } from "@/lib/voice-clips/paths";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { buildVisitTotalCallout } from "@/utils/score-callout";
import {
  ensureVoiceClipCacheReady,
  fetchCachedVoiceClip,
} from "@/utils/voice-clip-client";
import { isPhoneLayoutDevice } from "@/utils/fullscreen";
import { playVoiceBlob, stopVoicePlayback, unlockVoicePlayback } from "@/utils/voice-playback";

const inFlightScoreFetches = new Map<string, Promise<Blob | null>>();

/** On iPhone, don't hold the turn-name callout behind a slow visit-score fetch. */
const IPHONE_VISIT_SCORE_PLAY_WAIT_MS = 450;

export function stopScoreAudio(): void {
  stopVoicePlayback();
}

export function buildVisitScoreSlug(total: number, busted = false): string {
  return buildVisitTotalCallout(total, busted).toLowerCase().replace(/\s+/g, "-");
}

function buildVisitScoreCacheKey(slug: string): string {
  return `visit-score:${getVoiceClipProfile()}:${KOKORO_VOICE_CACHE_GENERATION}:${SCORE_CLIP_CACHE_GENERATION}:${slug}`;
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

export async function playVisitTotalClip(total: number, busted = false): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // Unlock is best-effort — failing the silent unlock must not skip the clip
  // after the user already tapped the board.
  void unlockVoicePlayback();

  const fetchPromise = fetchVisitScoreAudio(total, busted);
  const clip =
    typeof window !== "undefined" && isPhoneLayoutDevice()
      ? await Promise.race([
          fetchPromise,
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), IPHONE_VISIT_SCORE_PLAY_WAIT_MS);
          }),
        ])
      : await fetchPromise;

  // Keep warming in the background if we raced ahead of the fetch.
  if (!clip) {
    void fetchPromise;
  }

  if (clip && (await playVoiceBlob(clip))) {
    return true;
  }

  return false;
}

export async function ensureVisitScoreClipReady(total: number, busted = false): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  return (await fetchVisitScoreAudio(total, busted)) != null;
}

export function prefetchVisitScoreClip(total: number, busted = false): void {
  void fetchVisitScoreAudio(total, busted);
}

export function primeScoreClips(): void {
  void ensureVoiceClipCacheReady();
  prefetchVisitScoreClip(140);
}
