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
import {
  isVoicePlaybackUnlocked,
  playVoiceBlob,
  stopVoicePlayback,
  unlockVoicePlayback,
} from "@/utils/voice-playback";

const inFlightScoreFetches = new Map<string, Promise<Blob | null>>();

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

  if (!isVoicePlaybackUnlocked()) {
    const unlocked = await unlockVoicePlayback();
    if (!unlocked && !isVoicePlaybackUnlocked()) {
      return false;
    }
  }

  const clip = await fetchVisitScoreAudio(total, busted);

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
