export type HitMissCallout = "hit" | "miss";

export const HIT_MISS_CLIP_BASE_PATH = "/sounds/hit-miss";

const HIT_MISS_PHRASES: Record<HitMissCallout, string> = {
  hit: "Hit",
  miss: "Miss",
};

export function buildHitMissPhrase(callout: HitMissCallout): string {
  return HIT_MISS_PHRASES[callout];
}

export function buildHitMissClipPath(callout: HitMissCallout): string {
  return `${HIT_MISS_CLIP_BASE_PATH}/${callout}.wav`;
}
