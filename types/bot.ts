export type BotDifficultyId =
  | "beginner"
  | "novice"
  | "casual"
  | "pub"
  | "club"
  | "advanced"
  | "pro";

export interface BotProfile {
  id: BotDifficultyId;
  label: string;
  displayName: string;
  description: string;
  /** Approximate 501 three-dart average for UI display. */
  targetThreeDartAverage: number;
  /** Probability the dart lands on the intended target. */
  accuracy: number;
  /** Probability of a complete miss (off board). */
  missRate: number;
}
