/** Must match the voice engine + voice id on the voice worker. Change when switching voices. */
export const DEFAULT_VOICE_CLIP_PROFILE = "kokoro-bm-george";

export function getVoiceClipProfile(): string {
  const profile =
    process.env.NEXT_PUBLIC_VOICE_CLIP_PROFILE?.trim() ||
    process.env.VOICE_CLIP_PROFILE?.trim() ||
    DEFAULT_VOICE_CLIP_PROFILE;

  return profile.replace(/^\/+|\/+$/g, "");
}
