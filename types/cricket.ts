import type { CricketTarget } from "@/lib/constants";

export type CricketMark = 0 | 1 | 2 | 3;

export type CricketMarks = Record<CricketTarget, CricketMark>;

export interface CricketPlayerState {
  id: string;
  name: string;
  color: string;
  marks: CricketMarks;
  score: number;
}

export interface CricketGameState {
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  visitDarts: import("@/types/dart").DartHit[];
  history: CricketHistoryEntry[];
  cutThroat: boolean;
  status: "setup" | "playing" | "finished";
  winnerId?: string;
}

export interface CricketHistoryEntry {
  playerIndex: number;
  dart: import("@/types/dart").DartHit;
  marksBefore: CricketMarks;
  marksAfter: CricketMarks;
  scoreBefore: number;
  scoreAfter: number;
}
