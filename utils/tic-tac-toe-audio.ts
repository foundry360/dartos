import {
  buildAlreadyClaimedClipPath,
  buildAlreadyClaimedPhrase,
  buildGameCompleteClipPath,
  buildGameCompletePhrase,
  buildGameTitleClipPath,
  buildGameTitlePhrase,
  buildNoClaimClipPath,
  buildNoClaimPhrase,
  buildSquareClaimedClipPath,
  buildSquareClaimedPhrase,
  buildTargetsDisplayedClipPath,
  buildTargetsDisplayedPhrase,
  buildThreeInARowClipPath,
  buildThreeInARowPhrase,
  getTicTacToeCalloutClipPath,
  getTicTacToeCalloutPhrase,
  getTicTacToePlayerStartsClipEntries,
  getTicTacToePlayerWinsClipEntries,
  type TicTacToeCallout,
} from "@/lib/tic-tac-toe-callouts";
import {
  resolveTicTacToeAnnouncementsAfterVisit,
  resolveTicTacToeMatchStartAnnouncements,
} from "@/features/classic-games/lib/tic-tac-toe-engine";
import type { TicTacToeGameState } from "@/types/tic-tac-toe";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
} from "@/utils/commentary-audio";

export function primeTicTacToeClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchCommentaryEntries("tic-tac-toe", getTicTacToePlayerStartsClipEntries());
  prefetchCommentaryEntries("tic-tac-toe", getTicTacToePlayerWinsClipEntries());
  prefetchLegacyClipPath(buildGameTitleClipPath(), buildGameTitlePhrase());
  prefetchLegacyClipPath(buildTargetsDisplayedClipPath(), buildTargetsDisplayedPhrase());
  prefetchLegacyClipPath(buildSquareClaimedClipPath(), buildSquareClaimedPhrase());
  prefetchLegacyClipPath(buildAlreadyClaimedClipPath(), buildAlreadyClaimedPhrase());
  prefetchLegacyClipPath(buildNoClaimClipPath(), buildNoClaimPhrase());
  prefetchLegacyClipPath(buildThreeInARowClipPath(), buildThreeInARowPhrase());
  prefetchLegacyClipPath(buildGameCompleteClipPath(), buildGameCompletePhrase());
}

export async function announceTicTacToeCallout(callout: TicTacToeCallout): Promise<void> {
  await announceLegacyClipPath(
    getTicTacToeCalloutClipPath(callout),
    getTicTacToeCalloutPhrase(callout),
  );
}

export async function announceTicTacToeCallouts(callouts: TicTacToeCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceTicTacToeCallout(callout);
  }
}

export function announceTicTacToeMatchStart(state: TicTacToeGameState): void {
  void announceTicTacToeCallouts(resolveTicTacToeMatchStartAnnouncements(state));
}

export function announceTicTacToeAfterVisit(
  before: TicTacToeGameState,
  after: TicTacToeGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveTicTacToeAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceTicTacToeCallouts(callouts);
}
