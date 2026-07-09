import {
  buildFinalRoundBullClipPath,
  buildFinalRoundBullPhrase,
  buildRoundCompleteClipPath,
  buildRoundCompletePhrase,
  buildShanghaiAchievedClipPath,
  buildShanghaiAchievedPhrase,
  getShanghaiCalloutClipPath,
  getShanghaiCalloutPhrase,
  getShanghaiPlayerWinsClipEntries,
  getShanghaiRoundClipEntries,
  type ShanghaiCallout,
} from "@/lib/shanghai-callouts";
import {
  resolveShanghaiAnnouncementsAfterVisit,
  resolveShanghaiRoundCalloutFromState,
} from "@/features/classic-games/lib/shanghai-engine";
import type { ShanghaiGameState } from "@/types/shanghai";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
} from "@/utils/commentary-audio";

export function primeShanghaiClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchCommentaryEntries("shanghai", getShanghaiRoundClipEntries());
  prefetchCommentaryEntries("shanghai", getShanghaiPlayerWinsClipEntries());
  prefetchLegacyClipPath(buildFinalRoundBullClipPath(), buildFinalRoundBullPhrase());
  prefetchLegacyClipPath(buildRoundCompleteClipPath(), buildRoundCompletePhrase());
  prefetchLegacyClipPath(buildShanghaiAchievedClipPath(), buildShanghaiAchievedPhrase());
}

export async function announceShanghaiCallout(callout: ShanghaiCallout): Promise<void> {
  await announceLegacyClipPath(
    getShanghaiCalloutClipPath(callout),
    getShanghaiCalloutPhrase(callout),
  );
}

export async function announceShanghaiCallouts(callouts: ShanghaiCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceShanghaiCallout(callout);
  }
}

export function resolveShanghaiRoundCallout(state: ShanghaiGameState): ShanghaiCallout | null {
  return resolveShanghaiRoundCalloutFromState(state);
}

export function announceShanghaiRound(state: ShanghaiGameState): void {
  const callout = resolveShanghaiRoundCallout(state);
  if (!callout) {
    return;
  }

  void announceShanghaiCallout(callout);
}

export function announceShanghaiAfterTurn(
  before: ShanghaiGameState,
  after: ShanghaiGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveShanghaiAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceShanghaiCallouts(callouts);
}
