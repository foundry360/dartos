import type { AllowedTtsPhraseId } from "@/lib/google-tts/phrases";
import { sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { getClientPlaybackRate, getTtsCacheGeneration } from "@/lib/google-tts/env";
import {
  cachePhraseAudio,
  ensureTtsCacheGeneration,
  getCachedPhraseAudio,
  normalizeGeminiWavBlob,
} from "@/utils/tts-cache";

let activeVoiceAudio: HTMLAudioElement | null = null;
let cacheGenerationReady: Promise<void> | null = null;
const inFlightFetches = new Map<string, Promise<Blob | null>>();

function ensureVoiceCacheReady(): Promise<void> {
  if (!cacheGenerationReady) {
    cacheGenerationReady = ensureTtsCacheGeneration(getTtsCacheGeneration());
  }

  return cacheGenerationReady;
}

function buildAudioCacheKey(body: Record<string, string>): string {
  const generation = getTtsCacheGeneration();

  if (body.phraseId === "player-turn" || body.phraseId === "player-turn-name") {
    const name = sanitizePlayerNameForTts(body.playerName ?? "").toLowerCase();
    return `turn:${generation}:${name}`;
  }

  return `phrase:${generation}:${body.phraseId ?? "unknown"}`;
}

function buildPlayerTurnRequest(playerName: string): Record<string, string> {
  return {
    phraseId: "player-turn",
    playerName,
  };
}

function stopActiveVoiceAudio(): void {
  if (!activeVoiceAudio) {
    return;
  }

  activeVoiceAudio.pause();
  activeVoiceAudio.currentTime = 0;
  activeVoiceAudio = null;
}

async function fetchTtsAudio(body: Record<string, string>): Promise<Blob | null> {
  const cacheKey = buildAudioCacheKey(body);
  const inFlight = inFlightFetches.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    await ensureVoiceCacheReady();

    const cached = await getCachedPhraseAudio(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        console.warn("[speech] TTS failed:", payload?.error ?? response.statusText);
        return null;
      }

      const blob = normalizeGeminiWavBlob(
        new Blob([await response.arrayBuffer()], { type: "audio/wav" }),
      );
      void cachePhraseAudio(cacheKey, blob);
      return blob;
    } catch (error) {
      console.warn("[speech] TTS request error:", error);
      return null;
    }
  })();

  inFlightFetches.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightFetches.delete(cacheKey);
  }
}

async function playAudioBlob(blob: Blob): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  stopActiveVoiceAudio();

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.src = objectUrl;
  audio.preload = "auto";
  audio.volume = 0.9;
  audio.playbackRate = getClientPlaybackRate();
  audio.preservesPitch = true;
  activeVoiceAudio = audio;

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      if (activeVoiceAudio === audio) {
        activeVoiceAudio = null;
      }
      resolve();
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    void audio.play().catch(cleanup);
  });
}

async function playFixedPhraseAudio(phraseId: AllowedTtsPhraseId): Promise<void> {
  const blob = await fetchTtsAudio({ phraseId });
  if (!blob) {
    return;
  }

  await playAudioBlob(blob);
}

export function warmVoiceCache(): void {
  void ensureVoiceCacheReady();
}

export function prefetchPlayerTurnVoice(playerName: string): void {
  void fetchTtsAudio(buildPlayerTurnRequest(playerName));
}

export function prefetchPlayerTurnVoices(playerNames: string[]): void {
  const seen = new Set<string>();

  for (const playerName of playerNames) {
    const normalized = sanitizePlayerNameForTts(playerName).toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    prefetchPlayerTurnVoice(playerName);
  }
}

export function prefetchVoiceTest(): void {
  void fetchTtsAudio({ phraseId: "voice-test" });
}

export function playVoiceTest(): void {
  void playFixedPhraseAudio("voice-test");
}

export function announcePlayerTurn(playerName: string): void {
  void (async () => {
    const blob = await fetchTtsAudio(buildPlayerTurnRequest(playerName));

    if (!blob) {
      return;
    }

    await playAudioBlob(blob);
  })();
}
