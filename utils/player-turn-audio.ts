import { buildPlayerTurnPhrase, sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { isBotDisplayName } from "@/features/bot/lib/bot-profiles";
import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { getPlayerScorecardName } from "@/lib/player-display";

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

type TurnAnnouncementPlayer = {
  name: string;
  nickname?: string | null;
  playerKind?: "human" | "bot";
  botDifficultyId?: string;
};

/**
 * Voice callout names — always the difficulty display name for bots
 * ("Beginner Bot", "Novice Bot", …). UI may still show a short "Bot" label.
 */
export function getPlayerTurnAnnouncementNames(player: TurnAnnouncementPlayer): string[] {
  const displayName = getPlayerScorecardName(player);
  const names = [displayName];
  const rawName = player.name.trim();
  if (rawName && rawName !== displayName) {
    names.push(rawName);
  }
  return names;
}

/** Primary name used for "{name}, you're up". */
export function getPlayerTurnAnnouncementName(player: TurnAnnouncementPlayer): string {
  return getPlayerTurnAnnouncementNames(player)[0] ?? getPlayerScorecardName(player);
}
