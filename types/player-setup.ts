import type { CricketStartingPlayerRule } from "@/types/cricket";
import type { BotDifficultyId } from "@/types/bot";
import type { CricketVariant, X01GameType } from "@/lib/constants";
import type { X01InRule, X01OutRule } from "@/types/x01";

export type PlayerSlotSource = "guest" | "profile" | "bot";

export type MatchStartingPlayerRule = CricketStartingPlayerRule;

export type MatchTeamNames = readonly [string, string];

export interface PlayerSetupSlot {
  id: string;
  name: string;
  nickname?: string | null;
  source: PlayerSlotSource;
  profileId?: string;
  botDifficultyId?: BotDifficultyId;
  color?: string;
  avatarUrl?: string;
  teamId: number;
  filled?: boolean;
}

export interface CricketMatchSetup {
  variant: CricketVariant;
  legsToWin: number;
  setsToWin: number;
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface X01MatchSetup {
  gameType: X01GameType;
  legsToWin: number;
  setsToWin: number;
  teamsEnabled: boolean;
  teamNames: MatchTeamNames;
  startingPlayerRule: MatchStartingPlayerRule;
  inRule: X01InRule;
  outRule: X01OutRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
  isBotMatch?: boolean;
}

export interface SavedPlayerProfile {
  id: string;
  name: string;
  nickname: string | null;
  color: string | null;
  avatarUrl?: string | null;
  isAccountOwner?: boolean;
}
