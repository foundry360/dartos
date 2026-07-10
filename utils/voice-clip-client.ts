import { getTtsCacheGeneration } from "@/lib/google-tts/env";
import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { getVoiceClipPublicUrl } from "@/lib/voice-clips/paths";
import {
  cachePhraseAudio,
  ensureTtsCacheGeneration,
  getCachedPhraseAudio,
  normalizeGeminiWavBlob,
} from "@/utils/tts-cache";

let cacheGenerationReady: Promise<void> | null = null;

export function buildVoiceClipCacheGeneration(): string {
  return `${getTtsCacheGeneration()}:${KOKORO_VOICE_CACHE_GENERATION}:${getVoiceClipProfile()}`;
}

export function ensureVoiceClipCacheReady(): Promise<void> {
  if (!cacheGenerationReady) {
    cacheGenerationReady = ensureTtsCacheGeneration(buildVoiceClipCacheGeneration());
  }

  return cacheGenerationReady;
}

export async function fetchSupabaseVoiceClip(storagePath: string): Promise<Blob | null> {
  const blobFromResponse = async (response: Response): Promise<Blob | null> => {
    if (!response.ok) {
      return null;
    }

    return normalizeGeminiWavBlob(
      new Blob([await response.arrayBuffer()], { type: "audio/wav" }),
    );
  };

  const publicUrl = getVoiceClipPublicUrl(storagePath);
  if (publicUrl) {
    try {
      const cdnResponse = await fetch(`${publicUrl}?v=${encodeURIComponent(KOKORO_VOICE_CACHE_GENERATION)}`, {
        cache: "no-store",
      });

      const cdnBlob = await blobFromResponse(cdnResponse);
      if (cdnBlob) {
        return cdnBlob;
      }
    } catch {
      // Fall through to API proxy.
    }
  }

  try {
    const apiResponse = await fetch(
      `/api/voice-clip?path=${encodeURIComponent(storagePath)}`,
      { cache: "no-store" },
    );

    const apiBlob = await blobFromResponse(apiResponse);
    if (apiBlob) {
      return apiBlob;
    }
  } catch {
    // Fall through to runtime synthesis.
  }

  return null;
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
