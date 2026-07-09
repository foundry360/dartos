import { buildSpokenPlayerName } from "@/lib/google-tts/phrases";
import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { buildPlayerTurnSlug } from "@/utils/player-turn-audio";

export const GAME_ON_CLIP_BASE_PATH = "/sounds/game-on";

export function buildGameOnPhrase(playerName: string): string {
  return `Game on. ${buildSpokenPlayerName(playerName)} to throw.`;
}

export function buildGameOnClipPath(playerName: string): string {
  return `${GAME_ON_CLIP_BASE_PATH}/${buildPlayerTurnSlug(playerName)}.wav`;
}

export function buildGameOnCacheKey(playerName: string): string {
  return `game-on:${getVoiceClipProfile()}:${KOKORO_VOICE_CACHE_GENERATION}:${buildPlayerTurnSlug(playerName)}`;
}
