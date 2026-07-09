import type { CricketTarget, CricketVariant } from "@/lib/constants";
import { getCricketTargets } from "@/lib/constants";
import {
  buildCricketClosedClipPath,
  buildCricketClosedPhrase,
  getCricketClosedClipEntries,
  isCricketClosedTargetForVariant,
} from "@/lib/cricket/cricket-closed-callouts";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  primeCommentaryCache,
} from "@/utils/commentary-audio";

export function primeCricketClosedClips(variant: CricketVariant = "classic"): void {
  prefetchCommentaryEntries("cricket-closed", getCricketClosedClipEntries(variant));
}

export async function playCricketTargetClosedClip(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): Promise<boolean> {
  if (typeof window === "undefined" || !isCricketClosedTargetForVariant(target, variant)) {
    return false;
  }

  await announceLegacyClipPath(
    buildCricketClosedClipPath(target, variant),
    buildCricketClosedPhrase(target, variant),
  );
  return true;
}

export function announceCricketTargetClosed(
  target: CricketTarget,
  variant: CricketVariant = "classic",
): void {
  void playCricketTargetClosedClip(target, variant);
}

export function warmCricketClosedCache(): void {
  primeCommentaryCache();
  for (const variant of ["classic", "tactics"] as const) {
    primeCricketClosedClips(variant);
  }
}
