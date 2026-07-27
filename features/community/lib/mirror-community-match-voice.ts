import { getCricketVisitPointsScored } from "@/features/cricket/lib/cricket-engine";
import { resolveCheckoutCalloutForPlayer } from "@/lib/checkout-callouts";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import { getPlayerScorecardName } from "@/lib/player-display";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";
import { announceCricketTargetClosed } from "@/utils/cricket-closed-audio";
import { playMatchWinCelebration } from "@/utils/match-celebration-sounds";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import {
  announceCheckoutCalloutAsync,
  announceGameShotThenPlayerTurn,
  announceVisitEndAndHandOff,
  announceVisitTotalThenPlayerTurn,
} from "@/utils/speech";
import { unlockVoicePlayback } from "@/utils/voice-playback";

function shouldSkipRemoteVoiceMirror(
  prev: { matchId: string; status: string; history: unknown[] },
  next: { matchId: string; status: string; history: unknown[] },
): boolean {
  if (!getMatchAudioPreferences().voice) {
    return true;
  }
  if (prev.matchId !== next.matchId) {
    return true;
  }
  // Rematch / undo — do not replay callouts.
  if (prev.status === "finished" && next.status === "playing") {
    return true;
  }
  if (next.history.length < prev.history.length) {
    return true;
  }
  return false;
}

function currentPlayerName(game: X01GameState | CricketGameState): string | null {
  if (game.status !== "playing") {
    return null;
  }
  const player = game.players[game.currentPlayerIndex];
  return player ? getPlayerScorecardName(player) : null;
}

/**
 * Replay thrower commentary on the spectator device from a remote snapshot diff.
 * Call only for non-initial sync applies (not first hydrate / seed).
 */
export function mirrorCommunityX01Voice(
  prev: X01GameState,
  next: X01GameState,
): void {
  if (shouldSkipRemoteVoiceMirror(prev, next)) {
    return;
  }

  void unlockVoicePlayback();

  const gameShot = resolveGameShotOutcome(prev, next);
  if (gameShot) {
    const checkoutCallout =
      next.status === "playing"
        ? resolveCheckoutCalloutForPlayer(
            next,
            next.currentPlayerIndex,
            DARTS_PER_VISIT,
          )
        : null;
    announceGameShotThenPlayerTurn(
      gameShot,
      currentPlayerName(next),
      gameShot === "match" ? playMatchWinCelebration : undefined,
      checkoutCallout,
    );
    return;
  }

  const handedOff =
    prev.currentPlayerIndex !== next.currentPlayerIndex ||
    (prev.visitDarts.length > 0 &&
      next.visitDarts.length === 0 &&
      next.status === "playing");

  if (handedOff && prev.visitDarts.length > 0) {
    const visitTotal = getX01VisitEffectiveScore(prev, prev.visitDarts.length);
    const busted = prev.history
      .slice(-prev.visitDarts.length)
      .some((entry) => entry.bust);

    void announceVisitEndAndHandOff({
      visitTotal,
      busted,
      nextPlayerName: currentPlayerName(next),
      getCheckoutCallout: () => {
        if (next.status !== "playing") {
          return null;
        }
        return resolveCheckoutCalloutForPlayer(
          next,
          next.currentPlayerIndex,
          DARTS_PER_VISIT,
        );
      },
    });
    return;
  }

  if (
    next.status === "playing" &&
    next.visitDarts.length > prev.visitDarts.length
  ) {
    const dartsAvailable = DARTS_PER_VISIT - next.visitDarts.length;
    const checkoutCallout = resolveCheckoutCalloutForPlayer(
      next,
      next.currentPlayerIndex,
      dartsAvailable,
    );
    if (checkoutCallout) {
      announceCheckoutCalloutAsync(checkoutCallout);
    }
  }
}

export function mirrorCommunityCricketVoice(
  prev: CricketGameState,
  next: CricketGameState,
): void {
  if (shouldSkipRemoteVoiceMirror(prev, next)) {
    return;
  }

  void unlockVoicePlayback();

  const gameShot = resolveGameShotOutcome(prev, next);
  if (gameShot) {
    announceGameShotThenPlayerTurn(
      gameShot,
      currentPlayerName(next),
      gameShot === "match" ? playMatchWinCelebration : undefined,
    );
    return;
  }

  const handedOff =
    prev.currentPlayerIndex !== next.currentPlayerIndex ||
    (prev.visitDarts.length > 0 &&
      next.visitDarts.length === 0 &&
      next.status === "playing");

  if (handedOff && prev.visitDarts.length > 0) {
    announceVisitTotalThenPlayerTurn(
      getCricketVisitPointsScored(prev),
      false,
      currentPlayerName(next),
    );
    return;
  }

  if (next.history.length > prev.history.length) {
    const lastEntry = next.history.at(-1);
    if (lastEntry?.segmentClosed) {
      announceCricketTargetClosed(
        lastEntry.segmentClosed,
        next.variant ?? "classic",
      );
    }
  }
}
