import { buildPlayerTurnPhrase, sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { isBotDisplayName } from "@/features/bot/lib/bot-profiles";
import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";

/** Busts stale client cache when bot clips were first generated with the wrong voice. */
const BOT_TURN_CACHE_GENERATION = "bot-george-v2";

export function buildPlayerTurnSlug(playerName: string): string {
  return sanitizePlayerNameForTts(playerName).toLowerCase().replace(/\s+/g, "-");
}

function buildPlayerTurnCacheSuffix(playerName: string): string {
  return isBotDisplayName(playerName) ? `:${BOT_TURN_CACHE_GENERATION}` : "";
}

export function buildPlayerTurnCacheKey(playerName: string): string {
  return `player-turn:${getVoiceClipProfile()}:${KOKORO_VOICE_CACHE_GENERATION}:${buildPlayerTurnSlug(playerName)}${buildPlayerTurnCacheSuffix(playerName)}`;
}

/** @deprecated Use buildPlayerTurnCacheKey */
export const buildDanielTurnCacheKey = buildPlayerTurnCacheKey;

export function buildBundledPlayerTurnClipPath(playerName: string): string {
  return `/sounds/turns/${buildPlayerTurnSlug(playerName)}.wav`;
}

export function buildPlayerTurnPhraseText(playerName: string): string {
  return buildPlayerTurnPhrase(playerName);
}
