import type { SynthesizedSpeech } from "@/lib/google-tts/synthesize";

const serverTtsCache = new Map<string, SynthesizedSpeech>();

export function getServerTtsCacheKey(
  phraseText: string,
  model: string,
  voice: string,
): string {
  return `${model}:${voice}:${phraseText}`;
}

export function getCachedServerSpeech(cacheKey: string): SynthesizedSpeech | null {
  return serverTtsCache.get(cacheKey) ?? null;
}

export function cacheServerSpeech(cacheKey: string, speech: SynthesizedSpeech): void {
  serverTtsCache.set(cacheKey, speech);

  if (serverTtsCache.size > 200) {
    const oldestKey = serverTtsCache.keys().next().value;
    if (oldestKey) {
      serverTtsCache.delete(oldestKey);
    }
  }
}
