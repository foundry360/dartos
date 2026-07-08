import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import { isValidPracticeCheckoutHit } from "@/features/practice/lib/practice-checkout-rules";
import type {
  Checkout121GameState,
  Checkout121HistoryEntry,
  Checkout121MatchSetup,
  Checkout121OutRule,
  Checkout121PlayerState,
} from "@/types/checkout-121";
import type { Checkout121Callout } from "@/lib/checkout-121-callouts";
import { CHECKOUT_121_CLASSIC_CHECKOUT_SCORE } from "@/lib/checkout-121-callouts";
import type { DartHit } from "@/types/dart";

function isValidCheckoutOut(hit: DartHit, outRule: Checkout121OutRule): boolean {
  return isValidPracticeCheckoutHit(hit, outRule);
}

function clonePlayer(player: Checkout121PlayerState): Checkout121PlayerState {
  return { ...player };
}

function resetAttemptForPlayer(
  state: Checkout121GameState,
  players: Checkout121PlayerState[],
  playerIndex: number,
): Checkout121GameState {
  const player = players[playerIndex];
  if (!player) {
    return state;
  }

  return {
    ...state,
    players,
    currentPlayerIndex: playerIndex,
    visitDarts: [],
    visitStartRemaining: player.remaining,
    dartsUsedInAttempt: 0,
  };
}

function advanceToNextPlayer(
  state: Checkout121GameState,
  players: Checkout121PlayerState[],
  fromIndex: number,
): Checkout121GameState {
  const nextIndex = (fromIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];
  if (!nextPlayer) {
    return state;
  }

  return resetAttemptForPlayer(
    {
      ...state,
      players,
    },
    players,
    nextIndex,
  );
}

function completeAttemptSuccess(
  state: Checkout121GameState,
  playerIndex: number,
): Checkout121GameState {
  const player = state.players[playerIndex];
  if (!player) {
    return state;
  }

  const checkedOutTarget = player.currentTarget;

  if (checkedOutTarget >= state.finishScore) {
    const updatedPlayers = state.players.map((entry, index) => {
      if (index !== playerIndex) {
        return entry;
      }

      return {
        ...clonePlayer(entry),
        checkoutsCompleted: entry.checkoutsCompleted + 1,
        remaining: 0,
      };
    });

    return {
      ...state,
      players: updatedPlayers,
      visitDarts: [],
      status: "finished",
      winnerId: player.id,
    };
  }

  const nextTarget = checkedOutTarget + 1;
  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      currentTarget: nextTarget,
      remaining: nextTarget,
      checkoutsCompleted: entry.checkoutsCompleted + 1,
    };
  });

  return advanceToNextPlayer(state, updatedPlayers, playerIndex);
}

function completeAttemptFailure(
  state: Checkout121GameState,
  playerIndex: number,
): Checkout121GameState {
  const player = state.players[playerIndex];
  if (!player) {
    return state;
  }

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      remaining: entry.currentTarget,
    };
  });

  return advanceToNextPlayer(state, updatedPlayers, playerIndex);
}

export function getCheckout121DartsRemainingInAttempt(state: Checkout121GameState): number {
  return Math.max(0, state.dartsPerAttempt - state.dartsUsedInAttempt - state.visitDarts.length);
}

export function createCheckout121Player(
  slot: Checkout121MatchSetup["players"][number],
  color: string,
  startScore: number,
): Checkout121PlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    currentTarget: startScore,
    remaining: startScore,
    checkoutsCompleted: 0,
  };
}

export function createCheckout121Game(setup: Checkout121MatchSetup): Checkout121GameState {
  const players = setup.players.map((slot, index) =>
    createCheckout121Player(
      slot,
      slot.color ?? "#84c126",
      setup.startScore,
    ),
  );

  const starterIndex = resolveLegStarterIndex(setup.startingPlayerRule, {
    playerCount: players.length,
    legNumber: 1,
    coinTossStarterIndex: setup.coinTossStarterIndex,
  });

  const starter = players[starterIndex] ?? players[0]!;

  return {
    startScore: setup.startScore,
    finishScore: setup.finishScore,
    dartsPerAttempt: setup.dartsPerAttempt,
    outRule: setup.outRule,
    startingPlayerRule: setup.startingPlayerRule,
    coinTossStarterIndex: setup.coinTossStarterIndex,
    players,
    currentPlayerIndex: starterIndex,
    visitDarts: [],
    visitStartRemaining: starter.remaining,
    dartsUsedInAttempt: 0,
    history: [],
    status: "playing",
  };
}

function buildHistoryRevert(state: Checkout121GameState): Omit<Checkout121GameState, "history"> {
  return {
    startScore: state.startScore,
    finishScore: state.finishScore,
    dartsPerAttempt: state.dartsPerAttempt,
    outRule: state.outRule,
    startingPlayerRule: state.startingPlayerRule,
    coinTossStarterIndex: state.coinTossStarterIndex,
    players: state.players.map(clonePlayer),
    currentPlayerIndex: state.currentPlayerIndex,
    visitDarts: [...state.visitDarts],
    visitStartRemaining: state.visitStartRemaining,
    dartsUsedInAttempt: state.dartsUsedInAttempt,
    status: state.status,
    winnerId: state.winnerId,
    matchId: state.matchId,
  };
}

export function applyCheckout121Dart(
  state: Checkout121GameState,
  hit: DartHit,
): Checkout121GameState {
  if (state.status !== "playing") {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  if (getCheckout121DartsRemainingInAttempt(state) <= 0) {
    return state;
  }

  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  if (!player) {
    return state;
  }

  const remainingBefore = player.remaining;
  const effectiveScore = hit.score;
  let remainingAfter = remainingBefore - effectiveScore;
  let bust = false;

  if (effectiveScore > 0) {
    if (remainingAfter < 0 || remainingAfter === 1) {
      bust = true;
      remainingAfter = state.visitStartRemaining;
    } else if (remainingAfter === 0 && !isValidCheckoutOut(hit, state.outRule)) {
      bust = true;
      remainingAfter = state.visitStartRemaining;
    }
  }

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...entry,
      remaining: bust ? state.visitStartRemaining : remainingAfter,
    };
  });

  const historyEntry: Checkout121HistoryEntry = {
    playerIndex,
    dart: hit,
    remainingBefore,
    remainingAfter: bust ? state.visitStartRemaining : remainingAfter,
    effectiveScore: bust ? 0 : effectiveScore,
    bust,
    revert: buildHistoryRevert(state),
  };

  const nextState: Checkout121GameState = {
    ...state,
    players: updatedPlayers,
    visitDarts: [...state.visitDarts, hit],
    history: [...state.history, historyEntry],
  };

  if (remainingAfter === 0 && !bust) {
    return completeAttemptSuccess(nextState, playerIndex);
  }

  return nextState;
}

export function finishCheckout121Visit(state: Checkout121GameState): Checkout121GameState {
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  if (!player) {
    return state;
  }

  const dartsUsedInAttempt = state.dartsUsedInAttempt + state.visitDarts.length;

  if (player.remaining === 0) {
    return completeAttemptSuccess(state, playerIndex);
  }

  if (dartsUsedInAttempt >= state.dartsPerAttempt) {
    return completeAttemptFailure(state, playerIndex);
  }

  return {
    ...state,
    dartsUsedInAttempt,
    visitDarts: [],
    visitStartRemaining: player.remaining,
  };
}

export function undoCheckout121Dart(state: Checkout121GameState): Checkout121GameState {
  if (state.history.length === 0) {
    return state;
  }

  const lastEntry = state.history.at(-1);
  if (!lastEntry) {
    return state;
  }

  return {
    ...lastEntry.revert,
    history: state.history.slice(0, -1),
  };
}

export function formatCheckout121Progress(state: Checkout121GameState): string {
  const player = state.players[state.currentPlayerIndex];
  if (!player) {
    return "121 Checkout";
  }

  return `Target ${player.currentTarget} · ${getCheckout121DartsRemainingInAttempt(state)} darts left`;
}

export function getCheckout121HighestClearedTarget(
  state: Checkout121GameState,
  playerIndex: number,
): number {
  const player = state.players[playerIndex];
  if (!player) {
    return state.startScore;
  }

  if (state.status === "finished" && state.winnerId === player.id) {
    return state.finishScore;
  }

  return Math.max(state.startScore, player.currentTarget - 1);
}

function didFailAttempt(
  before: Checkout121GameState,
  after: Checkout121GameState,
  completedPlayerIndex: number,
): boolean {
  if (before.currentPlayerIndex === after.currentPlayerIndex) {
    return false;
  }

  const beforePlayer = before.players[completedPlayerIndex];
  if (!beforePlayer || beforePlayer.remaining === 0) {
    return false;
  }

  const dartsUsed = before.dartsUsedInAttempt + before.visitDarts.length;
  return dartsUsed >= before.dartsPerAttempt;
}

export function getSuccessfulCheckoutTarget(
  before: Checkout121GameState,
  after: Checkout121GameState,
  playerIndex: number,
): number | null {
  const beforePlayer = before.players[playerIndex];
  const afterPlayer = after.players[playerIndex];
  if (!beforePlayer || !afterPlayer) {
    return null;
  }

  if (afterPlayer.checkoutsCompleted <= beforePlayer.checkoutsCompleted) {
    return null;
  }

  return beforePlayer.currentTarget;
}

export function resolveCheckout121MatchStartAnnouncements(
  state: Checkout121GameState,
): Checkout121Callout[] {
  return [
    { type: "game-title" },
    { type: "starting-target", score: state.startScore },
    {
      type: "target",
      score: state.players[state.currentPlayerIndex]?.currentTarget ?? state.startScore,
    },
  ];
}

export function resolveCheckout121AnnouncementsAfterDart(
  before: Checkout121GameState,
  after: Checkout121GameState,
  dartsRemainingBefore: number,
): Checkout121Callout[] {
  const announcements: Checkout121Callout[] = [];
  const playerIndex = before.currentPlayerIndex;

  if (dartsRemainingBefore === 1) {
    announcements.push({ type: "last-dart" });
  }

  const clearedTarget = getSuccessfulCheckoutTarget(before, after, playerIndex);
  if (clearedTarget == null) {
    return announcements;
  }

  announcements.push({ type: "checkout" });
  if (clearedTarget === CHECKOUT_121_CLASSIC_CHECKOUT_SCORE) {
    announcements.push({ type: "checkout-121" });
  }
  announcements.push({ type: "target-cleared" });

  if (after.status !== "finished") {
    const afterPlayer = after.players[playerIndex];
    if (afterPlayer) {
      announcements.push({ type: "next-target", score: afterPlayer.currentTarget });
    }
  }

  return announcements;
}

export function resolveCheckout121AnnouncementsAfterVisit(
  before: Checkout121GameState,
  after: Checkout121GameState,
  completedPlayerIndex: number,
): Checkout121Callout[] {
  const announcements: Checkout121Callout[] = [];
  const beforePlayer = before.players[completedPlayerIndex];
  const afterPlayer = after.players[completedPlayerIndex];

  if (!beforePlayer || !afterPlayer) {
    return announcements;
  }

  if (getSuccessfulCheckoutTarget(before, after, completedPlayerIndex) != null) {
    return announcements;
  }

  announcements.push({ type: "visit-complete" });

  if (after.status === "finished" && after.winnerId) {
    announcements.push({ type: "challenge-complete" });
    const winnerIndex = after.players.findIndex((player) => player.id === after.winnerId);
    if (winnerIndex >= 0) {
      announcements.push({
        type: "highest-checkout",
        score: getCheckout121HighestClearedTarget(after, winnerIndex),
      });
    }

    return announcements;
  }

  if (didFailAttempt(before, after, completedPlayerIndex)) {
    announcements.push({ type: "no-checkout" });
    announcements.push({ type: "target-remains", score: beforePlayer.currentTarget });
  } else if (afterPlayer.remaining > 0) {
    announcements.push({ type: "remaining", score: afterPlayer.remaining });
  }

  const dartsRemaining = getCheckout121DartsRemainingInAttempt(after);
  if (after.dartsPerAttempt > 3 && dartsRemaining === 3) {
    announcements.push({ type: "three-darts-remaining" });
  }

  if (after.currentPlayerIndex !== before.currentPlayerIndex) {
    const nextPlayer = after.players[after.currentPlayerIndex];
    if (nextPlayer) {
      announcements.push({ type: "target", score: nextPlayer.currentTarget });
    }
  }

  return announcements;
}

export function resolveCheckout121MilestoneAnnouncements(
  clearedTarget: number,
  sessionHigh: number,
  personalBest: number,
): Checkout121Callout[] {
  const announcements: Checkout121Callout[] = [];

  if (clearedTarget > sessionHigh) {
    announcements.push({ type: "new-high-score" });
  }

  if (clearedTarget > personalBest) {
    announcements.push({ type: "personal-best" });
  }

  return announcements;
}
