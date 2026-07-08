import type { DartHit } from "@/types/dart";
import type { MatchStartingPlayerRule, MatchTeamNames, PlayerSetupSlot } from "@/types/player-setup";

export type Bobs27GameLengthPreset = "short" | "standard" | "custom";

export type Bobs27TargetTypeId = "doubles" | "doubles_bull" | "doubles_trebles";

export type Bobs27PlayerMode = "solo" | "multiplayer";

export interface Bobs27Target {
  segment: number | "bull";
  multiplier: "double" | "triple";
  label: string;
  displayLabel: string;
  penaltyValue: number;
}

export interface Bobs27MatchSetup {
  startingScore: number;
  roundCount: number;
  targetTypeId: Bobs27TargetTypeId;
  eliminationEnabled: boolean;
  playerMode: Bobs27PlayerMode;
  targets: Bobs27Target[];
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface Bobs27PlayerState {
  id: string;
  name: string;
  nickname?: string | null;
  color: string;
  profileId?: string;
  isGuest?: boolean;
  avatarUrl?: string;
  score: number;
  eliminated: boolean;
  lastVisitDelta: number | null;
  lastVisitMissed: boolean;
}

export interface Bobs27HistoryEntry {
  playerIndex: number;
  dart: DartHit;
  revert: Omit<Bobs27GameState, "history">;
}

export interface Bobs27GameState {
  startingScore: number;
  roundCount: number;
  targetTypeId: Bobs27TargetTypeId;
  eliminationEnabled: boolean;
  playerMode: Bobs27PlayerMode;
  targets: Bobs27Target[];
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
  players: Bobs27PlayerState[];
  roundIndex: number;
  roundStarterIndex: number;
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  history: Bobs27HistoryEntry[];
  status: "playing" | "finished";
  winnerId?: string;
  matchId?: string;
}
