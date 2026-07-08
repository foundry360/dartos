import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type GolfGameLengthPreset = "short" | "standard";

export type GolfTargetSequenceId = "1-18" | "random" | "custom";

export type GolfScoringMode = "strokes" | "golf_scoring";

export type GolfTieBreaker = "sudden_death" | "closest_to_bull";

export type GolfGamePhase = "holes" | "sudden_death" | "bull_tiebreak";

export interface GolfHoleTarget {
  segment: number | "bull";
  label: string;
  displayLabel: string;
  holeNumber: number;
}

export interface GolfMatchSetup {
  startingStrokes: number;
  holeCount: number;
  gameLengthPreset: GolfGameLengthPreset;
  targetSequenceId: GolfTargetSequenceId;
  scoringMode: GolfScoringMode;
  tieBreaker: GolfTieBreaker;
  holes: GolfHoleTarget[];
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface GolfPlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  strokes: number;
  lastHoleStrokes: number | null;
  lastHoleResultLabel: string | null;
}

export interface GolfHistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<GolfGameState, "history">;
}

export interface GolfGameState {
  startingStrokes: number;
  holeCount: number;
  gameLengthPreset: GolfGameLengthPreset;
  targetSequenceId: GolfTargetSequenceId;
  scoringMode: GolfScoringMode;
  tieBreaker: GolfTieBreaker;
  holes: GolfHoleTarget[];
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  phase: GolfGamePhase;
  regulationHoleCount: number;
  suddenDeathRound: number;
  tiebreakRound: number;
  players: GolfPlayerState[];
  holeIndex: number;
  roundStarterIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: GolfHistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
}
