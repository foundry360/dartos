import {
  COMMENTARY_CLIP_CACHE_GENERATION,
  KOKORO_VOICE_CACHE_GENERATION,
} from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import {
  ensureVoiceClipCacheReady,
  fetchCachedVoiceClip,
} from "@/utils/voice-clip-client";
import { playVoiceBlob } from "@/utils/voice-playback";

const inFlightByCategory = new Map<string, Map<string, Promise<Blob | null>>>();

export function buildCommentaryStoragePath(category: string, slug: string): string {
  return `${getVoiceClipProfile()}/commentary/${category}/${slug}.wav`;
}

function buildCommentaryCacheKey(category: string, slug: string): string {
  return `commentary:${getVoiceClipProfile()}:${KOKORO_VOICE_CACHE_GENERATION}:${COMMENTARY_CLIP_CACHE_GENERATION}:${category}:${slug}`;
}

function getInFlightMap(category: string): Map<string, Promise<Blob | null>> {
  let map = inFlightByCategory.get(category);
  if (!map) {
    map = new Map();
    inFlightByCategory.set(category, map);
  }

  return map;
}

export function parseLegacySoundClipPath(
  clipPath: string,
): { category: string; slug: string } | null {
  const match = clipPath.match(/^\/sounds\/([^/]+)\/(.+)\.wav$/);
  if (!match) {
    return null;
  }

  return {
    category: match[1]!,
    slug: match[2]!,
  };
}

export function stopCommentaryAudio(): void {
  // Kept for compatibility — all playback now goes through voice-playback.
}

async function fetchCommentaryClip(
  category: string,
  slug: string,
  phrase: string,
): Promise<Blob | null> {
  return fetchCachedVoiceClip({
    cacheKey: buildCommentaryCacheKey(category, slug),
    storagePath: buildCommentaryStoragePath(category, slug),
    text: phrase,
    inFlight: getInFlightMap(category),
  });
}

export async function playCommentaryClip(
  category: string,
  slug: string,
  phrase: string,
): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const clip = await fetchCommentaryClip(category, slug, phrase);
  if (!clip) {
    return false;
  }

  return playVoiceBlob(clip);
}

export async function announceCommentaryClip(
  category: string,
  slug: string,
  phrase: string,
): Promise<void> {
  const played = await playCommentaryClip(category, slug, phrase);
  if (played) {
    return;
  }
}

export function prefetchCommentaryClip(category: string, slug: string, phrase: string): void {
  void fetchCommentaryClip(category, slug, phrase);
}

export function prefetchCommentaryEntries(
  category: string,
  entries: Array<{ slug: string; phrase: string }>,
): void {
  for (const entry of entries) {
    prefetchCommentaryClip(category, entry.slug, entry.phrase);
  }
}

export async function announceLegacyClipPath(
  clipPath: string | null,
  _phrase: string,
): Promise<void> {
  if (!clipPath) {
    return;
  }

  const parsed = parseLegacySoundClipPath(clipPath);
  if (!parsed) {
    return;
  }

  await announceCommentaryClip(parsed.category, parsed.slug, _phrase);
}

export function prefetchLegacyClipPath(clipPath: string, phrase: string): void {
  const parsed = parseLegacySoundClipPath(clipPath);
  if (!parsed) {
    return;
  }

  prefetchCommentaryClip(parsed.category, parsed.slug, phrase);
}

export function primeCommentaryCache(): void {
  void ensureVoiceClipCacheReady();
}
