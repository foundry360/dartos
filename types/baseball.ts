import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type BaseballGameLengthPreset = "standard" | "short" | "custom";

export type BaseballTargetSequenceId = "1-9" | "11-19" | "custom";

export type BaseballScoringMode = "baseball" | "standard";

export type BaseballTieBreaker = "extra_inning" | "bull_shootout";

export type BaseballGamePhase = "innings" | "bull_shootout";

export interface BaseballInningTarget {
  segment: number | "bull";
  label: string;
  displayLabel: string;
  inningNumber: number;
}

export interface BaseballMatchSetup {
  startingRuns: number;
  inningCount: number;
  gameLengthPreset: BaseballGameLengthPreset;
  targetSequenceId: BaseballTargetSequenceId;
  scoringMode: BaseballScoringMode;
  homeRunRuleEnabled: boolean;
  tieBreaker: BaseballTieBreaker;
  targets: BaseballInningTarget[];
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface BaseballPlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  runs: number;
  lastVisitRuns: number | null;
  lastVisitHomeRun: boolean;
}

export interface BaseballHistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<BaseballGameState, "history">;
}

export interface BaseballGameState {
  startingRuns: number;
  inningCount: number;
  gameLengthPreset: BaseballGameLengthPreset;
  targetSequenceId: BaseballTargetSequenceId;
  scoringMode: BaseballScoringMode;
  homeRunRuleEnabled: boolean;
  tieBreaker: BaseballTieBreaker;
  targets: BaseballInningTarget[];
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  phase: BaseballGamePhase;
  regulationInningCount: number;
  extraInningCount: number;
  shootoutRound: number;
  players: BaseballPlayerState[];
  inningIndex: number;
  roundStarterIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: BaseballHistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
}
