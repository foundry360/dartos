import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type Checkout121OutRule = "double_out" | "master_out";

export type Checkout121AttemptDarts = 3 | 6 | 9 | 12;

export interface Checkout121MatchSetup {
  startScore: number;
  finishScore: number;
  dartsPerAttempt: Checkout121AttemptDarts;
  outRule: Checkout121OutRule;
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface Checkout121PlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  currentTarget: number;
  remaining: number;
  checkoutsCompleted: number;
}

export interface Checkout121HistoryEntry {
  playerIndex: number;
  dart: DartHit;
  remainingBefore: number;
  remainingAfter: number;
  effectiveScore: number;
  bust: boolean;
  revert: Omit<Checkout121GameState, "history">;
}

export interface Checkout121GameState {
  startScore: number;
  finishScore: number;
  dartsPerAttempt: Checkout121AttemptDarts;
  outRule: Checkout121OutRule;
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  players: Checkout121PlayerState[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  visitStartRemaining: number;
  dartsUsedInAttempt: number;
  history: Checkout121HistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
}
