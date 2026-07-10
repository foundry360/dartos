import type { BotDifficultyId } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type ShanghaiGameLengthPreset = "full" | "classic" | "short" | "custom";

export type ShanghaiRule = "instant_win" | "bonus_points" | "disabled";

export type ShanghaiWinningMode = "highest_score" | "race_to_shanghai";

export interface ShanghaiTarget {
  segment: number | "bull";
  label: string;
  displayLabel: string;
}

export interface ShanghaiMatchSetup {
  startingScore: number;
  roundCount: number;
  gameLengthPreset: ShanghaiGameLengthPreset;
  bullRoundIncluded: boolean;
  shanghaiRule: ShanghaiRule;
  winningMode: ShanghaiWinningMode;
  targets: ShanghaiTarget[];
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
  isBotMatch?: boolean;
}

export interface ShanghaiPlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  score: number;
  lastVisitPoints: number | null;
  lastVisitShanghai: boolean;
  playerKind?: "human" | "bot";
  botDifficultyId?: BotDifficultyId;
}

export interface ShanghaiHistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<ShanghaiGameState, "history">;
}

export interface ShanghaiGameState {
  startingScore: number;
  roundCount: number;
  gameLengthPreset: ShanghaiGameLengthPreset;
  bullRoundIncluded: boolean;
  shanghaiRule: ShanghaiRule;
  winningMode: ShanghaiWinningMode;
  targets: ShanghaiTarget[];
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  players: ShanghaiPlayerState[];
  roundIndex: number;
  roundStarterIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: ShanghaiHistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
  isBotMatch?: boolean;
}
