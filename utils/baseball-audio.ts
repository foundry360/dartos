import {
  getBaseballCalloutClipPath,
  getBaseballCalloutPhrase,
  getBaseballFixedClipPath,
  getBaseballInningClipEntries,
  type BaseballFixedCallout,
} from "@/lib/baseball-callouts";
import { getBaseballCurrentTarget } from "@/features/classic-games/lib/baseball-engine";
import type { BaseballGameState } from "@/types/baseball";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
  primeCommentaryCache,
} from "@/utils/commentary-audio";
import { enqueueVoicePlayback } from "@/utils/voice-playback";

export function primeBaseballClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchCommentaryEntries("baseball", getBaseballInningClipEntries());
  for (const callout of [
    { type: "strikeout" },
    { type: "home-run" },
    { type: "end-of-inning" },
    { type: "final-score" },
  ] as Array<Exclude<BaseballFixedCallout, { type: "inning" }>>) {
    prefetchLegacyClipPath(
      getBaseballFixedClipPath(callout),
      getBaseballCalloutPhrase(callout),
    );
  }
}

export async function announceBaseballCallout(callout: BaseballFixedCallout): Promise<void> {
  await announceLegacyClipPath(
    getBaseballCalloutClipPath(callout),
    getBaseballCalloutPhrase(callout),
  );
}

export function announceBaseballCallouts(callouts: BaseballFixedCallout[]): void {
  if (callouts.length === 0) {
    return;
  }

  void enqueueVoicePlayback(async () => {
    for (const callout of callouts) {
      await announceBaseballCallout(callout);
    }
  });
}

export function announceBaseballInning(
  inningNumber: number,
  targetLabel: string,
  targetSegment: number | "bull",
): void {
  void enqueueVoicePlayback(() =>
    announceBaseballCallout({
      type: "inning",
      inningNumber,
      targetLabel,
      targetSegment,
    }),
  );
}

export function resolveBaseballAnnouncementsAfterTurn(
  before: BaseballGameState,
  after: BaseballGameState,
  completedPlayerIndex: number,
): BaseballFixedCallout[] {
  const announcements: BaseballFixedCallout[] = [];
  const completedPlayer = after.players[completedPlayerIndex];

  if (completedPlayer?.lastVisitHomeRun) {
    announcements.push({ type: "home-run" });
  } else if (completedPlayer?.lastVisitRuns === 0) {
    announcements.push({ type: "strikeout" });
  }

  if (after.status === "finished") {
    announcements.push({ type: "end-of-inning" }, { type: "final-score" });
    return announcements;
  }

  const inningAdvanced =
    before.inningIndex !== after.inningIndex ||
    before.phase !== after.phase ||
    before.shootoutRound !== after.shootoutRound ||
    before.extraInningCount !== after.extraInningCount;

  if (inningAdvanced) {
    announcements.push({ type: "end-of-inning" });

    const target = getBaseballCurrentTarget(after);
    if (target) {
      announcements.push({
        type: "inning",
        inningNumber: target.inningNumber,
        targetLabel: target.displayLabel,
        targetSegment: target.segment,
      });
    }
  }

  return announcements;
}

export function announceBaseballAfterTurn(
  before: BaseballGameState,
  after: BaseballGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveBaseballAnnouncementsAfterTurn(before, after, completedPlayerIndex);
  if (callouts.length === 0) {
    return;
  }

  void announceBaseballCallouts(callouts);
}

export function warmBaseballCache(): void {
  primeCommentaryCache();
}
