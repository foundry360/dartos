import { DARTS_PER_VISIT } from "@/lib/constants";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import { buildTicTacToeBoard, resolveTicTacToeGamesToWin } from "@/features/classic-games/lib/tic-tac-toe-config";
import type { TicTacToeCallout } from "@/lib/tic-tac-toe-callouts";
import type {
  TicTacToeCell,
  TicTacToeClaimRules,
  TicTacToeGameState,
  TicTacToeHistoryEntry,
  TicTacToeMatchSetup,
  TicTacToePlayerState,
  TicTacToeSymbol,
} from "@/types/tic-tac-toe";
import type { DartHit } from "@/types/dart";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function cloneCell(cell: TicTacToeCell): TicTacToeCell {
  return { ...cell };
}

function clonePlayer(player: TicTacToePlayerState): TicTacToePlayerState {
  return { ...player };
}

function cloneCells(cells: TicTacToeCell[]): TicTacToeCell[] {
  return cells.map(cloneCell);
}

function getPlayerSymbol(playerIndex: number): TicTacToeSymbol {
  return playerIndex === 0 ? "X" : "O";
}

function findCellIndexBySegment(cells: TicTacToeCell[], segment: DartHit["segment"]): number | null {
  if (typeof segment !== "number") {
    return null;
  }

  const index = cells.findIndex((cell) => cell.segment === segment);
  return index >= 0 ? index : null;
}

function getClaimCredits(hit: DartHit, claimRules: TicTacToeClaimRules): number {
  if (hit.segment === "miss" || hit.multiplier === "miss") {
    return 0;
  }

  if (claimRules === "beginner") {
    return 1;
  }

  if (hit.multiplier === "triple") {
    return 3;
  }

  if (hit.multiplier === "double") {
    return 2;
  }

  return 1;
}

function detectWinningLine(cells: TicTacToeCell[]): number[] | null {
  for (const line of WIN_LINES) {
    const owners = line.map((index) => cells[index]?.owner ?? null);
    if (owners[0] && owners.every((owner) => owner === owners[0])) {
      return [...line];
    }
  }

  return null;
}

function isBoardFull(cells: TicTacToeCell[]): boolean {
  return cells.every((cell) => cell.owner != null);
}

function buildHistoryRevert(state: TicTacToeGameState): Omit<TicTacToeGameState, "history"> {
  return {
    boardLayoutId: state.boardLayoutId,
    claimRules: state.claimRules,
    matchFormat: state.matchFormat,
    gamesToWin: state.gamesToWin,
    gameNumber: state.gameNumber,
    startingPlayerRule: state.startingPlayerRule,
    coinTossStarterIndex: state.coinTossStarterIndex,
    cells: cloneCells(state.cells),
    players: [clonePlayer(state.players[0]), clonePlayer(state.players[1])],
    currentPlayerIndex: state.currentPlayerIndex,
    visitDarts: [...state.visitDarts],
    status: state.status,
    winnerId: state.winnerId,
    winningLine: state.winningLine ? [...state.winningLine] : undefined,
    matchId: state.matchId,
  };
}

function resetBoardForNextGame(
  state: TicTacToeGameState,
  nextStarterIndex: number,
): TicTacToeGameState {
  return {
    ...state,
    cells: buildTicTacToeBoard(state.boardLayoutId),
    currentPlayerIndex: nextStarterIndex,
    visitDarts: [],
    status: "playing",
    winnerId: undefined,
    winningLine: undefined,
    gameNumber: state.gameNumber + 1,
  };
}

function finishSeries(
  state: TicTacToeGameState,
  winnerIndex: number,
  winningLine: number[],
): TicTacToeGameState {
  const players = [
    clonePlayer(state.players[0]),
    clonePlayer(state.players[1]),
  ] as [TicTacToePlayerState, TicTacToePlayerState];
  players[winnerIndex]!.gamesWon += 1;

  return {
    ...state,
    players,
    visitDarts: [],
    status: "finished",
    winnerId: players[winnerIndex]!.id,
    winningLine,
  };
}

function applyVisitClaims(
  state: TicTacToeGameState,
  playerIndex: number,
): {
  cells: TicTacToeCell[];
  squareClaimed: boolean;
  alreadyClaimed: boolean;
  noClaim: boolean;
} {
  const symbol = getPlayerSymbol(playerIndex);
  const cells = cloneCells(state.cells);
  let bankedCredits = 0;
  let squareClaimed = false;
  let alreadyClaimed = false;
  let hadBoardHit = false;

  for (const dart of state.visitDarts) {
    const cellIndex = findCellIndexBySegment(cells, dart.segment);
    if (cellIndex == null) {
      continue;
    }

    hadBoardHit = true;
    bankedCredits += getClaimCredits(dart, state.claimRules);

    const cell = cells[cellIndex]!;
    if (cell.owner != null) {
      alreadyClaimed = true;
      continue;
    }

    if (bankedCredits >= 1) {
      cells[cellIndex] = {
        ...cell,
        owner: symbol,
      };
      bankedCredits -= 1;
      squareClaimed = true;
    }
  }

  const noClaim = !squareClaimed && (hadBoardHit || state.visitDarts.length > 0);

  return {
    cells,
    squareClaimed,
    alreadyClaimed,
    noClaim: noClaim && !alreadyClaimed,
  };
}

function resolveRoundAfterVisit(
  state: TicTacToeGameState,
  playerIndex: number,
  cells: TicTacToeCell[],
  winningLine: number[] | null,
): TicTacToeGameState {
  const players = [
    clonePlayer(state.players[0]),
    clonePlayer(state.players[1]),
  ] as [TicTacToePlayerState, TicTacToePlayerState];

  if (winningLine) {
    players[playerIndex]!.gamesWon += 1;

    if (players[playerIndex]!.gamesWon >= state.gamesToWin) {
      return {
        ...state,
        cells,
        players,
        visitDarts: [],
        status: "finished",
        winnerId: players[playerIndex]!.id,
        winningLine,
      };
    }

    const nextStarterIndex = (state.currentPlayerIndex + 1) % 2;
    return resetBoardForNextGame(
      {
        ...state,
        cells,
        players,
        visitDarts: [],
        winningLine,
      },
      nextStarterIndex,
    );
  }

  if (isBoardFull(cells)) {
    if (state.matchFormat === "single") {
      return {
        ...state,
        cells,
        players,
        visitDarts: [],
        status: "draw",
      };
    }

    const nextStarterIndex = (state.currentPlayerIndex + 1) % 2;
    return resetBoardForNextGame(
      {
        ...state,
        cells,
        players,
        visitDarts: [],
      },
      nextStarterIndex,
    );
  }

  return {
    ...state,
    cells,
    players,
    currentPlayerIndex: (playerIndex + 1) % 2,
    visitDarts: [],
  };
}

export function createTicTacToePlayer(
  slot: TicTacToeMatchSetup["players"][number],
  color: string,
  symbol: TicTacToeSymbol,
): TicTacToePlayerState {
  return {
    id: slot.id,
    name: slot.name,
    nickname: slot.nickname ?? null,
    color,
    profileId: slot.profileId,
    isGuest: slot.source === "guest",
    avatarUrl: slot.avatarUrl,
    symbol,
    gamesWon: 0,
  };
}

export function createTicTacToeGame(setup: TicTacToeMatchSetup): TicTacToeGameState {
  const players = [
    createTicTacToePlayer(setup.players[0]!, setup.players[0]!.color ?? "#84c126", "X"),
    createTicTacToePlayer(setup.players[1]!, setup.players[1]!.color ?? "#3b82f6", "O"),
  ] as [TicTacToePlayerState, TicTacToePlayerState];

  const starterIndex = resolveLegStarterIndex(setup.startingPlayerRule, {
    playerCount: 2,
    legNumber: 1,
    coinTossStarterIndex: setup.coinTossStarterIndex,
  });

  return {
    boardLayoutId: setup.boardLayoutId,
    claimRules: setup.claimRules,
    matchFormat: setup.matchFormat,
    gamesToWin: resolveTicTacToeGamesToWin(setup.matchFormat),
    gameNumber: 1,
    startingPlayerRule: setup.startingPlayerRule,
    coinTossStarterIndex: setup.coinTossStarterIndex,
    cells: buildTicTacToeBoard(setup.boardLayoutId),
    players,
    currentPlayerIndex: starterIndex,
    visitDarts: [],
    history: [],
    status: "playing",
  };
}

export function applyTicTacToeDart(state: TicTacToeGameState, hit: DartHit): TicTacToeGameState {
  if (state.status !== "playing" || state.visitDarts.length >= DARTS_PER_VISIT) {
    return state;
  }

  const historyEntry: TicTacToeHistoryEntry = {
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

export function finishTicTacToeVisit(state: TicTacToeGameState): TicTacToeGameState {
  if (state.status !== "playing" || state.visitDarts.length < DARTS_PER_VISIT) {
    return state;
  }

  const playerIndex = state.currentPlayerIndex;
  const claimResult = applyVisitClaims(state, playerIndex);
  const winningLine = detectWinningLine(claimResult.cells);

  return resolveRoundAfterVisit(state, playerIndex, claimResult.cells, winningLine);
}

export function undoTicTacToeDart(state: TicTacToeGameState): TicTacToeGameState {
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

export function getTicTacToeUnclaimedSegments(state: TicTacToeGameState): number[] {
  return state.cells.filter((cell) => cell.owner == null).map((cell) => cell.segment);
}

export function formatTicTacToeProgress(state: TicTacToeGameState): string {
  if (state.status === "finished") {
    return `Game ${state.gameNumber} complete`;
  }

  if (state.status === "draw") {
    return "Draw";
  }

  if (state.gamesToWin > 1) {
    return `Game ${state.gameNumber} · ${state.players[0].gamesWon}–${state.players[1].gamesWon}`;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  return `${currentPlayer?.symbol ?? "X"} to throw`;
}

export function resolveTicTacToeMatchStartAnnouncements(
  state: TicTacToeGameState,
): TicTacToeCallout[] {
  return [
    { type: "game-title" },
    { type: "player-starts", playerNumber: state.currentPlayerIndex + 1 },
    { type: "targets-displayed" },
  ];
}

export function resolveTicTacToeAnnouncementsAfterVisit(
  before: TicTacToeGameState,
  after: TicTacToeGameState,
  completedPlayerIndex: number,
): TicTacToeCallout[] {
  const announcements: TicTacToeCallout[] = [];
  const claimResult = applyVisitClaims(before, completedPlayerIndex);
  const winningLine = detectWinningLine(claimResult.cells);
  const gameWon =
    (after.players[completedPlayerIndex]?.gamesWon ?? 0) >
    (before.players[completedPlayerIndex]?.gamesWon ?? 0);

  if (claimResult.squareClaimed) {
    announcements.push({ type: "square-claimed" });
  }

  if (claimResult.alreadyClaimed) {
    announcements.push({ type: "already-claimed" });
  }

  if (claimResult.noClaim && !claimResult.squareClaimed) {
    announcements.push({ type: "no-claim" });
  }

  if (winningLine) {
    announcements.push({ type: "three-in-a-row" });
  }

  if (gameWon) {
    announcements.push({
      type: "player-wins",
      playerNumber: completedPlayerIndex + 1,
    });

    if (after.status === "finished") {
      announcements.push({ type: "game-complete" });
    }
  }

  return announcements;
}

export function getTicTacToeWinningLine(state: TicTacToeGameState): number[] | null {
  return state.winningLine ?? detectWinningLine(state.cells);
}
