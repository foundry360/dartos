import { sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { DANIEL_TURN_CACHE_GENERATION } from "@/lib/local-say/env";
import { buildPlayerTurnSlug } from "@/utils/player-turn-audio";

export const GAME_ON_CLIP_BASE_PATH = "/sounds/game-on";

export function buildGameOnPhrase(playerName: string): string {
  return `Game On - ${sanitizePlayerNameForTts(playerName)} To Throw`;
}

export function buildGameOnClipPath(playerName: string): string {
  return `${GAME_ON_CLIP_BASE_PATH}/${buildPlayerTurnSlug(playerName)}.wav`;
}

export function buildGameOnCacheKey(playerName: string): string {
  return `daniel-game-on:${DANIEL_TURN_CACHE_GENERATION}:${buildPlayerTurnSlug(playerName)}`;
}
