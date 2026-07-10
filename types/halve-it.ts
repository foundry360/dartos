import type { BotDifficultyId } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type HalveItScoringMode = "target_only" | "open";

export type HalveItTargetSequenceId = "numbers" | "doubles" | "triples" | "classic";

export type HalveItGameLengthPreset = "short" | "standard" | "custom";

export interface HalveItTarget {
  segment: number | "bull";
  multiplier?: "single" | "double" | "triple";
  label: string;
  displayLabel: string;
}

export interface HalveItMatchSetup {
  startingScore: number;
  roundCount: number;
  targetSequenceId: HalveItTargetSequenceId;
  scoringMode: HalveItScoringMode;
  targets: HalveItTarget[];
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
  isBotMatch?: boolean;
}

export interface HalveItPlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  score: number;
  lastVisitPoints: number | null;
  lastVisitHalved: boolean;
  playerKind?: "human" | "bot";
  botDifficultyId?: BotDifficultyId;
}

export interface HalveItHistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<HalveItGameState, "history">;
}

export interface HalveItGameState {
  startingScore: number;
  roundCount: number;
  targetSequenceId: HalveItTargetSequenceId;
  scoringMode: HalveItScoringMode;
  targets: HalveItTarget[];
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  players: HalveItPlayerState[];
  roundIndex: number;
  roundStarterIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: HalveItHistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
  isBotMatch?: boolean;
}
