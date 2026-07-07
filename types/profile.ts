import type { PracticeDrillId, PracticeGameId } from "@/types/practice";

export type ThrowingHand = "right" | "left";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "pro";

export type PreferredGame = "501" | "301" | "701" | "cricket";

export type FavoritePractice =
  | PracticeGameId
  | Extract<
      PracticeDrillId,
      "round-the-clock-singles" | "round-the-clock-doubles" | "round-the-clock-trebles"
    >;

export type DefaultMatch = "501-double-out" | "301-double-out" | "701-double-out" | "cricket";

export interface ProfilePreferences {
  throwingHand: ThrowingHand | null;
  skillLevel: SkillLevel | null;
  preferredGame: PreferredGame | null;
  homeLeague: string | null;
  favoriteDouble: string | null;
  favoritePractice: FavoritePractice | null;
  defaultMatch: DefaultMatch | null;
}

export type ProfileAchievementIcon = "trophy" | "target" | "flame" | "cricket" | "bull";

export type ProfileActivityIcon = "target" | "loss" | "trophy" | "flame";

export interface ProfileAchievement {
  id: string;
  icon: ProfileAchievementIcon;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface ProfileActivityItem {
  id: string;
  icon: ProfileActivityIcon;
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface ProfileCareerSnapshot {
  threeDartAverage: number;
  firstNineAverage: number;
  firstTwelveAverage: number;
  firstFifteenAverage: number;
  checkoutPercent: number;
  highFinish: number;
  avgFinish: number;
  bestGame: number;
  topRecord: {
    wins: number;
    losses: number;
  };
}
