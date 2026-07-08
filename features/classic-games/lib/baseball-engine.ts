import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import {
  BASEBALL_MAX_RUNS_PER_INNING,
  buildBullShootoutTarget,
  buildExtraBaseballInningTarget,
} from "@/features/classic-games/lib/baseball-config";
import type {
  BaseballGameState,
  BaseballHistoryEntry,
  BaseballInningTarget,
  BaseballMatchSetup,
  BaseballPlayerState,
  BaseballScoringMode,
} from "@/types/baseball";
import type { DartHit } from "@/types/dart";

function clonePlayer(player: BaseballPlayerState): BaseballPlayerState {
  return { ...player };
}

export function doesHitMatchBaseballTarget(hit: DartHit, target: BaseballInningTarget): boolean {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return false;
  }

  if (target.segment === "bull") {
    return hit.segment === "bull";
  }

  return hit.segment === target.segment;
}

function runsFromDart(
  hit: DartHit,
  target: BaseballInningTarget,
  scoringMode: BaseballScoringMode,
  homeRunRuleEnabled: boolean,
): { runs: number; homeRun: boolean } {
  if (!doesHitMatchBaseballTarget(hit, target)) {
    return { runs: 0, homeRun: false };
  }

  if (scoringMode === "standard") {
    return { runs: hit.score, homeRun: false };
  }

  let runs = 1;
  if (hit.multiplier === "double") {
    runs = 2;
  } else if (hit.multiplier === "triple") {
    runs = 3;
  }

  const homeRun = homeRunRuleEnabled && hit.multiplier === "triple";
  if (homeRun) {
    runs += 1;
  }

  return { runs, homeRun };
}

export function calculateBaseballVisitRuns(
  visitDarts: DartHit[],
  target: BaseballInningTarget,
  scoringMode: BaseballScoringMode,
  homeRunRuleEnabled: boolean,
): { runs: number; homeRun: boolean } {
  let totalRuns = 0;
  let homeRun = false;

  for (const dart of visitDarts) {
    const result = runsFromDart(dart, target, scoringMode, homeRunRuleEnabled);
    totalRuns += result.runs;
    homeRun = homeRun || result.homeRun;
  }

  if (scoringMode === "baseball") {
    totalRuns = Math.min(BASEBALL_MAX_RUNS_PER_INNING, totalRuns);
  }

  return { runs: totalRuns, homeRun };
}

function getTopRunTotal(players: BaseballPlayerState[]): number {
  return Math.max(...players.map((player) => player.runs));
}

function getTiedLeaderIds(players: BaseballPlayerState[]): string[] {
  const topRuns = getTopRunTotal(players);
  return players.filter((player) => player.runs === topRuns).map((player) => player.id);
}

function isTie(players: BaseballPlayerState[]): boolean {
  return getTiedLeaderIds(players).length > 1;
}

function resolveMatchWinner(players: BaseballPlayerState[]): string {
  let bestIndex = 0;

  for (let index = 1; index < players.length; index += 1) {
    if (players[index]!.runs > players[bestIndex]!.runs) {
      bestIndex = index;
    }
  }

  return players[bestIndex]!.id;
}

function finishGame(state: BaseballGameState, players: BaseballPlayerState[]): BaseballGameState {
  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId: resolveMatchWinner(players),
  };
}

function resetVisitForPlayer(
  state: BaseballGameState,
  players: BaseballPlayerState[],
  playerIndex: number,
): BaseballGameState {
  return {
    ...state,
    players,
    currentPlayerIndex: playerIndex,
    visitDarts: [],
  };
}

function startBullShootout(
  state: BaseballGameState,
  players: BaseballPlayerState[],
  starterIndex: number,
): BaseballGameState {
  const shootoutRound = state.shootoutRound + 1;

  return resetVisitForPlayer(
    {
      ...state,
      phase: "bull_shootout",
      shootoutRound,
      targets: [buildBullShootoutTarget(shootoutRound)],
      inningIndex: 0,
      roundStarterIndex: starterIndex,
    },
    players,
    starterIndex,
  );
}

function startExtraInning(
  state: BaseballGameState,
  players: BaseballPlayerState[],
  starterIndex: number,
): BaseballGameState {
  const extraInningCount = state.extraInningCount + 1;
  const inningNumber = state.regulationInningCount + extraInningCount;
  const extraTarget = buildExtraBaseballInningTarget(
    state.targetSequenceId,
    inningNumber,
    extraInningCount,
  );

  return resetVisitForPlayer(
    {
      ...state,
      extraInningCount,
      targets: [...state.targets, extraTarget],
      inningIndex: state.targets.length,
      roundStarterIndex: starterIndex,
    },
    players,
    starterIndex,
  );
}

function resolveAfterRegulation(
  state: BaseballGameState,
  players: BaseballPlayerState[],
  nextStarterIndex: number,
): BaseballGameState {
  if (!isTie(players)) {
    return finishGame(state, players);
  }

  if (state.tieBreaker === "extra_inning") {
    return startExtraInning(state, players, nextStarterIndex);
  }

  return startBullShootout(state, players, nextStarterIndex);
}

function resolveAfterShootout(
  state: BaseballGameState,
  players: BaseballPlayerState[],
  nextStarterIndex: number,
): BaseballGameState {
  if (!isTie(players)) {
    return finishGame(state, players);
  }

  return startBullShootout(state, players, nextStarterIndex);
}

function advanceAfterVisit(
  state: BaseballGameState,
  players: BaseballPlayerState[],
  fromIndex: number,
): BaseballGameState {
  const nextIndex = (fromIndex + 1) % players.length;

  if (nextIndex !== state.roundStarterIndex) {
    return resetVisitForPlayer(state, players, nextIndex);
  }

  if (state.phase === "bull_shootout") {
    return resolveAfterShootout(state, players, nextIndex);
  }

  const nextInningIndex = state.inningIndex + 1;
  if (nextInningIndex >= state.targets.length) {
    return resolveAfterRegulation(state, players, nextIndex);
  }

  return resetVisitForPlayer(
    {
      ...state,
      players,
      inningIndex: nextInningIndex,
      roundStarterIndex: nextIndex,
    },
    players,
    nextIndex,
  );
}

function applyVisitResult(
  state: BaseballGameState,
  playerIndex: number,
): BaseballGameState {
  const player = state.players[playerIndex];
  const target = state.targets[state.inningIndex];
  if (!player || !target) {
    return state;
  }

  const { runs, homeRun } = calculateBaseballVisitRuns(
    state.visitDarts,
    target,
    state.scoringMode,
    state.homeRunRuleEnabled,
  );

  const updatedPlayers = state.players.map((entry, index) => {
    if (index !== playerIndex) {
      return entry;
    }

    return {
      ...clonePlayer(entry),
      runs: entry.runs + runs,
      lastVisitRuns: runs,
      lastVisitHomeRun: homeRun,
    };
  });

  return advanceAfterVisit(state, updatedPlayers, playerIndex);
}

export function createBaseballPlayer(
  slot: BaseballMatchSetup["players"][number],
  color: string,
  startingRuns: number,
): BaseballPlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    runs: startingRuns,
    lastVisitRuns: null,
    lastVisitHomeRun: false,
  };
}

export function createBaseballGame(setup: BaseballMatchSetup): BaseballGameState {
  const players = setup.players.map((slot, index) =>
    createBaseballPlayer(
      slot,
      slot.color ?? "#84c126",
      setup.startingRuns,
    ),
  );

  const starterIndex = resolveLegStarterIndex(setup.startingPlayerRule, {
    playerCount: players.length,
    legNumber: 1,
    coinTossStarterIndex: setup.coinTossStarterIndex,
  });

  return {
    startingRuns: setup.startingRuns,
    inningCount: setup.inningCount,
    gameLengthPreset: setup.gameLengthPreset,
    targetSequenceId: setup.targetSequenceId,
    scoringMode: setup.scoringMode,
    homeRunRuleEnabled: setup.homeRunRuleEnabled,
    tieBreaker: setup.tieBreaker,
    targets: setup.targets,
    startingPlayerRule: setup.startingPlayerRule,
    coinTossStarterIndex: setup.coinTossStarterIndex,
    phase: "innings",
    regulationInningCount: setup.inningCount,
    extraInningCount: 0,
    shootoutRound: 0,
    players,
    inningIndex: 0,
    roundStarterIndex: starterIndex,
    currentPlayerIndex: starterIndex,
    visitDarts: [],
    history: [],
    status: "playing",
  };
}

function buildHistoryRevert(state: BaseballGameState): Omit<BaseballGameState, "history"> {
  return {
    startingRuns: state.startingRuns,
    inningCount: state.inningCount,
    gameLengthPreset: state.gameLengthPreset,
    targetSequenceId: state.targetSequenceId,
    scoringMode: state.scoringMode,
    homeRunRuleEnabled: state.homeRunRuleEnabled,
    tieBreaker: state.tieBreaker,
    targets: state.targets,
    startingPlayerRule: state.startingPlayerRule,
    coinTossStarterIndex: state.coinTossStarterIndex,
    phase: state.phase,
    regulationInningCount: state.regulationInningCount,
    extraInningCount: state.extraInningCount,
    shootoutRound: state.shootoutRound,
    players: state.players.map(clonePlayer),
    inningIndex: state.inningIndex,
    roundStarterIndex: state.roundStarterIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    visitDarts: [...state.visitDarts],
    status: state.status,
    winnerId: state.winnerId,
    matchId: state.matchId,
  };
}

export function applyBaseballDart(state: BaseballGameState, hit: DartHit): BaseballGameState {
  if (state.status !== "playing") {
    return state;
  }

  if (state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const historyEntry: BaseballHistoryEntry = {
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

export function finishBaseballVisit(state: BaseballGameState): BaseballGameState {
  if (state.status !== "playing" || state.visitDarts.length === 0) {
    return state;
  }

  if (state.visitDarts.length < DARTS_PER_VISIT) {
    return state;
  }

  return applyVisitResult(state, state.currentPlayerIndex);
}

export function undoBaseballDart(state: BaseballGameState): BaseballGameState {
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

export function getBaseballCurrentTarget(state: BaseballGameState): BaseballInningTarget | null {
  return state.targets[state.inningIndex] ?? null;
}

export function formatBaseballProgress(state: BaseballGameState): string {
  const target = getBaseballCurrentTarget(state);
  if (!target) {
    return "Baseball";
  }

  if (state.phase === "bull_shootout") {
    return state.shootoutRound > 1
      ? `Bull shootout — Round ${state.shootoutRound}`
      : "Bull shootout";
  }

  const inningNumber = target.inningNumber;
  const isExtraInning = inningNumber > state.regulationInningCount;
  const isFinalInning =
    state.phase === "innings" &&
    inningNumber === state.regulationInningCount &&
    state.extraInningCount === 0;

  if (isExtraInning) {
    return `Extra inning — Target ${target.displayLabel}`;
  }

  if (isFinalInning) {
    return `Final inning — Target ${target.displayLabel}`;
  }

  return `${formatInningLabel(inningNumber)} — Target ${target.displayLabel}`;
}

function formatInningLabel(inningNumber: number): string {
  const suffixes: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
  };

  return suffixes[inningNumber] ?? `${inningNumber}th`;
}

export function getBaseballDartboardHighlight(state: BaseballGameState): {
  practiceHighlightSegment?: number | "bull";
  practiceHighlightBulls?: boolean;
} {
  const target = getBaseballCurrentTarget(state);
  if (!target) {
    return {};
  }

  if (target.segment === "bull") {
    return { practiceHighlightBulls: true };
  }

  return { practiceHighlightSegment: target.segment };
}
