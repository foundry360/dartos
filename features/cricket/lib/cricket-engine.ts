import type { CricketTarget } from "@/lib/constants";
import { CRICKET_TARGETS } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type {
  CricketGameState,
  CricketHistoryEntry,
  CricketMarks,
  CricketPlayerState,
} from "@/types/cricket";
import { resolveLegStarterIndex } from "@/features/cricket/lib/starting-player";

function createEmptyMarks(): CricketMarks {
  return {
    20: 0,
    19: 0,
    18: 0,
    17: 0,
    16: 0,
    15: 0,
    bull: 0,
  };
}

export function createCricketPlayer(
  id: string,
  name: string,
  color: string,
  options?: {
    teamId?: number;
    profileId?: string;
    isGuest?: boolean;
    avatarUrl?: string;
  },
): CricketPlayerState {
  return {
    id,
    name,
    color,
    marks: createEmptyMarks(),
    score: 0,
    legsWon: 0,
    setsWon: 0,
    teamId: options?.teamId,
    profileId: options?.profileId,
    isGuest: options?.isGuest,
    avatarUrl: options?.avatarUrl,
  };
}

function awardLegWin(
  players: CricketPlayerState[],
  winnerIndex: number,
  teamsEnabled: boolean,
): CricketPlayerState[] {
  if (!teamsEnabled) {
    return players.map((player, index) => ({
      ...clonePlayer(player),
      legsWon: index === winnerIndex ? player.legsWon + 1 : player.legsWon,
    }));
  }

  const winnerTeamId = players[winnerIndex]?.teamId ?? winnerIndex;

  return players.map((player) => ({
    ...clonePlayer(player),
    legsWon:
      (player.teamId ?? players.indexOf(player)) === winnerTeamId
        ? player.legsWon + 1
        : player.legsWon,
  }));
}

function teamHasWonMatch(
  players: CricketPlayerState[],
  teamsEnabled: boolean,
  setsToWin: number,
): CricketPlayerState | undefined {
  if (!teamsEnabled) {
    return players.find((player) => player.setsWon >= setsToWin);
  }

  const teamSetCounts = new Map<number, number>();

  for (const player of players) {
    const teamId = player.teamId ?? players.indexOf(player);
    teamSetCounts.set(teamId, Math.max(teamSetCounts.get(teamId) ?? 0, player.setsWon));
  }

  const winningTeamEntry = [...teamSetCounts.entries()].find(([, sets]) => sets >= setsToWin);

  if (!winningTeamEntry) {
    return undefined;
  }

  return players.find(
    (player) => (player.teamId ?? players.indexOf(player)) === winningTeamEntry[0],
  );
}

function resetTeamLegCounts(players: CricketPlayerState[]): CricketPlayerState[] {
  return players.map((player) => ({
    ...clonePlayer(player),
    legsWon: 0,
  }));
}

function incrementTeamSetWin(
  players: CricketPlayerState[],
  winnerIndex: number,
  teamsEnabled: boolean,
): CricketPlayerState[] {
  if (!teamsEnabled) {
    return players.map((player, index) => ({
      ...clonePlayer(player),
      legsWon: 0,
      setsWon: index === winnerIndex ? player.setsWon + 1 : player.setsWon,
    }));
  }

  const winnerTeamId = players[winnerIndex]?.teamId ?? winnerIndex;

  return players.map((player) => ({
    ...clonePlayer(player),
    legsWon: 0,
    setsWon:
      (player.teamId ?? players.indexOf(player)) === winnerTeamId
        ? player.setsWon + 1
        : player.setsWon,
  }));
}

function nextLegStarterIndex(
  state: CricketGameState,
  lastLegWinnerIndex: number,
): number {
  return resolveLegStarterIndex(state.startingPlayerRule, {
    playerCount: state.players.length,
    legNumber: state.legsPlayed + 1,
    lastLegWinnerIndex,
    coinTossStarterIndex: state.coinTossStarterIndex,
  });
}

function resetPlayerForNewLeg(player: CricketPlayerState): CricketPlayerState {
  return {
    ...player,
    marks: createEmptyMarks(),
    score: 0,
  };
}

function clonePlayer(player: CricketPlayerState): CricketPlayerState {
  return {
    ...player,
    marks: cloneMarks(player.marks),
  };
}

export function isCricketTarget(segment: DartHit["segment"]): segment is CricketTarget {
  if (segment === "miss") {
    return false;
  }

  if (segment === "bull") {
    return true;
  }

  return CRICKET_TARGETS.includes(segment as CricketTarget);
}

export function marksFromHit(hit: DartHit): number {
  if (hit.segment === "miss") {
    return 0;
  }

  if (hit.segment === "bull") {
    return hit.multiplier === "double" ? 2 : 1;
  }

  switch (hit.multiplier) {
    case "single":
      return 1;
    case "double":
      return 2;
    case "triple":
      return 3;
    default:
      return 0;
  }
}

function targetValue(target: CricketTarget): number {
  return target === "bull" ? 25 : target;
}

function allTargetsClosed(marks: CricketMarks): boolean {
  return CRICKET_TARGETS.every((target) => marks[target] >= 3);
}

function cloneMarks(marks: CricketMarks): CricketMarks {
  return { ...marks };
}

export function applyCricketDart(
  state: CricketGameState,
  hit: DartHit,
): CricketGameState {
  if (state.status !== "playing") {
    return state;
  }

  const player = state.players[state.currentPlayerIndex];
  if (!player) {
    return state;
  }

  if (!isCricketTarget(hit.segment)) {
    return {
      ...state,
      visitDarts: [...state.visitDarts, hit],
    };
  }

  const target = hit.segment;
  const marksAdded = marksFromHit(hit);
  const marksBefore = cloneMarks(player.marks);
  const scoreBefore = player.score;
  const marksAfter = cloneMarks(player.marks);
  let scoreAfter = player.score;

  const currentMarks = marksAfter[target];
  const totalMarks = currentMarks + marksAdded;
  marksAfter[target] = Math.min(3, totalMarks) as 0 | 1 | 2 | 3;

  let scoringMarks = 0;
  if (currentMarks >= 3) {
    scoringMarks = marksAdded;
  } else if (totalMarks > 3) {
    scoringMarks = totalMarks - 3;
  }

  if (scoringMarks > 0 && !state.cutThroat) {
    const canScore = state.players.some(
      (opponent, index) =>
        index !== state.currentPlayerIndex && opponent.marks[target] < 3,
    );

    if (canScore) {
      scoreAfter += scoringMarks * targetValue(target);
    }
  }

  const updatedPlayers = state.players.map((entry, index) => {
    if (index === state.currentPlayerIndex) {
      return {
        ...entry,
        marks: marksAfter,
        score: scoreAfter,
      };
    }

    if (state.cutThroat && scoringMarks > 0 && entry.marks[target] < 3) {
      return {
        ...entry,
        score: entry.score + scoringMarks * targetValue(target),
      };
    }

    return entry;
  });

  const historyEntry: CricketHistoryEntry = {
    playerIndex: state.currentPlayerIndex,
    dart: hit,
    marksBefore,
    marksAfter,
    scoreBefore,
    scoreAfter,
  };

  return {
    ...state,
    players: updatedPlayers,
    visitDarts: [...state.visitDarts, hit],
    history: [...state.history, historyEntry],
  };
}

export function finishCricketTurn(state: CricketGameState): CricketGameState {
  if (state.status !== "playing") {
    return state;
  }

  const legWinner = detectCricketWinner(state.players, state.cutThroat);

  if (legWinner) {
    return handleCricketLegWin(state, legWinner);
  }

  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    visitDarts: [],
  };
}

function handleCricketLegWin(
  state: CricketGameState,
  legWinner: CricketPlayerState,
): CricketGameState {
  const winnerIndex = state.players.findIndex((player) => player.id === legWinner.id);

  if (winnerIndex === -1) {
    return state;
  }

  const legsPlayed = state.legsPlayed + 1;
  const afterLegWin = awardLegWin(state.players, winnerIndex, state.teamsEnabled);
  const winner = afterLegWin[winnerIndex]!;
  const nextStarter = nextLegStarterIndex(
    { ...state, legsPlayed },
    winnerIndex,
  );

  if (winner.legsWon < state.legsToWin) {
    return {
      ...state,
      players: afterLegWin.map((player) => resetPlayerForNewLeg(player)),
      currentPlayerIndex: nextStarter,
      visitDarts: [],
      history: [],
      legsPlayed,
      status: "playing",
      winnerId: undefined,
    };
  }

  const afterSetWin = incrementTeamSetWin(
    afterLegWin,
    winnerIndex,
    state.teamsEnabled,
  );
  const matchWinner = teamHasWonMatch(
    afterSetWin,
    state.teamsEnabled,
    state.setsToWin,
  );

  if (matchWinner) {
    return {
      ...state,
      players: afterSetWin,
      visitDarts: [],
      history: [],
      legsPlayed,
      status: "finished",
      winnerId: matchWinner.id,
    };
  }

  const afterSetReset = state.teamsEnabled
    ? resetTeamLegCounts(afterSetWin)
    : afterSetWin.map((player) => resetPlayerForNewLeg(player));

  return {
    ...state,
    players: afterSetReset,
    currentPlayerIndex: nextStarter,
    visitDarts: [],
    history: [],
    legsPlayed,
    status: "playing",
    winnerId: undefined,
  };
}

export function undoCricketDart(state: CricketGameState): CricketGameState {
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
      marks: cloneMarks(lastEntry.marksBefore),
      score: lastEntry.scoreBefore,
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
  };
}

export function getCricketLegWinner(state: CricketGameState): CricketPlayerState | undefined {
  return detectCricketWinner(state.players, state.cutThroat);
}

function detectCricketWinner(
  players: CricketPlayerState[],
  cutThroat: boolean,
): CricketPlayerState | undefined {
  const eligible = players.filter((player) => allTargetsClosed(player.marks));

  if (eligible.length === 0) {
    return undefined;
  }

  if (cutThroat) {
    return eligible.reduce((best, player) =>
      player.score < best.score ? player : best,
    );
  }

  return eligible.reduce((best, player) => (player.score > best.score ? player : best));
}

export function formatCricketMark(mark: number): string {
  if (mark <= 0) {
    return "";
  }

  if (mark === 1) {
    return "/";
  }

  if (mark === 2) {
    return "X";
  }

  return "●";
}
