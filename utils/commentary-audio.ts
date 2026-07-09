import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { speakFreePhrase } from "@/utils/free-speech";
import {
  ensureVoiceClipCacheReady,
  fetchCachedVoiceClip,
} from "@/utils/voice-clip-client";

const inFlightByCategory = new Map<string, Map<string, Promise<Blob | null>>>();
let activeCommentaryAudio: HTMLAudioElement | null = null;

export function buildCommentaryStoragePath(category: string, slug: string): string {
  return `${getVoiceClipProfile()}/commentary/${category}/${slug}.wav`;
}

function buildCommentaryCacheKey(category: string, slug: string): string {
  return `commentary:${getVoiceClipProfile()}:${KOKORO_VOICE_CACHE_GENERATION}:${category}:${slug}`;
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
  if (!activeCommentaryAudio) {
    return;
  }

  activeCommentaryAudio.pause();
  activeCommentaryAudio.currentTime = 0;
  activeCommentaryAudio = null;
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

async function playCommentaryBlob(blob: Blob): Promise<boolean> {
  stopCommentaryAudio();

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  audio.volume = 0.95;
  audio.playbackRate = 1;
  activeCommentaryAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeCommentaryAudio === audio) {
          activeCommentaryAudio = null;
        }

        if (failed) {
          reject(new Error("Commentary clip playback failed"));
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
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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

  return playCommentaryBlob(clip);
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

  await speakFreePhrase(phrase);
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
  phrase: string,
): Promise<void> {
  if (!clipPath) {
    await speakFreePhrase(phrase);
    return;
  }

  const parsed = parseLegacySoundClipPath(clipPath);
  if (!parsed) {
    await speakFreePhrase(phrase);
    return;
  }

  await announceCommentaryClip(parsed.category, parsed.slug, phrase);
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
