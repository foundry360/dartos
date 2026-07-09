import {
  buildFinalRoundBullClipPath,
  buildFinalRoundBullPhrase,
  buildRoundCompleteClipPath,
  buildRoundCompletePhrase,
  buildScoreHalvedClipPath,
  buildScoreHalvedPhrase,
  getHalveItCalloutClipPath,
  getHalveItCalloutPhrase,
  getHalveItGameCompleteClipEntries,
  getHalveItRoundClipEntries,
  type HalveItCallout,
} from "@/lib/halve-it-callouts";
import {
  resolveHalveItAnnouncementsAfterVisit,
  resolveHalveItRoundCalloutFromState,
} from "@/features/classic-games/lib/halve-it-engine";
import type { HalveItGameState } from "@/types/halve-it";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
} from "@/utils/commentary-audio";
import { enqueueVoicePlayback } from "@/utils/voice-playback";

export function primeHalveItClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchCommentaryEntries("halve-it", getHalveItRoundClipEntries());
  prefetchCommentaryEntries("halve-it", getHalveItGameCompleteClipEntries());
  prefetchLegacyClipPath(buildFinalRoundBullClipPath(), buildFinalRoundBullPhrase());
  prefetchLegacyClipPath(buildRoundCompleteClipPath(), buildRoundCompletePhrase());
  prefetchLegacyClipPath(buildScoreHalvedClipPath(), buildScoreHalvedPhrase());
}

export async function announceHalveItCallout(callout: HalveItCallout): Promise<void> {
  await announceLegacyClipPath(
    getHalveItCalloutClipPath(callout),
    getHalveItCalloutPhrase(callout),
  );
}

export function announceHalveItCallouts(callouts: HalveItCallout[]): void {
  if (callouts.length === 0) {
    return;
  }

  void enqueueVoicePlayback(async () => {
    for (const callout of callouts) {
      await announceHalveItCallout(callout);
    }
  });
}

export function announceHalveItRound(state: HalveItGameState): void {
  const callout = resolveHalveItRoundCalloutFromState(state);
  if (!callout) {
    return;
  }

  void enqueueVoicePlayback(() => announceHalveItCallout(callout));
}

export function announceHalveItAfterTurn(
  before: HalveItGameState,
  after: HalveItGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveHalveItAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceHalveItCallouts(callouts);
}
