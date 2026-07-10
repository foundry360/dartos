import { buildSpokenPlayerName } from "@/lib/google-tts/phrases";
import { isBotDisplayName } from "@/features/bot/lib/bot-profiles";
import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { buildPlayerTurnSlug } from "@/utils/player-turn-audio";

export const GAME_ON_CLIP_BASE_PATH = "/sounds/game-on";

const BOT_GAME_ON_CACHE_GENERATION = "bot-george-v2";

export function buildGameOnPhrase(playerName: string): string {
  return `Game on. ${buildSpokenPlayerName(playerName)} to throw.`;
}

export function buildGameOnClipPath(playerName: string): string {
  return `${GAME_ON_CLIP_BASE_PATH}/${buildPlayerTurnSlug(playerName)}.wav`;
}

function buildGameOnCacheSuffix(playerName: string): string {
  return isBotDisplayName(playerName) ? `:${BOT_GAME_ON_CACHE_GENERATION}` : "";
}

export function buildGameOnCacheKey(playerName: string): string {
  return `game-on:${getVoiceClipProfile()}:${KOKORO_VOICE_CACHE_GENERATION}:${buildPlayerTurnSlug(playerName)}${buildGameOnCacheSuffix(playerName)}`;
}
