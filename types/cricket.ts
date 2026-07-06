import type { CricketTarget, CricketVariant } from "@/lib/constants";
import type { MatchTeamNames } from "@/types/player-setup";

export type CricketMark = 0 | 1 | 2 | 3;

export type CricketMarks = Record<CricketTarget, CricketMark>;

export interface CricketPlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  marks: CricketMarks;
  score: number;
  legsWon: number;
  setsWon: number;
  teamId?: number;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
}

export type CricketStartingPlayerRule =
  | "random"
  | "winner_previous_leg"
  | "rotate_each_leg"
  | "coin_toss";

export interface CricketGameState {
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  visitDarts: import("@/types/dart").DartHit[];
  history: CricketHistoryEntry[];
  variant: CricketVariant;
  cutThroat: boolean;
  legsToWin: number;
  setsToWin: number;
  teamsEnabled: boolean;
  teamNames?: MatchTeamNames;
  startingPlayerRule: CricketStartingPlayerRule;
  coinTossStarterIndex?: number;
  legsPlayed: number;
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
