import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type KillerGameType = "classic" | "team";

export type KillerNumberAssignment = "random" | "player_chosen" | "first_dart";

export type KillerStartingLivesPreset = "3" | "5" | "custom";

export type KillerTargetRules = "numbers_only" | "include_bull";

export type KillerHitRules = "classic" | "flat";

export type KillerAssignedNumber = number | "bull";

export type KillerGamePhase = "number_assignment" | "playing";

export interface KillerMatchSetup {
  gameType: KillerGameType;
  numberAssignment: KillerNumberAssignment;
  startingLivesPreset: KillerStartingLivesPreset;
  startingLives: number;
  targetRules: KillerTargetRules;
  hitRules: KillerHitRules;
  playerNumbers: KillerAssignedNumber[];
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface KillerPlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  teamId: number;
  assignedNumber: KillerAssignedNumber | null;
  lives: number;
  isKiller: boolean;
  eliminated: boolean;
  lastVisitDelta: number | null;
}

export interface KillerHistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<KillerGameState, "history">;
}

export interface KillerGameState {
  gameType: KillerGameType;
  numberAssignment: KillerNumberAssignment;
  startingLives: number;
  targetRules: KillerTargetRules;
  hitRules: KillerHitRules;
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  phase: KillerGamePhase;
  players: KillerPlayerState[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: KillerHistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
}
