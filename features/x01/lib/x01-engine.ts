import type { X01GameType } from "@/lib/constants";
import { DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { X01GameState, X01HistoryEntry, X01PlayerState } from "@/types/x01";

export function createX01Player(
  id: string,
  name: string,
  color: string,
  startingScore: number,
): X01PlayerState {
  return {
    id,
    name,
    color,
    remaining: startingScore,
    legsWon: 0,
    setsWon: 0,
    visitScores: [],
    checkoutAttempts: 0,
    checkoutSuccesses: 0,
  };
}

function isValidCheckoutHit(hit: DartHit): boolean {
  if (hit.segment === "miss") {
    return false;
  }

  if (hit.segment === "bull") {
    return hit.multiplier === "double";
  }

  return hit.multiplier === "double";
}

function clonePlayer(player: X01PlayerState): X01PlayerState {
  return {
    ...player,
    visitScores: [...player.visitScores],
  };
}

export function applyX01Dart(state: X01GameState, hit: DartHit): X01GameState {
  if (state.status !== "playing") {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const player = state.players[state.currentPlayerIndex];
  if (!player) {
    return state;
  }

  const remainingBefore = player.remaining;
  let remainingAfter = remainingBefore - hit.score;
  let bust = false;

  if (remainingAfter < 0 || remainingAfter === 1) {
    bust = true;
    remainingAfter = state.visitStartRemaining;
  } else if (remainingAfter === 0 && !isValidCheckoutHit(hit)) {
    bust = true;
    remainingAfter = state.visitStartRemaining;
  }

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== state.currentPlayerIndex) {
      return entry;
    }

    return {
      ...entry,
      remaining: remainingAfter,
    };
  });

  const historyEntry: X01HistoryEntry = {
    playerIndex: state.currentPlayerIndex,
    dart: hit,
    remainingBefore,
    remainingAfter,
    bust,
  };

  let nextState: X01GameState = {
    ...state,
    players: updatedPlayers,
    visitDarts: [...state.visitDarts, hit],
    history: [...state.history, historyEntry],
  };

  if (remainingAfter === 0 && !bust) {
    nextState = handleLegWin(nextState);
  }

  if (nextState.visitDarts.length >= DARTS_PER_VISIT && nextState.status === "playing") {
    nextState = finishX01Turn(nextState);
  }

  return nextState;
}

export function finishX01Turn(state: X01GameState): X01GameState {
  if (state.status !== "playing") {
    return state;
  }

  const player = state.players[state.currentPlayerIndex];
  if (!player) {
    return state;
  }

  const visitTotal = state.visitDarts.reduce((sum, dart) => sum + dart.score, 0);
  const busted = state.history
    .slice(-state.visitDarts.length)
    .some((entry) => entry.bust);

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== state.currentPlayerIndex) {
      return entry;
    }

    const next = clonePlayer(entry);
    if (!busted) {
      next.visitScores = [...next.visitScores, visitTotal];
    }
    return next;
  });

  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const nextPlayer = updatedPlayers[nextIndex];

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextIndex,
    visitDarts: [],
    visitStartRemaining: nextPlayer?.remaining ?? 0,
  };
}

function handleLegWin(state: X01GameState): X01GameState {
  const playerIndex = state.currentPlayerIndex;
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
      legsWon: entry.legsWon + 1,
      checkoutSuccesses: entry.checkoutSuccesses + 1,
      remaining: state.gameType,
    };
  });

  const winner = updatedPlayers[playerIndex];
  const legsToWin = state.legsToWin;

  if (winner && winner.legsWon >= legsToWin) {
    return {
      ...state,
      players: updatedPlayers,
      status: "finished",
      winnerId: winner.id,
      visitDarts: [],
    };
  }

  const resetPlayers = updatedPlayers.map((entry) => ({
    ...entry,
    remaining: state.gameType,
  }));

  return {
    ...state,
    players: resetPlayers,
    visitDarts: [],
    visitStartRemaining: resetPlayers[playerIndex]?.remaining ?? state.gameType,
  };
}

export function undoX01Dart(state: X01GameState): X01GameState {
  const lastEntry = state.history[state.history.length - 1];
  if (!lastEntry) {
    return state;
  }

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== lastEntry.playerIndex) {
      return player;
    }

    return {
      ...player,
      remaining: lastEntry.remainingBefore,
    };
  });

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: lastEntry.playerIndex,
    visitDarts: state.visitDarts.slice(0, -1),
    history: state.history.slice(0, -1),
    status: "playing",
    winnerId: undefined,
    visitStartRemaining:
      state.visitDarts.length <= 1
        ? lastEntry.remainingBefore
        : state.visitStartRemaining,
  };
}

export function calculateThreeDartAverage(player: X01PlayerState): number {
  if (player.visitScores.length === 0) {
    return 0;
  }

  const total = player.visitScores.reduce((sum, score) => sum + score, 0);
  return Math.round((total / player.visitScores.length) * 100) / 100;
}

export function getLastVisitScore(visitDarts: DartHit[]): number {
  return visitDarts.reduce((sum, dart) => sum + dart.score, 0);
}

export function getCheckoutSuggestions(remaining: number): string[][] {
  const suggestions: Record<number, string[][]> = {
    40: [["D20"]],
    36: [["D18"]],
    32: [["D16"]],
    50: [["Bull"]],
    41: [["S9", "D16"]],
    85: [["T15", "D20"]],
    100: [["T20", "D20"]],
    121: [["T20", "T11", "D14"]],
    170: [["T20", "T20", "Bull"]],
  };

  return suggestions[remaining] ?? [];
}

export function parseX01GameType(value: string): X01GameType | null {
  if (value === "301") {
    return 301;
  }

  if (value === "501") {
    return 501;
  }

  if (value === "701") {
    return 701;
  }

  return null;
}

export function isX01GameType(value: string): boolean {
  return parseX01GameType(value) !== null;
}
