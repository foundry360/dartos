import {
  getGolfCalloutClipPath,
  getGolfCalloutPhrase,
  getGolfFixedClipPath,
  getGolfHoleClipEntries,
  type GolfFixedCallout,
} from "@/lib/golf-callouts";
import { getGolfCurrentHole } from "@/features/classic-games/lib/golf-engine";
import type { GolfGameState } from "@/types/golf";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
  primeCommentaryCache,
} from "@/utils/commentary-audio";

export function primeGolfClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchCommentaryEntries("golf", getGolfHoleClipEntries());
  for (const callout of [
    { type: "birdie" },
    { type: "eagle" },
    { type: "hole-complete" },
    { type: "final-score" },
  ] as Array<Exclude<GolfFixedCallout, { type: "hole" }>>) {
    const clipPath = getGolfFixedClipPath(callout);
    prefetchLegacyClipPath(clipPath, getGolfCalloutPhrase(callout));
  }
}

export async function announceGolfCallout(callout: GolfFixedCallout): Promise<void> {
  await announceLegacyClipPath(getGolfCalloutClipPath(callout), getGolfCalloutPhrase(callout));
}

export async function announceGolfCallouts(callouts: GolfFixedCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceGolfCallout(callout);
  }
}

export function announceGolfHole(
  holeNumber: number,
  targetLabel: string,
  targetSegment: number | "bull",
): void {
  void announceGolfCallout({
    type: "hole",
    holeNumber,
    targetLabel,
    targetSegment,
  });
}

export function resolveGolfAnnouncementsAfterTurn(
  before: GolfGameState,
  after: GolfGameState,
  completedPlayerIndex: number,
): GolfFixedCallout[] {
  const announcements: GolfFixedCallout[] = [];
  const completedPlayer = after.players[completedPlayerIndex];

  if (completedPlayer?.lastHoleResultLabel === "Birdie") {
    announcements.push({ type: "birdie" });
  } else if (completedPlayer?.lastHoleResultLabel === "Eagle") {
    announcements.push({ type: "eagle" });
  }

  if (after.status === "finished") {
    announcements.push({ type: "hole-complete" }, { type: "final-score" });
    return announcements;
  }

  const holeAdvanced =
    before.holeIndex !== after.holeIndex ||
    before.phase !== after.phase ||
    before.tiebreakRound !== after.tiebreakRound ||
    before.suddenDeathRound !== after.suddenDeathRound;

  if (holeAdvanced) {
    announcements.push({ type: "hole-complete" });

    const hole = getGolfCurrentHole(after);
    if (hole) {
      announcements.push({
        type: "hole",
        holeNumber: hole.holeNumber,
        targetLabel: hole.displayLabel,
        targetSegment: hole.segment,
      });
    }
  }

  return announcements;
}

export function announceGolfAfterTurn(
  before: GolfGameState,
  after: GolfGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveGolfAnnouncementsAfterTurn(before, after, completedPlayerIndex);
  if (callouts.length === 0) {
    return;
  }

  void announceGolfCallouts(callouts);
}

export function warmGolfCache(): void {
  primeCommentaryCache();
}
