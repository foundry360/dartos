import { getTtsCacheGeneration } from "@/lib/google-tts/env";
import { DANIEL_TURN_CACHE_GENERATION } from "@/lib/local-say/env";
import {
  getVoiceClipPublicUrl,
  isVoiceClipCdnConfigured,
} from "@/lib/voice-clips/paths";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import {
  cachePhraseAudio,
  ensureTtsCacheGeneration,
  getCachedPhraseAudio,
  normalizeGeminiWavBlob,
} from "@/utils/tts-cache";

let cacheGenerationReady: Promise<void> | null = null;

export function buildVoiceClipCacheGeneration(): string {
  return `${getTtsCacheGeneration()}:${DANIEL_TURN_CACHE_GENERATION}:${getVoiceClipProfile()}`;
}

export function ensureVoiceClipCacheReady(): Promise<void> {
  if (!cacheGenerationReady) {
    cacheGenerationReady = ensureTtsCacheGeneration(buildVoiceClipCacheGeneration());
  }

  return cacheGenerationReady;
}

export async function fetchSupabaseVoiceClip(storagePath: string): Promise<Blob | null> {
  if (!isVoiceClipCdnConfigured()) {
    return null;
  }

  const publicUrl = getVoiceClipPublicUrl(storagePath);
  if (!publicUrl) {
    return null;
  }

  try {
    const cacheBust = encodeURIComponent(DANIEL_TURN_CACHE_GENERATION);
    const response = await fetch(`${publicUrl}?v=${cacheBust}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return normalizeGeminiWavBlob(
      new Blob([await response.arrayBuffer()], { type: "audio/wav" }),
    );
  } catch {
    return null;
  }
}

export async function fetchLocalSayVoiceClip(
  text: string,
  storagePath: string,
): Promise<Blob | null> {
  try {
    const response = await fetch("/api/local-say", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, storagePath }),
    });

    if (!response.ok) {
      return null;
    }

    return normalizeGeminiWavBlob(
      new Blob([await response.arrayBuffer()], { type: "audio/wav" }),
    );
  } catch {
    return null;
  }
}

export async function fetchCachedVoiceClip(options: {
  cacheKey: string;
  storagePath: string;
  text: string;
  inFlight: Map<string, Promise<Blob | null>>;
}): Promise<Blob | null> {
  const { cacheKey, storagePath, text, inFlight } = options;
  const existing = inFlight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    await ensureVoiceClipCacheReady();

    const cached = await getCachedPhraseAudio(cacheKey);
    if (cached) {
      return cached;
    }

    const stored = await fetchSupabaseVoiceClip(storagePath);
    if (stored) {
      void cachePhraseAudio(cacheKey, stored);
      return stored;
    }

    const generated = await fetchLocalSayVoiceClip(text, storagePath);
    if (generated) {
      void cachePhraseAudio(cacheKey, generated);
      return generated;
    }

    return null;
  })();

  inFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export async function playVoiceClipBlob(blob: Blob, playbackRate = 1): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.src = objectUrl;
  audio.volume = 0.95;
  audio.playbackRate = playbackRate;

  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Voice clip playback failed"));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
