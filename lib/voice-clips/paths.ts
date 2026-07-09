import { getVoiceClipProfile } from "@/lib/voice-clips/profile";
import { buildPlayerTurnSlug } from "@/utils/player-turn-audio";

export const VOICE_CLIPS_BUCKET = "voice-clips";

export function buildTurnClipStoragePath(playerName: string): string {
  return `${getVoiceClipProfile()}/turns/${buildPlayerTurnSlug(playerName)}.wav`;
}

export function buildGameOnClipStoragePath(playerName: string): string {
  return `${getVoiceClipProfile()}/game-on/${buildPlayerTurnSlug(playerName)}.wav`;
}

export function buildScoreClipStoragePath(slug: string): string {
  return `${getVoiceClipProfile()}/scores/${slug}.wav`;
}

export function getVoiceClipPublicUrl(storagePath: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  const normalizedPath = storagePath.replace(/^\/+/, "");
  return `${supabaseUrl}/storage/v1/object/public/${VOICE_CLIPS_BUCKET}/${normalizedPath}`;
}

export function isVoiceClipCdnConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
}
