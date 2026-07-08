export const TURN_ANNOUNCEMENT_FALLBACK_NAME = "Player";

export const ALLOWED_TTS_PHRASES = {
  "voice-test": "Voice announcements enabled.",
  "player-turn-tail": "Your turn.",
} as const;

export type AllowedTtsPhraseId = keyof typeof ALLOWED_TTS_PHRASES;

export function isAllowedTtsPhraseId(value: string): value is AllowedTtsPhraseId {
  return value in ALLOWED_TTS_PHRASES;
}

export function getTtsPhrase(phraseId: AllowedTtsPhraseId): string {
  return ALLOWED_TTS_PHRASES[phraseId];
}

export function sanitizePlayerNameForTts(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ").slice(0, 48);

  if (!trimmed) {
    return TURN_ANNOUNCEMENT_FALLBACK_NAME;
  }

  const cleaned = trimmed.replace(/[^\p{L}\p{N}' .-]/gu, "");

  return cleaned || TURN_ANNOUNCEMENT_FALLBACK_NAME;
}

export function buildPlayerNamePhrase(playerName: string): string {
  return `${sanitizePlayerNameForTts(playerName)}.`;
}

export function buildPlayerTurnPhrase(playerName: string): string {
  return `${sanitizePlayerNameForTts(playerName)}, you're up.`;
}
