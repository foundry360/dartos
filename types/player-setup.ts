import type { CricketStartingPlayerRule } from "@/types/cricket";
import type { CricketVariant } from "@/lib/constants";

export type PlayerSlotSource = "guest" | "profile";

export interface PlayerSetupSlot {
  id: string;
  name: string;
  nickname?: string | null;
  source: PlayerSlotSource;
  profileId?: string;
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
  startingPlayerRule: CricketStartingPlayerRule;
  players: PlayerSetupSlot[];
  coinTossStarterIndex?: number;
}

export interface SavedPlayerProfile {
  id: string;
  name: string;
  nickname: string | null;
  color: string | null;
  avatarUrl?: string | null;
  isAccountOwner?: boolean;
}
