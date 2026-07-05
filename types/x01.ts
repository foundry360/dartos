import type { X01GameType } from "@/lib/constants";
import type { DartHit } from "@/types/dart";

export interface X01PlayerState {
  id: string;
  name: string;
  color: string;
  remaining: number;
  legsWon: number;
  setsWon: number;
  visitScores: number[];
  checkoutAttempts: number;
  checkoutSuccesses: number;
}

export interface X01GameState {
  gameType: X01GameType;
  players: X01PlayerState[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  visitStartRemaining: number;
  legsToWin: number;
  setsToWin: number;
  history: X01HistoryEntry[];
  status: "setup" | "playing" | "finished";
  winnerId?: string;
}

export interface X01HistoryEntry {
  playerIndex: number;
  dart: DartHit;
  remainingBefore: number;
  remainingAfter: number;
  bust: boolean;
}

export interface CheckoutSuggestion {
  darts: string[];
  totalDarts: number;
}
