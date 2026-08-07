import type { AllowedTtsPhraseId } from "@/lib/google-tts/phrases";
import { sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { getClientPlaybackRate, getTtsCacheGeneration } from "@/lib/google-tts/env";
import {
  cachePhraseAudio,
  getCachedPhraseAudio,
  normalizeGeminiWavBlob,
} from "@/utils/tts-cache";
import { playVisitTotalClip, primeScoreClips } from "@/utils/score-audio";
import { announceGameShot, primeGameShotClips } from "@/utils/game-shot-audio";
import type { GameShotOutcome } from "@/lib/game-shot-callouts";
import {
  announceCheckoutCallout,
  primeCheckoutClips,
} from "@/utils/checkout-audio";
import type { CheckoutCallout } from "@/lib/checkout-callouts";
import {
  buildPlayerTurnCacheKey,
  buildPlayerTurnPhraseText,
} from "@/utils/player-turn-audio";
import {
  buildGameOnCacheKey,
  buildGameOnPhrase,
} from "@/lib/game-on-callouts";
import {
  buildGameOnClipStoragePath,
  buildTurnClipStoragePath,
} from "@/lib/voice-clips/paths";
import {
  ensureVoiceClipCacheReady,
  fetchCachedVoiceClip,
} from "@/utils/voice-clip-client";
import { isGameOnPlaybackBlocked } from "@/utils/game-on-gate";
import {
  enqueueVoicePlayback,
  playVoiceBlob,
  cancelVoiceAnnouncements,
  getVoicePlaybackGeneration,
  isVoicePlaybackCancelled,
  unlockVoicePlayback,
} from "@/utils/voice-playback";

const inFlightTurnFetches = new Map<string, Promise<Blob | null>>();
const inFlightGameOnFetches = new Map<string, Promise<Blob | null>>();
const inFlightGeminiFetches = new Map<string, Promise<Blob | null>>();

function buildGeminiAudioCacheKey(body: Record<string, string>): string {
  const generation = getTtsCacheGeneration();
  return `phrase:${generation}:${body.phraseId ?? "unknown"}`;
}

async function fetchGeminiPhraseAudio(body: Record<string, string>): Promise<Blob | null> {
  const cacheKey = buildGeminiAudioCacheKey(body);
  const inFlight = inFlightGeminiFetches.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    await ensureVoiceClipCacheReady();

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

async function fetchPlayerTurnAudio(playerName: string): Promise<Blob | null> {
  return fetchCachedVoiceClip({
    cacheKey: buildPlayerTurnCacheKey(playerName),
    storagePath: buildTurnClipStoragePath(playerName),
    text: buildPlayerTurnPhraseText(playerName),
    inFlight: inFlightTurnFetches,
  });
}

async function fetchGameOnAudio(playerName: string): Promise<Blob | null> {
  return fetchCachedVoiceClip({
    cacheKey: buildGameOnCacheKey(playerName),
    storagePath: buildGameOnClipStoragePath(playerName),
    text: buildGameOnPhrase(playerName),
    inFlight: inFlightGameOnFetches,
  });
}

async function playFixedPhraseAudio(phraseId: AllowedTtsPhraseId): Promise<void> {
  const blob = await fetchGeminiPhraseAudio({ phraseId });
  if (!blob) {
    return;
  }

  await playVoiceBlob(blob, getClientPlaybackRate(), 0.9);
}

export function warmVoiceCache(): void {
  unlockVoicePlayback();
  void ensureVoiceClipCacheReady();
}

export function prefetchPlayerTurnVoice(playerName: string): void {
  void fetchPlayerTurnAudio(playerName);
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

export function prefetchGameOnVoice(playerName: string): void {
  void fetchGameOnAudio(playerName);
}

export function prefetchGameOnVoices(playerNames: string[]): void {
  const seen = new Set<string>();

  for (const playerName of playerNames) {
    const normalized = sanitizePlayerNameForTts(playerName).toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    prefetchGameOnVoice(playerName);
  }
}

/** Prefetch turn + Game On clips for every player in a match (sequential per player). */
export function prefetchMatchPlayerVoices(playerNames: string[]): void {
  void (async () => {
    const seen = new Set<string>();

    for (const playerName of playerNames) {
      const normalized = sanitizePlayerNameForTts(playerName).toLowerCase();
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      await fetchPlayerTurnAudio(playerName);
      await fetchGameOnAudio(playerName);
    }
  })();
}

export function prefetchVoiceTest(): void {
  void fetchGeminiPhraseAudio({ phraseId: "voice-test" });
}

export function playVoiceTest(): void {
  void playFixedPhraseAudio("voice-test");
}

async function announcePlayerTurnAsync(playerName: string): Promise<void> {
  const voiceGeneration = getVoicePlaybackGeneration();
  const turnClip = await fetchPlayerTurnAudio(playerName);

  if (isVoicePlaybackCancelled(voiceGeneration)) {
    return;
  }

  if (turnClip && (await playVoiceBlob(turnClip, 1, 0.9))) {
    return;
  }
}

export function announcePlayerTurn(playerName: string): void {
  void enqueueVoicePlayback(() => announcePlayerTurnAsync(playerName));
}

export async function announceGameOnAsync(
  playerName: string,
  isAborted?: () => boolean,
): Promise<boolean> {
  const shouldAbort = () =>
    isGameOnPlaybackBlocked() || Boolean(isAborted?.());

  if (shouldAbort()) {
    return false;
  }

  return enqueueVoicePlayback(async () => {
    if (shouldAbort()) {
      return false;
    }

    const voiceGeneration = getVoicePlaybackGeneration();
    const gameOnClip = await fetchGameOnAudio(playerName);

    if (
      shouldAbort() ||
      isVoicePlaybackCancelled(voiceGeneration)
    ) {
      return false;
    }

    if (!gameOnClip) {
      return false;
    }

    // Abort checks inside playVoiceBlob — finish/Leave can strip then an
    // in-flight play() used to reload Game On onto the shared <audio>.
    const played = await playVoiceBlob(gameOnClip, 1, 0.9, {
      isAborted: shouldAbort,
    });

    if (
      !played ||
      shouldAbort() ||
      isVoicePlaybackCancelled(voiceGeneration)
    ) {
      return false;
    }

    return true;
  });
}

export function announceGameOn(playerName: string): void {
  void announceGameOnAsync(playerName);
}

export async function announceVisitTotal(total: number, busted = false): Promise<void> {
  const voiceGeneration = getVoicePlaybackGeneration();
  const playedClip = await playVisitTotalClip(total, busted);

  if (isVoicePlaybackCancelled(voiceGeneration)) {
    return;
  }

  if (playedClip) {
    return;
  }
}

/**
 * Play visit total, then hand off speech to the next player.
 * Callers that advance match state should do so *before* enqueueing this —
 * never put nextPlayer behind audio (hung clips used to freeze Confirm Turn).
 */
export function announceVisitEndAndHandOff(options: {
  visitTotal: number;
  busted: boolean;
  nextPlayerName: string | null;
  /** @deprecated Advance game state before calling; kept for rare sequencing hooks. */
  onAfterVisitTotal?: () => void;
  getCheckoutCallout?: () => CheckoutCallout | null;
}): Promise<void> {
  // Warm the turn clip while the visit total plays — cuts the iPhone gap
  // between "one-eighty" and "Jason's turn".
  if (options.nextPlayerName) {
    prefetchPlayerTurnVoice(options.nextPlayerName);
  }

  return enqueueVoicePlayback(async () => {
    const voiceGeneration = getVoicePlaybackGeneration();
    await announceVisitTotal(options.visitTotal, options.busted);

    // If a caller still delays state behind voice, run it even when the clip
    // was cancelled mid-play so the match cannot stay stuck on a full visit.
    options.onAfterVisitTotal?.();

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    if (!options.nextPlayerName) {
      return;
    }

    await announcePlayerTurnAsync(options.nextPlayerName);

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    const checkoutCallout = options.getCheckoutCallout?.() ?? null;
    if (checkoutCallout) {
      await announceCheckoutCallout(checkoutCallout);
    }
  });
}

export function announceVisitTotalThenPlayerTurn(
  total: number,
  busted: boolean,
  nextPlayerName: string | null,
  checkoutCallout: CheckoutCallout | null = null,
): void {
  void announceVisitEndAndHandOff({
    visitTotal: total,
    busted,
    nextPlayerName,
    getCheckoutCallout: () => checkoutCallout,
  });
}

export function announceGameShotThenPlayerTurn(
  outcome: GameShotOutcome,
  nextPlayerName: string | null,
  onAfterMatchShot?: () => void,
  checkoutCallout: CheckoutCallout | null = null,
): void {
  if (nextPlayerName) {
    prefetchPlayerTurnVoice(nextPlayerName);
  }

  void enqueueVoicePlayback(async () => {
    const voiceGeneration = getVoicePlaybackGeneration();
    await announceGameShot(outcome);

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    if (outcome === "match") {
      onAfterMatchShot?.();
      return;
    }

    if (!nextPlayerName) {
      return;
    }

    await announcePlayerTurnAsync(nextPlayerName);

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    if (checkoutCallout) {
      await announceCheckoutCallout(checkoutCallout);
    }
  });
}

export function announceCheckoutCalloutAsync(
  checkoutCallout: CheckoutCallout,
): void {
  void enqueueVoicePlayback(() => announceCheckoutCallout(checkoutCallout));
}

export function stopActiveVoiceAudio(): void {
  cancelVoiceAnnouncements();
}

export { cancelVoiceAnnouncements };

export { primeGameShotClips, primeScoreClips, primeCheckoutClips };
