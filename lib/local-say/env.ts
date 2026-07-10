export const LOCAL_SAY_TURN_VOICE =
  process.env.LOCAL_SAY_TURN_VOICE?.trim() || "Daniel (English (UK))";

/** macOS `say` words-per-minute — ~168 is calmer than the old 210. */
export const LOCAL_SAY_NATURAL_RATE =
  process.env.LOCAL_SAY_TURN_RATE?.trim() ||
  process.env.SCORE_CLIP_RATE?.trim() ||
  "168";

export const LOCAL_SAY_TURN_RATE = LOCAL_SAY_NATURAL_RATE;

export const KOKORO_VOICE_CACHE_GENERATION = "kokoro-bm-george-v5";

/** Busts stale IndexedDB commentary clips generated before Supabase seeding. */
export const COMMENTARY_CLIP_CACHE_GENERATION = "george-seeded-v1";

/** Busts stale IndexedDB visit-score clips generated before Supabase seeding. */
export const SCORE_CLIP_CACHE_GENERATION = "george-seeded-v1";

/** @deprecated Use KOKORO_VOICE_CACHE_GENERATION */
export const DANIEL_TURN_CACHE_GENERATION = KOKORO_VOICE_CACHE_GENERATION;

export const PIPER_BIN = process.env.PIPER_BIN?.trim() || "piper";

export const PIPER_MODEL_PATH = process.env.PIPER_MODEL_PATH?.trim() || "";

export const LOCAL_SAY_CACHE_DIR =
  process.env.LOCAL_SAY_CACHE_DIR?.trim() ||
  `${process.cwd()}/.cache/voice-phrases`;

export const VOICE_SYNTHESIS_URL = process.env.VOICE_SYNTHESIS_URL?.trim() || "";

export const VOICE_SYNTHESIS_TOKEN = process.env.VOICE_SYNTHESIS_TOKEN?.trim() || "";

export function isPiperConfigured(): boolean {
  return Boolean(PIPER_MODEL_PATH);
}

/** Runtime synthesis for player names — macOS `say` in dev, Piper in production. */
export function isRuntimeVoiceSynthesisAvailable(): boolean {
  if (process.platform === "darwin") {
    return true;
  }

  return isPiperConfigured();
}

/** @deprecated Use isRuntimeVoiceSynthesisAvailable */
export function isLocalSayAvailable(): boolean {
  return isRuntimeVoiceSynthesisAvailable();
}
