import {
  buildHitMissClipPath,
  buildHitMissPhrase,
  type HitMissCallout,
} from "@/lib/hit-miss-callouts";
import {
  announceLegacyClipPath,
  prefetchLegacyClipPath,
  primeCommentaryCache,
} from "@/utils/commentary-audio";
import { enqueueVoicePlayback } from "@/utils/voice-playback";

export function primeHitMissClips(): void {
  for (const callout of ["hit", "miss"] as const) {
    prefetchLegacyClipPath(buildHitMissClipPath(callout), buildHitMissPhrase(callout));
  }
}

export async function playHitMissClip(callout: HitMissCallout): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const clipPath = buildHitMissClipPath(callout);
  const phrase = buildHitMissPhrase(callout);
  await announceLegacyClipPath(clipPath, phrase);
  return true;
}

export async function announceHitMiss(callout: HitMissCallout): Promise<void> {
  await announceLegacyClipPath(buildHitMissClipPath(callout), buildHitMissPhrase(callout));
}

export function announceHitMissCallout(callout: HitMissCallout): void {
  void enqueueVoicePlayback(() => announceHitMiss(callout));
}

export function warmHitMissCache(): void {
  primeCommentaryCache();
}
