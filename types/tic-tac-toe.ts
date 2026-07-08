import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type TicTacToeSymbol = "X" | "O";

export type TicTacToeBoardLayoutId = "standard" | "numbers_12_20";

export type TicTacToeClaimRules = "beginner" | "advanced";

export type TicTacToeMatchFormat = "single" | "best_of_3" | "best_of_5";

export interface TicTacToeCell {
  row: number;
  col: number;
  segment: number;
  owner: TicTacToeSymbol | null;
}

export interface TicTacToeMatchSetup {
  boardLayoutId: TicTacToeBoardLayoutId;
  claimRules: TicTacToeClaimRules;
  matchFormat: TicTacToeMatchFormat;
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface TicTacToePlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  symbol: TicTacToeSymbol;
  gamesWon: number;
}

export interface TicTacToeHistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<TicTacToeGameState, "history">;
}

export type TicTacToeGameStatus = "playing" | "finished" | "draw";

export interface TicTacToeGameState {
  boardLayoutId: TicTacToeBoardLayoutId;
  claimRules: TicTacToeClaimRules;
  matchFormat: TicTacToeMatchFormat;
  gamesToWin: number;
  gameNumber: number;
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  cells: TicTacToeCell[];
  players: [TicTacToePlayerState, TicTacToePlayerState];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: TicTacToeHistoryEntry[];
  status: TicTacToeGameStatus;
  winnerId?: string;
  winningLine?: number[];
  matchId?: string;
}
