import type { X01GameType } from "@/lib/constants";
import type { BotDifficultyId } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames } from "@/types/player-setup";

export type X01InRule = "straight_in" | "double_in";

export type X01OutRule = "straight_out" | "double_out";

export interface X01PlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  remaining: number;
  legsWon: number;
  setsWon: number;
  visitScores: number[];
  checkoutAttempts: number;
  checkoutSuccesses: number;
  scoredIn?: boolean;
  teamId?: number;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  playerKind?: "human" | "bot";
  botDifficultyId?: BotDifficultyId;
}

export interface X01GameState {
  gameType: X01GameType;
  players: X01PlayerState[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  visitStartRemaining: number;
  visitStartScoredIn: boolean;
  legsToWin: number;
  setsToWin: number;
  teamsEnabled: boolean;
  teamNames?: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  inRule: X01InRule;
  outRule: X01OutRule;
  coinTossStarterIndex?: number;
  legsPlayed: number;
  history: X01HistoryEntry[];
  status: "setup" | "playing" | "finished";
  winnerId?: string;
  matchId?: string;
  isBotMatch?: boolean;
}

export interface X01HistoryEntry {
  playerIndex: number;
  dart: DartHit;
  remainingBefore: number;
  remainingAfter: number;
  effectiveScore: number;
  scoredInBefore: boolean;
  scoredInAfter: boolean;
  bust: boolean;
}

export interface CheckoutSuggestion {
  darts: string[];
  totalDarts: number;
}
