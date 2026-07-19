import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import {
  buildBullTiebreakHole,
  buildSuddenDeathHole,
  formatGolfHoleResultLabel,
  GOLF_MISSED_HOLE_PENALTY,
} from "@/features/classic-games/lib/golf-config";
import type {
  GolfGameState,
  GolfHistoryEntry,
  GolfHoleTarget,
  GolfMatchSetup,
  GolfPlayerState,
  GolfScoringMode,
} from "@/types/golf";
import type { DartHit } from "@/types/dart";

function clonePlayer(player: GolfPlayerState): GolfPlayerState {
  return { ...player };
}

export function doesHitMatchGolfTarget(hit: DartHit, target: GolfHoleTarget): boolean {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return false;
  }

  if (target.segment === "bull") {
    return hit.segment === "bull";
  }

  return hit.segment === target.segment;
}

function calculateStrokesHoleScore(visitDarts: DartHit[], target: GolfHoleTarget): number {
  for (let index = 0; index < visitDarts.length; index += 1) {
    if (doesHitMatchGolfTarget(visitDarts[index]!, target)) {
      return index + 1;
    }
  }

  return GOLF_MISSED_HOLE_PENALTY;
}

function calculateGolfScoringHoleScore(visitDarts: DartHit[], target: GolfHoleTarget): number {
  const matchingDarts = visitDarts.filter((dart) => doesHitMatchGolfTarget(dart, target));

  if (matchingDarts.length === 0) {
    return 1;
  }

  if (matchingDarts.some((dart) => dart.multiplier === "triple")) {
    return -2;
  }

  if (matchingDarts.some((dart) => dart.multiplier === "double")) {
    return -1;
  }

  return 0;
}

export function calculateGolfHoleScore(
  visitDarts: DartHit[],
  target: GolfHoleTarget,
  scoringMode: GolfScoringMode,
): number {
  if (scoringMode === "strokes") {
    return calculateStrokesHoleScore(visitDarts, target);
  }

  return calculateGolfScoringHoleScore(visitDarts, target);
}

function bestBullVisitScore(visitDarts: DartHit[]): number {
  return visitDarts
    .filter((dart) => dart.segment === "bull")
    .reduce((best, dart) => Math.max(best, dart.score), 0);
}

function getLowestStrokeTotal(players: GolfPlayerState[]): number {
  return Math.min(...players.map((player) => player.strokes));
}

function getTiedLeaderIds(players: GolfPlayerState[]): string[] {
  const lowest = getLowestStrokeTotal(players);
  return players.filter((player) => player.strokes === lowest).map((player) => player.id);
}

function isTie(players: GolfPlayerState[]): boolean {
  return getTiedLeaderIds(players).length > 1;
}

function resolveMatchWinner(players: GolfPlayerState[]): string {
  let bestIndex = 0;

  for (let index = 1; index < players.length; index += 1) {
    if (players[index]!.strokes < players[bestIndex]!.strokes) {
      bestIndex = index;
    }
  }

  return players[bestIndex]!.id;
}

function finishGame(
  state: GolfGameState,
  players: GolfPlayerState[],
  winnerId?: string,
): GolfGameState {
  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId: winnerId ?? resolveMatchWinner(players),
  };
}

function resetVisitForPlayer(
  state: GolfGameState,
  players: GolfPlayerState[],
  playerIndex: number,
): GolfGameState {
  return {
    ...state,
    players,
    currentPlayerIndex: playerIndex,
    visitDarts: [],
  };
}

function startSuddenDeathHole(
  state: GolfGameState,
  players: GolfPlayerState[],
  starterIndex: number,
): GolfGameState {
  const suddenDeathRound = state.suddenDeathRound + 1;
  const hole = buildSuddenDeathHole(
    suddenDeathRound,
    state.targetSequenceId,
    state.regulationHoleCount,
  );

  return resetVisitForPlayer(
    {
      ...state,
      phase: "sudden_death",
      suddenDeathRound,
      holes: [hole],
      holeIndex: 0,
      roundStarterIndex: starterIndex,
    },
    players,
    starterIndex,
  );
}

function startBullTiebreak(
  state: GolfGameState,
  players: GolfPlayerState[],
  starterIndex: number,
): GolfGameState {
  const tiebreakRound = state.tiebreakRound + 1;

  return resetVisitForPlayer(
    {
      ...state,
      phase: "bull_tiebreak",
      tiebreakRound,
      holes: [buildBullTiebreakHole(tiebreakRound)],
      holeIndex: 0,
      roundStarterIndex: starterIndex,
    },
    players,
    starterIndex,
  );
}

function resolveSuddenDeath(
  state: GolfGameState,
  players: GolfPlayerState[],
  nextStarterIndex: number,
): GolfGameState {
  const lowestHoleScore = Math.min(...players.map((player) => player.lastHoleStrokes ?? Infinity));
  const winners = players.filter((player) => player.lastHoleStrokes === lowestHoleScore);

  if (winners.length === 1) {
    return finishGame(state, players, winners[0]!.id);
  }

  return startSuddenDeathHole(state, players, nextStarterIndex);
}

function resolveBullTiebreak(
  state: GolfGameState,
  players: GolfPlayerState[],
  nextStarterIndex: number,
): GolfGameState {
  const bestScore = Math.max(...players.map((player) => player.lastHoleStrokes ?? 0));
  const winners = players.filter((player) => player.lastHoleStrokes === bestScore);

  if (winners.length === 1) {
    return finishGame(state, players, winners[0]!.id);
  }

  return startBullTiebreak(state, players, nextStarterIndex);
}

function resolveAfterRegulation(
  state: GolfGameState,
  players: GolfPlayerState[],
  nextStarterIndex: number,
): GolfGameState {
  if (!isTie(players)) {
    return finishGame(state, players);
  }

  if (state.tieBreaker === "sudden_death") {
    return startSuddenDeathHole(state, players, nextStarterIndex);
  }

  return startBullTiebreak(state, players, nextStarterIndex);
}

function advanceAfterVisit(
  state: GolfGameState,
  players: GolfPlayerState[],
  fromIndex: number,
): GolfGameState {
  const nextIndex = (fromIndex + 1) % players.length;

  if (nextIndex !== state.roundStarterIndex) {
    return resetVisitForPlayer(state, players, nextIndex);
  }

  if (state.phase === "sudden_death") {
    return resolveSuddenDeath(state, players, nextIndex);
  }

  if (state.phase === "bull_tiebreak") {
    return resolveBullTiebreak(state, players, nextIndex);
  }

  const nextHoleIndex = state.holeIndex + 1;
  if (nextHoleIndex >= state.holes.length) {
    return resolveAfterRegulation(state, players, nextIndex);
  }

  return resetVisitForPlayer(
    {
      ...state,
      players,
      holeIndex: nextHoleIndex,
      roundStarterIndex: nextIndex,
    },
    players,
    nextIndex,
  );
}

function applyVisitResult(state: GolfGameState, playerIndex: number): GolfGameState {
  const player = state.players[playerIndex];
  const hole = state.holes[state.holeIndex];
  if (!player || !hole) {
    return state;
  }

  let holeStrokes: number;
  let resultLabel: string;

  if (state.phase === "bull_tiebreak") {
    holeStrokes = bestBullVisitScore(state.visitDarts);
    resultLabel = holeStrokes > 0 ? `${holeStrokes} pts` : "Miss";
  } else {
    holeStrokes = calculateGolfHoleScore(state.visitDarts, hole, state.scoringMode);
    resultLabel = formatGolfHoleResultLabel(holeStrokes, state.scoringMode);
  }

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    const addToTotal = state.phase === "holes";
    return {
      ...clonePlayer(entry),
      strokes: addToTotal ? entry.strokes + holeStrokes : entry.strokes,
      lastHoleStrokes: holeStrokes,
      lastHoleResultLabel: resultLabel,
    };
  });

  return advanceAfterVisit(state, updatedPlayers, playerIndex);
}

export function createGolfPlayer(
  slot: GolfMatchSetup["players"][number],
  color: string,
  startingStrokes: number,
): GolfPlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    strokes: startingStrokes,
    lastHoleStrokes: null,
    lastHoleResultLabel: null,
  };
}

export function createGolfGame(setup: GolfMatchSetup): GolfGameState {
  const players = setup.players.map((slot, index) =>
    createGolfPlayer(
      slot,
      slot.color ?? "#6f9e24",
      setup.startingStrokes,
    ),
  );

  const starterIndex = resolveLegStarterIndex(setup.startingPlayerRule, {
    playerCount: players.length,
    legNumber: 1,
    coinTossStarterIndex: setup.coinTossStarterIndex,
  });

  return {
    startingStrokes: setup.startingStrokes,
    holeCount: setup.holeCount,
    gameLengthPreset: setup.gameLengthPreset,
    targetSequenceId: setup.targetSequenceId,
    scoringMode: setup.scoringMode,
    tieBreaker: setup.tieBreaker,
    holes: setup.holes,
    startingPlayerRule: setup.startingPlayerRule,
    coinTossStarterIndex: setup.coinTossStarterIndex,
    phase: "holes",
    regulationHoleCount: setup.holeCount,
    suddenDeathRound: 0,
    tiebreakRound: 0,
    players,
    holeIndex: 0,
    roundStarterIndex: starterIndex,
    currentPlayerIndex: starterIndex,
    visitDarts: [],
    history: [],
    status: "playing",
  };
}

function buildHistoryRevert(state: GolfGameState): Omit<GolfGameState, "history"> {
  return {
    startingStrokes: state.startingStrokes,
    holeCount: state.holeCount,
    gameLengthPreset: state.gameLengthPreset,
    targetSequenceId: state.targetSequenceId,
    scoringMode: state.scoringMode,
    tieBreaker: state.tieBreaker,
    holes: state.holes,
    startingPlayerRule: state.startingPlayerRule,
    coinTossStarterIndex: state.coinTossStarterIndex,
    phase: state.phase,
    regulationHoleCount: state.regulationHoleCount,
    suddenDeathRound: state.suddenDeathRound,
    tiebreakRound: state.tiebreakRound,
    players: state.players.map(clonePlayer),
    holeIndex: state.holeIndex,
    roundStarterIndex: state.roundStarterIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    visitDarts: [...state.visitDarts],
    status: state.status,
    winnerId: state.winnerId,
    matchId: state.matchId,
  };
}

export function applyGolfDart(state: GolfGameState, hit: DartHit): GolfGameState {
  if (state.status !== "playing") {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const historyEntry: GolfHistoryEntry = {
    playerIndex: state.currentPlayerIndex,
    dart: hit,
    revert: buildHistoryRevert(state),
  };

  return {
    ...state,
    visitDarts: [...state.visitDarts, hit],
    history: [...state.history, historyEntry],
  };
}

export function finishGolfVisit(state: GolfGameState): GolfGameState {
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  if (state.visitDarts.length < DARTS_PER_VISIT) {
    return state;
  }

  return applyVisitResult(state, state.currentPlayerIndex);
}

export function undoGolfDart(state: GolfGameState): GolfGameState {
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

export function getGolfCurrentHole(state: GolfGameState): GolfHoleTarget | null {
  return state.holes[state.holeIndex] ?? null;
}


export function formatGolfProgress(state: GolfGameState): string {
  const hole = getGolfCurrentHole(state);
  if (!hole) {
    return "Golf";
  }

  if (state.phase === "bull_tiebreak") {
    return state.tiebreakRound > 1
      ? `Closest to Bull — Round ${state.tiebreakRound}`
      : "Closest to Bull";
  }

  if (state.phase === "sudden_death") {
    return `Sudden death — Target ${hole.displayLabel}`;
  }

  const isFinalHole =
    state.phase === "holes" &&
    hole.holeNumber === state.regulationHoleCount;

  if (isFinalHole) {
    return `Final hole — Target ${hole.displayLabel}`;
  }

  return `Hole ${hole.holeNumber} — Target ${hole.displayLabel}`;
}

export function getGolfDartboardHighlight(state: GolfGameState): {
  practiceHighlightSegment?: number | "bull";
  practiceHighlightBulls?: boolean;
} {
  const hole = getGolfCurrentHole(state);
  if (!hole) {
    return {};
  }

  if (hole.segment === "bull") {
    return { practiceHighlightBulls: true };
  }

  return { practiceHighlightSegment: hole.segment };
}
