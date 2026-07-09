import {
  getCheckout121CalloutClipPath,
  getCheckout121CalloutPhrase,
  type Checkout121Callout,
} from "@/lib/checkout-121-callouts";
import {
  getCheckout121HighestClearedTarget,
  getSuccessfulCheckoutTarget,
  resolveCheckout121AnnouncementsAfterDart,
  resolveCheckout121AnnouncementsAfterVisit,
  resolveCheckout121MatchStartAnnouncements,
  resolveCheckout121MilestoneAnnouncements,
} from "@/features/classic-games/lib/checkout-121-engine";
import type { Checkout121GameState } from "@/types/checkout-121";
import { announceLegacyClipPath } from "@/utils/commentary-audio";
import { enqueueVoicePlayback } from "@/utils/voice-playback";

const sessionHighByMatchPlayer = new Map<string, number>();

function getSessionHighKey(matchId: string, playerId: string): string {
  return `${matchId}:${playerId}`;
}

function getPersonalBestStorageKey(playerId: string): string {
  return `dartos:checkout-121-pb:${playerId}`;
}

function getPersonalBest(playerId: string): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = localStorage.getItem(getPersonalBestStorageKey(playerId));
  return stored ? Number(stored) : 0;
}

function setPersonalBest(playerId: string, score: number): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getPersonalBestStorageKey(playerId), String(score));
}

function getSessionHigh(matchId: string, playerId: string, startScore: number): number {
  return sessionHighByMatchPlayer.get(getSessionHighKey(matchId, playerId)) ?? startScore - 1;
}

function setSessionHigh(matchId: string, playerId: string, score: number): void {
  sessionHighByMatchPlayer.set(getSessionHighKey(matchId, playerId), score);
}

export function primeCheckout121Clips(): void {
  // Clips load on demand through the Kokoro CDN pipeline.
}

export async function announceCheckout121Callout(callout: Checkout121Callout): Promise<void> {
  await announceLegacyClipPath(
    getCheckout121CalloutClipPath(callout),
    getCheckout121CalloutPhrase(callout),
  );
}

export function announceCheckout121Callouts(callouts: Checkout121Callout[]): void {
  if (callouts.length === 0) {
    return;
  }

  void enqueueVoicePlayback(async () => {
    for (const callout of callouts) {
      await announceCheckout121Callout(callout);
    }
  });
}

export function announceCheckout121MatchStart(state: Checkout121GameState): void {
  if (!state.matchId) {
    return;
  }

  for (const player of state.players) {
    setSessionHigh(state.matchId, player.id, state.startScore - 1);
  }

  void announceCheckout121Callouts(resolveCheckout121MatchStartAnnouncements(state));
}

function appendMilestoneAnnouncements(
  before: Checkout121GameState,
  after: Checkout121GameState,
  playerIndex: number,
  callouts: Checkout121Callout[],
): Checkout121Callout[] {
  const clearedTarget = getSuccessfulCheckoutTarget(before, after, playerIndex);
  const player = before.players[playerIndex];
  if (clearedTarget == null || !player || !before.matchId) {
    return callouts;
  }

  const sessionHigh = getSessionHigh(before.matchId, player.id, before.startScore);
  const personalBest = getPersonalBest(player.id);
  const milestones = resolveCheckout121MilestoneAnnouncements(
    clearedTarget,
    sessionHigh,
    personalBest,
  );

  setSessionHigh(before.matchId, player.id, Math.max(sessionHigh, clearedTarget));
  if (clearedTarget > personalBest) {
    setPersonalBest(player.id, clearedTarget);
  }

  return [...callouts, ...milestones];
}

export function announceCheckout121AfterDart(
  before: Checkout121GameState,
  after: Checkout121GameState,
  dartsRemainingBefore: number,
): void {
  let callouts = resolveCheckout121AnnouncementsAfterDart(
    before,
    after,
    dartsRemainingBefore,
  );
  callouts = appendMilestoneAnnouncements(before, after, before.currentPlayerIndex, callouts);

  if (after.status === "finished" && after.winnerId) {
    const winnerIndex = after.players.findIndex((player) => player.id === after.winnerId);
    if (winnerIndex >= 0) {
      callouts.push(
        { type: "challenge-complete" },
        {
          type: "highest-checkout",
          score: getCheckout121HighestClearedTarget(after, winnerIndex),
        },
      );
    }
  }

  if (callouts.length === 0) {
    return;
  }

  void announceCheckout121Callouts(callouts);
}

export function announceCheckout121AfterVisit(
  before: Checkout121GameState,
  after: Checkout121GameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveCheckout121AnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceCheckout121Callouts(callouts);
}
