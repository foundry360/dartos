import type { AllowedTtsPhraseId } from "@/lib/google-tts/phrases";
import { sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { getClientPlaybackRate, getTtsCacheGeneration } from "@/lib/google-tts/env";
import {
  cachePhraseAudio,
  ensureTtsCacheGeneration,
  getCachedPhraseAudio,
  normalizeGeminiWavBlob,
} from "@/utils/tts-cache";
import { speakFreePhrase } from "@/utils/free-speech";
import { playVisitTotalClip, primeScoreClips } from "@/utils/score-audio";
import { announceGameShot, primeGameShotClips } from "@/utils/game-shot-audio";
import type { GameShotOutcome } from "@/lib/game-shot-callouts";
import {
  announceCheckoutCallout,
  primeCheckoutClips,
} from "@/utils/checkout-audio";
import type { CheckoutCallout } from "@/lib/checkout-callouts";
import {
  buildBundledPlayerTurnClipPath,
  buildDanielTurnCacheKey,
  buildPlayerTurnPhraseText,
} from "@/utils/player-turn-audio";

let activeVoiceAudio: HTMLAudioElement | null = null;
let cacheGenerationReady: Promise<void> | null = null;
const inFlightTurnFetches = new Map<string, Promise<Blob | null>>();
const inFlightGeminiFetches = new Map<string, Promise<Blob | null>>();

function ensureVoiceCacheReady(): Promise<void> {
  if (!cacheGenerationReady) {
    cacheGenerationReady = ensureTtsCacheGeneration(getTtsCacheGeneration());
  }

  return cacheGenerationReady;
}

function buildGeminiAudioCacheKey(body: Record<string, string>): string {
  const generation = getTtsCacheGeneration();
  return `phrase:${generation}:${body.phraseId ?? "unknown"}`;
}

function stopActiveVoiceAudio(): void {
  if (!activeVoiceAudio) {
    return;
  }

  activeVoiceAudio.pause();
  activeVoiceAudio.currentTime = 0;
  activeVoiceAudio = null;
}

async function fetchGeminiPhraseAudio(body: Record<string, string>): Promise<Blob | null> {
  const cacheKey = buildGeminiAudioCacheKey(body);
  const inFlight = inFlightGeminiFetches.get(cacheKey);
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
        return null;
      }

      const blob = normalizeGeminiWavBlob(
        new Blob([await response.arrayBuffer()], { type: "audio/wav" }),
      );
      void cachePhraseAudio(cacheKey, blob);
      return blob;
    } catch {
      return null;
    }
  })();

  inFlightGeminiFetches.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightGeminiFetches.delete(cacheKey);
  }
}

async function fetchBundledTurnClip(playerName: string): Promise<Blob | null> {
  try {
    const response = await fetch(buildBundledPlayerTurnClipPath(playerName), { cache: "force-cache" });
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

async function fetchLocalSayTurnClip(playerName: string): Promise<Blob | null> {
  try {
    const response = await fetch("/api/local-say", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: buildPlayerTurnPhraseText(playerName),
      }),
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

async function fetchDanielTurnAudio(playerName: string): Promise<Blob | null> {
  const cacheKey = buildDanielTurnCacheKey(playerName);
  const inFlight = inFlightTurnFetches.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    await ensureVoiceCacheReady();

    const cached = await getCachedPhraseAudio(cacheKey);
    if (cached) {
      return cached;
    }

    const bundled = await fetchBundledTurnClip(playerName);
    if (bundled) {
      void cachePhraseAudio(cacheKey, bundled);
      return bundled;
    }

    const generated = await fetchLocalSayTurnClip(playerName);
    if (generated) {
      void cachePhraseAudio(cacheKey, generated);
      return generated;
    }

    return null;
  })();

  inFlightTurnFetches.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightTurnFetches.delete(cacheKey);
  }
}

async function playAudioBlob(blob: Blob, playbackRate = getClientPlaybackRate()): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  stopActiveVoiceAudio();

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.src = objectUrl;
  audio.preload = "auto";
  audio.volume = 0.9;
  audio.playbackRate = playbackRate;
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
  const blob = await fetchGeminiPhraseAudio({ phraseId });
  if (!blob) {
    return;
  }

  await playAudioBlob(blob);
}

export function warmVoiceCache(): void {
  void ensureVoiceCacheReady();
}

export function prefetchPlayerTurnVoice(playerName: string): void {
  void fetchDanielTurnAudio(playerName);
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
  void fetchGeminiPhraseAudio({ phraseId: "voice-test" });
}

export function playVoiceTest(): void {
  void playFixedPhraseAudio("voice-test");
}

async function announcePlayerTurnAsync(playerName: string): Promise<void> {
  const danielClip = await fetchDanielTurnAudio(playerName);
  if (danielClip) {
    await playAudioBlob(danielClip, 1);
    return;
  }

  await speakFreePhrase(buildPlayerTurnPhraseText(playerName));
}

export function announcePlayerTurn(playerName: string): void {
  void announcePlayerTurnAsync(playerName);
}

export async function announceVisitTotal(total: number, busted = false): Promise<void> {
  stopActiveVoiceAudio();

  const playedClip = await playVisitTotalClip(total, busted);
  if (playedClip) {
    return;
  }

  await speakFreePhrase(busted || total <= 0 ? "No score" : String(total));
}

export function announceVisitTotalThenPlayerTurn(
  total: number,
  busted: boolean,
  nextPlayerName: string | null,
  checkoutCallout: CheckoutCallout | null = null,
): void {
  void (async () => {
    await announceVisitTotal(total, busted);

    if (!nextPlayerName) {
      return;
    }

    await announcePlayerTurnAsync(nextPlayerName);

    if (checkoutCallout) {
      await announceCheckoutCallout(checkoutCallout);
    }
  })();
}

export function announceGameShotThenPlayerTurn(
  outcome: GameShotOutcome,
  nextPlayerName: string | null,
  onAfterMatchShot?: () => void,
  checkoutCallout: CheckoutCallout | null = null,
): void {
  void (async () => {
    stopActiveVoiceAudio();
    await announceGameShot(outcome);

    if (outcome === "match") {
      onAfterMatchShot?.();
      return;
    }

    if (!nextPlayerName) {
      return;
    }

    await announcePlayerTurnAsync(nextPlayerName);

    if (checkoutCallout) {
      await announceCheckoutCallout(checkoutCallout);
    }
  })();
}

export function announceCheckoutCalloutAsync(
  checkoutCallout: CheckoutCallout,
): void {
  void (async () => {
    stopActiveVoiceAudio();
    await announceCheckoutCallout(checkoutCallout);
  })();
}

export { primeGameShotClips, primeCheckoutClips };
