import type { X01GameType } from "@/lib/constants";
import { DARTS_PER_VISIT, X01_GAME_TYPES } from "@/lib/constants";
import type { BotDifficultyId } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { X01GameState, X01HistoryEntry, X01PlayerState } from "@/types/x01";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import {
  getEffectiveDartScore,
  isPlayerScoredIn,
  isValidCheckoutHit,
} from "@/features/x01/lib/x01-rules";

export function createX01Player(
  id: string,
  name: string,
  color: string,
  startingScore: number,
  extras?: {
    nickname?: string | null;
    teamId?: number;
    profileId?: string;
    isGuest?: boolean;
    avatarUrl?: string;
    countryCode?: string | null;
    scoredIn?: boolean;
    playerKind?: "human" | "bot";
    botDifficultyId?: BotDifficultyId;
  },
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
    nickname: extras?.nickname ?? null,
    scoredIn: extras?.scoredIn,
    teamId: extras?.teamId,
    profileId: extras?.profileId,
    isGuest: extras?.isGuest,
    avatarUrl: extras?.avatarUrl,
    countryCode: extras?.countryCode ?? null,
    playerKind: extras?.playerKind ?? "human",
    botDifficultyId: extras?.botDifficultyId,
  };
}

function clonePlayer(player: X01PlayerState): X01PlayerState {
  return {
    ...player,
    visitScores: [...player.visitScores],
  };
}

/** Teammates share remaining / scored-in when team mode is on. */
function isSameTeamSide(
  state: Pick<X01GameState, "teamsEnabled">,
  a: Pick<X01PlayerState, "teamId">,
  b: Pick<X01PlayerState, "teamId">,
): boolean {
  return (
    state.teamsEnabled &&
    a.teamId != null &&
    b.teamId != null &&
    a.teamId === b.teamId
  );
}

export function getX01SideLegsWon(
  players: Array<Pick<X01PlayerState, "legsWon" | "teamId">>,
  sideTeamId: number,
  teamsEnabled: boolean,
): number {
  if (!teamsEnabled) {
    return players[sideTeamId]?.legsWon ?? 0;
  }

  let maxLegs = 0;
  for (const player of players) {
    if (player.teamId === sideTeamId) {
      maxLegs = Math.max(maxLegs, player.legsWon);
    }
  }
  return maxLegs;
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
  const scoredInBefore = isPlayerScoredIn(state.inRule, player.scoredIn);
  const { effectiveScore, scoredInAfter } = getEffectiveDartScore(
    hit,
    state.inRule,
    player.scoredIn,
  );
  let remainingAfter = remainingBefore - effectiveScore;
  let bust = false;

  if (effectiveScore > 0) {
    // Double Out: leaving 1 is a bust (no legal double finish). Straight Out allows 1.
    const leftIllegalOne = remainingAfter === 1 && state.outRule !== "straight_out";
    if (remainingAfter < 0 || leftIllegalOne) {
      bust = true;
      remainingAfter = state.visitStartRemaining;
    } else if (remainingAfter === 0 && !isValidCheckoutHit(hit, state.outRule)) {
      bust = true;
      remainingAfter = state.visitStartRemaining;
    }
  }

  const nextRemaining = bust ? state.visitStartRemaining : remainingAfter;
  const nextScoredIn = bust ? state.visitStartScoredIn : scoredInAfter;

  const updatedPlayers = state.players.map((entry, index) => {
    const isThrower = index === state.currentPlayerIndex;
    if (!isThrower && !isSameTeamSide(state, player, entry)) {
      return entry;
    }

    return {
      ...entry,
      remaining: nextRemaining,
      scoredIn: nextScoredIn,
    };
  });

  const historyEntry: X01HistoryEntry = {
    playerIndex: state.currentPlayerIndex,
    dart: hit,
    remainingBefore,
    remainingAfter: nextRemaining,
    effectiveScore: bust ? 0 : effectiveScore,
    scoredInBefore,
    scoredInAfter: bust ? scoredInBefore : scoredInAfter,
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

  const visitTotal = state.history
    .slice(-state.visitDarts.length)
    .reduce((sum, entry) => sum + entry.effectiveScore, 0);
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
    visitStartScoredIn: isPlayerScoredIn(state.inRule, nextPlayer?.scoredIn),
  };
}

function getLegStarterIndex(state: X01GameState, lastLegWinnerIndex?: number) {
  return resolveLegStarterIndex(state.startingPlayerRule, {
    playerCount: state.players.length,
    legNumber: state.legsPlayed + 1,
    lastLegWinnerIndex,
    coinTossStarterIndex: state.coinTossStarterIndex,
  });
}

function handleLegWin(state: X01GameState): X01GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  if (!player) {
    return state;
  }

  const updatedPlayers = state.players.map((entry, index) => {
    const isCheckoutPlayer = index === playerIndex;
    const isWinningSide =
      isCheckoutPlayer || isSameTeamSide(state, player, entry);
    if (!isWinningSide) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      legsWon: entry.legsWon + 1,
      checkoutSuccesses: isCheckoutPlayer
        ? entry.checkoutSuccesses + 1
        : entry.checkoutSuccesses,
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

  const legsPlayed = state.legsPlayed + 1;
  const resetPlayers = updatedPlayers.map((entry) => ({
    ...entry,
    remaining: state.gameType,
    scoredIn: state.inRule === "straight_in",
  }));
  const nextStarterIndex = getLegStarterIndex(
    { ...state, legsPlayed },
    playerIndex,
  );
  const nextPlayer = resetPlayers[nextStarterIndex];

  return {
    ...state,
    players: resetPlayers,
    legsPlayed,
    currentPlayerIndex: nextStarterIndex,
    visitDarts: [],
    visitStartRemaining: nextPlayer?.remaining ?? state.gameType,
    visitStartScoredIn: isPlayerScoredIn(state.inRule, nextPlayer?.scoredIn),
  };
}

function collectTrailingVisitEntries(
  history: X01HistoryEntry[],
  playerIndex: number,
): X01HistoryEntry[] {
  const entries: X01HistoryEntry[] = [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (!entry || entry.playerIndex !== playerIndex) {
      break;
    }
    entries.unshift(entry);
    if (entries.length >= DARTS_PER_VISIT) {
      break;
    }
  }
  return entries;
}

/**
 * Undo the last scored dart. Works mid-visit and after Confirm Turn
 * (rebuilds the previous player's visit so a wrong dart can still be fixed).
 */
export function undoX01Dart(state: X01GameState): X01GameState {
  const lastEntry = state.history[state.history.length - 1];
  if (!lastEntry) {
    return state;
  }

  const crossingTurnBoundary = state.visitDarts.length === 0;
  const visitBeforeUndo = collectTrailingVisitEntries(
    state.history,
    lastEntry.playerIndex,
  );
  const nextHistory = state.history.slice(0, -1);
  const nextVisitDarts = crossingTurnBoundary
    ? collectTrailingVisitEntries(nextHistory, lastEntry.playerIndex).map(
        (entry) => entry.dart,
      )
    : state.visitDarts.slice(0, -1);

  const thrower = state.players[lastEntry.playerIndex];
  const updatedPlayers = state.players.map((player, index) => {
    const isThrower = index === lastEntry.playerIndex;
    if (
      !isThrower &&
      !(thrower && isSameTeamSide(state, thrower, player))
    ) {
      return player;
    }

    const nextPlayer = {
      ...player,
      remaining: lastEntry.remainingBefore,
      scoredIn: lastEntry.scoredInBefore,
    };

    // finishX01Turn appends one visit score for non-bust visits — reverse it
    // when stepping back across Confirm Turn.
    if (
      crossingTurnBoundary &&
      isThrower &&
      !visitBeforeUndo.some((entry) => entry.bust) &&
      nextPlayer.visitScores.length > 0
    ) {
      nextPlayer.visitScores = nextPlayer.visitScores.slice(0, -1);
    }

    return nextPlayer;
  });

  const visitStartEntry = visitBeforeUndo[0] ?? lastEntry;

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: lastEntry.playerIndex,
    visitDarts: nextVisitDarts,
    history: nextHistory,
    status: "playing",
    winnerId: undefined,
    visitStartRemaining:
      nextVisitDarts.length === 0
        ? lastEntry.remainingBefore
        : visitStartEntry.remainingBefore,
    visitStartScoredIn:
      nextVisitDarts.length === 0
        ? lastEntry.scoredInBefore
        : visitStartEntry.scoredInBefore,
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

export {
  X01_CHECKOUT_DISPLAY_MAX,
  formatCheckoutPath,
  getCheckoutSuggestions,
  hasCheckoutPath,
} from "@/features/x01/lib/x01-checkout";

export function parseX01GameType(value: string): X01GameType | null {
  const parsed = Number(value);

  if (X01_GAME_TYPES.includes(parsed as X01GameType)) {
    return parsed as X01GameType;
  }

  return null;
}

export function isX01GameType(value: string): boolean {
  return parseX01GameType(value) !== null;
}
