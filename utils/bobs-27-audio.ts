import {
  buildFinalTargetBullClipPath,
  buildFinalTargetBullPhrase,
  buildPlayerEliminatedClipPath,
  buildPlayerEliminatedPhrase,
  buildRoundCompleteClipPath,
  buildRoundCompletePhrase,
  buildScoreReducedClipPath,
  buildScoreReducedPhrase,
  buildStartingScoreClipPath,
  buildStartingScorePhrase,
  getBobs27CalloutClipPath,
  getBobs27CalloutPhrase,
  getBobs27GameCompleteClipEntries,
  getBobs27TargetDoubleClipEntries,
  type Bobs27Callout,
} from "@/lib/bobs-27-callouts";
import {
  resolveBobs27AnnouncementsAfterVisit,
  resolveBobs27MatchStartAnnouncements,
  resolveBobs27TargetCalloutFromState,
} from "@/features/classic-games/lib/bobs-27-engine";
import type { Bobs27GameState } from "@/types/bobs-27";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
} from "@/utils/commentary-audio";
import { enqueueVoicePlayback } from "@/utils/voice-playback";

export function primeBobs27Clips(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchCommentaryEntries("bobs-27", getBobs27TargetDoubleClipEntries());
  prefetchCommentaryEntries("bobs-27", getBobs27GameCompleteClipEntries());
  prefetchLegacyClipPath(buildStartingScoreClipPath(27), buildStartingScorePhrase(27));
  prefetchLegacyClipPath(buildFinalTargetBullClipPath(), buildFinalTargetBullPhrase());
  prefetchLegacyClipPath(buildRoundCompleteClipPath(), buildRoundCompletePhrase());
  prefetchLegacyClipPath(buildScoreReducedClipPath(), buildScoreReducedPhrase());
  prefetchLegacyClipPath(buildPlayerEliminatedClipPath(), buildPlayerEliminatedPhrase());
}

export async function announceBobs27Callout(callout: Bobs27Callout): Promise<void> {
  await announceLegacyClipPath(
    getBobs27CalloutClipPath(callout),
    getBobs27CalloutPhrase(callout),
  );
}

export function announceBobs27Callouts(callouts: Bobs27Callout[]): void {
  if (callouts.length === 0) {
    return;
  }

  void enqueueVoicePlayback(async () => {
    for (const callout of callouts) {
      await announceBobs27Callout(callout);
    }
  });
}

export function announceBobs27MatchStart(state: Bobs27GameState): void {
  const callouts = resolveBobs27MatchStartAnnouncements(state);
  if (callouts.length === 0) {
    return;
  }

  void announceBobs27Callouts(callouts);
}

export function announceBobs27Target(state: Bobs27GameState): void {
  const callout = resolveBobs27TargetCalloutFromState(state);
  if (!callout) {
    return;
  }

  void enqueueVoicePlayback(() => announceBobs27Callout(callout));
}

export function announceBobs27AfterTurn(
  before: Bobs27GameState,
  after: Bobs27GameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveBobs27AnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceBobs27Callouts(callouts);
}
