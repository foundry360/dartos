import {
  buildDoubleHitClipPath,
  buildDoubleHitPhrase,
  buildPlayerEliminatedClipPath,
  buildPlayerEliminatedPhrase,
  buildPlayerNumbersAssignedClipPath,
  buildPlayerNumbersAssignedPhrase,
  getKillerCalloutClipPath,
  getKillerCalloutPhrase,
  getKillerIsKillerClipEntries,
  getKillerPlayerTargetClipEntries,
  getKillerPlayerWinsClipEntries,
  type KillerCallout,
} from "@/lib/killer-callouts";
import { resolveKillerAnnouncementsAfterVisit } from "@/features/classic-games/lib/killer-engine";
import type { KillerGameState } from "@/types/killer";
import type { DartHit } from "@/types/dart";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
  primeCommentaryCache,
} from "@/utils/commentary-audio";
import { enqueueVoicePlayback } from "@/utils/voice-playback";

export function primeKillerClips(): void {
  prefetchCommentaryEntries("killer", getKillerPlayerTargetClipEntries());
  prefetchCommentaryEntries("killer", getKillerIsKillerClipEntries());
  prefetchCommentaryEntries("killer", getKillerPlayerWinsClipEntries());
  prefetchLegacyClipPath(
    buildPlayerNumbersAssignedClipPath(),
    buildPlayerNumbersAssignedPhrase(),
  );
  prefetchLegacyClipPath(buildDoubleHitClipPath(), buildDoubleHitPhrase());
  prefetchLegacyClipPath(buildPlayerEliminatedClipPath(), buildPlayerEliminatedPhrase());
}

export async function announceKillerCallout(callout: KillerCallout): Promise<void> {
  await announceLegacyClipPath(getKillerCalloutClipPath(callout), getKillerCalloutPhrase(callout));
}

export function announceKillerCallouts(callouts: KillerCallout[]): void {
  if (callouts.length === 0) {
    return;
  }

  void enqueueVoicePlayback(async () => {
    for (const callout of callouts) {
      await announceKillerCallout(callout);
    }
  });
}

export function resolveKillerPreAssignedTargetAnnouncements(
  game: KillerGameState,
): KillerCallout[] {
  if (game.numberAssignment === "first_dart" || game.phase !== "playing") {
    return [];
  }

  const announcements: KillerCallout[] = [];

  for (let index = 0; index < game.players.length; index += 1) {
    const target = game.players[index]?.assignedNumber;
    if (target != null) {
      announcements.push({
        type: "player-target",
        playerNumber: index + 1,
        target,
      });
    }
  }

  if (announcements.length > 0) {
    announcements.push({ type: "player-numbers-assigned" });
  }

  return announcements;
}

export function announceKillerAfterTurn(
  before: KillerGameState,
  after: KillerGameState,
  completedPlayerIndex: number,
  visitDarts: DartHit[],
): void {
  const callouts = resolveKillerAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
    visitDarts,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceKillerCallouts(callouts);
}

export function warmKillerCache(): void {
  primeCommentaryCache();
}
