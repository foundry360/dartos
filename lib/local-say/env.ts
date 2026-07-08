export const LOCAL_SAY_TURN_VOICE =
  process.env.LOCAL_SAY_TURN_VOICE?.trim() || "Daniel (English (UK))";

/** macOS `say` words-per-minute — ~168 is calmer than the old 210. */
export const LOCAL_SAY_NATURAL_RATE =
  process.env.LOCAL_SAY_TURN_RATE?.trim() ||
  process.env.SCORE_CLIP_RATE?.trim() ||
  "168";

export const LOCAL_SAY_TURN_RATE = LOCAL_SAY_NATURAL_RATE;

export const DANIEL_TURN_CACHE_GENERATION = "daniel-v2-natural";

export function isLocalSayAvailable(): boolean {
  return process.platform === "darwin";
}
