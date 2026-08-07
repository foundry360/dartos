import { buildPlayerTurnPhrase, sanitizePlayerNameForTts } from "@/lib/google-tts/phrases";
import { isBotDisplayName } from "@/features/bot/lib/bot-profiles";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { KOKORO_VOICE_CACHE_GENERATION } from "@/lib/local-say/env";
import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { getPlayerScorecardName } from "@/lib/player-display";
import { isIPhoneDevice } from "@/utils/fullscreen";

/** Busts stale client cache when bot clips were first generated with the wrong voice. */
const BOT_TURN_CACHE_GENERATION = "bot-george-v2";

/** Short iPhone bot turn callout — matches the cricket scorecard label. */
export const IPHONE_BOT_TURN_ANNOUNCEMENT_NAME = "Bot";

export function buildPlayerTurnSlug(playerName: string): string {
  return sanitizePlayerNameForTts(playerName).toLowerCase().replace(/\s+/g, "-");
}

function buildPlayerTurnCacheSuffix(playerName: string): string {
  return isBotDisplayName(playerName) || playerName === IPHONE_BOT_TURN_ANNOUNCEMENT_NAME
    ? `:${BOT_TURN_CACHE_GENERATION}`
    : "";
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

/** Name used for "{name}, you're up" — iPhone bot matches use "Bot". */
export function getPlayerTurnAnnouncementName(player: {
  name: string;
  nickname?: string | null;
  playerKind?: "human" | "bot";
  botDifficultyId?: string;
}): string {
  if (typeof window !== "undefined" && isIPhoneDevice() && isBotPlayer(player)) {
    return IPHONE_BOT_TURN_ANNOUNCEMENT_NAME;
  }

  return getPlayerScorecardName(player);
}
