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
import { isIPhoneDevice } from "@/utils/fullscreen";
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

type PlayerTurnAnnouncementInput = string | readonly string[] | null | undefined;

function normalizePlayerTurnAnnouncementNames(
  playerName: PlayerTurnAnnouncementInput,
): string[] {
  if (!playerName) {
    return [];
  }

  const names = (Array.isArray(playerName) ? playerName : [playerName])
    .map((name) => name.trim())
    .filter(Boolean);

  const unique: string[] = [];
  for (const name of names) {
    if (!unique.includes(name)) {
      unique.push(name);
    }
  }

  return unique;
}

const inFlightTurnFetches = new Map<string, Promise<Blob | null>>();
const inFlightGameOnFetches = new Map<string, Promise<Blob | null>>();
const inFlightGeminiFetches = new Map<string, Promise<Blob | null>>();
/** Match-session sticky cache — iPhone IDB/CDN was flaky mid-match. */
const sessionTurnClips = new Map<string, Blob>();

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
  const cacheKey = buildPlayerTurnCacheKey(playerName);
  const sessionHit = sessionTurnClips.get(cacheKey);
  if (sessionHit) {
    return sessionHit;
  }

  const clip = await fetchCachedVoiceClip({
    cacheKey,
    storagePath: buildTurnClipStoragePath(playerName),
    text: buildPlayerTurnPhraseText(playerName),
    inFlight: inFlightTurnFetches,
  });

  if (clip) {
    sessionTurnClips.set(cacheKey, clip);
  }

  return clip;
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

async function playPlayerTurnClip(turnClip: Blob): Promise<boolean> {
  if (await playVoiceBlob(turnClip, 1, 0.9)) {
    return true;
  }

  // iPhone HTMLAudio can flake right after a visit-score clip — one retry.
  if (typeof window !== "undefined" && isIPhoneDevice()) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 60);
    });
    return playVoiceBlob(turnClip, 1, 0.9);
  }

  return false;
}

async function resolvePlayerTurnClip(
  playerName: PlayerTurnAnnouncementInput,
): Promise<Blob | null> {
  const namesToTry = normalizePlayerTurnAnnouncementNames(playerName);

  for (const name of namesToTry) {
    const turnClip = await fetchPlayerTurnAudio(name);
    if (turnClip) {
      return turnClip;
    }
  }

  return null;
}

async function announcePlayerTurnAsync(
  playerName: PlayerTurnAnnouncementInput,
): Promise<void> {
  const voiceGeneration = getVoicePlaybackGeneration();
  // Never drop the name on a short fetch timeout — wait for CDN/cache.
  const turnClip = await resolvePlayerTurnClip(playerName);

  if (isVoicePlaybackCancelled(voiceGeneration)) {
    return;
  }

  if (!turnClip) {
    return;
  }

  await playPlayerTurnClip(turnClip);
}

export function announcePlayerTurn(playerName: PlayerTurnAnnouncementInput): void {
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
  nextPlayerName: PlayerTurnAnnouncementInput;
  /** @deprecated Advance game state before calling; kept for rare sequencing hooks. */
  onAfterVisitTotal?: () => void;
  getCheckoutCallout?: () => CheckoutCallout | null;
}): Promise<void> {
  const nextNames = normalizePlayerTurnAnnouncementNames(options.nextPlayerName);

  // Warm the turn clip while the visit total plays — cuts the iPhone gap
  // between "one-eighty" and "Jason's turn".
  for (const name of nextNames) {
    prefetchPlayerTurnVoice(name);
  }

  return enqueueVoicePlayback(async () => {
    const voiceGeneration = getVoicePlaybackGeneration();
    // Resolve the turn clip in parallel with the visit total so the name is
    // ready the moment the score callout finishes (critical on iPhone).
    const turnClipPromise =
      nextNames.length > 0 ? resolvePlayerTurnClip(nextNames) : Promise.resolve(null);

    await announceVisitTotal(options.visitTotal, options.busted);

    // If a caller still delays state behind voice, run it even when the clip
    // was cancelled mid-play so the match cannot stay stuck on a full visit.
    options.onAfterVisitTotal?.();

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    const turnClip = await turnClipPromise;

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    if (turnClip) {
      await playPlayerTurnClip(turnClip);
    }

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
  nextPlayerName: PlayerTurnAnnouncementInput,
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
  nextPlayerName: PlayerTurnAnnouncementInput,
  onAfterMatchShot?: () => void,
  checkoutCallout: CheckoutCallout | null = null,
): void {
  const nextNames = normalizePlayerTurnAnnouncementNames(nextPlayerName);
  for (const name of nextNames) {
    prefetchPlayerTurnVoice(name);
  }

  void enqueueVoicePlayback(async () => {
    const voiceGeneration = getVoicePlaybackGeneration();
    const turnClipPromise =
      outcome !== "match" && nextNames.length > 0
        ? resolvePlayerTurnClip(nextNames)
        : Promise.resolve(null);

    await announceGameShot(outcome);

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    if (outcome === "match") {
      onAfterMatchShot?.();
      return;
    }

    const turnClip = await turnClipPromise;

    if (isVoicePlaybackCancelled(voiceGeneration)) {
      return;
    }

    if (turnClip) {
      await playPlayerTurnClip(turnClip);
    }

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
