import { buildPlayerTurnPhrase, sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { DANIEL_TURN_CACHE_GENERATION } from "@/lib/local-say/env";

export function buildPlayerTurnSlug(playerName: string): string {
  return sanitizePlayerNameForTts(playerName).toLowerCase().replace(/\s+/g, "-");
}

export function buildDanielTurnCacheKey(playerName: string): string {
  return `daniel-turn:${DANIEL_TURN_CACHE_GENERATION}:${buildPlayerTurnSlug(playerName)}`;
}

export function buildBundledPlayerTurnClipPath(playerName: string): string {
  return `/sounds/turns/${buildPlayerTurnSlug(playerName)}.wav`;
}

export function buildPlayerTurnPhraseText(playerName: string): string {
  return buildPlayerTurnPhrase(playerName);
}
