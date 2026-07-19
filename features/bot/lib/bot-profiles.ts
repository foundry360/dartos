import type { BotDifficultyId, BotProfile } from "@/types/bot";

export const BOT_PROFILES: BotProfile[] = [
  {
    id: "beginner",
    label: "Beginner",
    displayName: "Beginner Bot",
    description: "Loose grouping with frequent misses.",
    targetThreeDartAverage: 28,
    accuracy: 0.22,
    missRate: 0.22,
  },
  {
    id: "novice",
    label: "Novice",
    displayName: "Novice Bot",
    description: "Inconsistent scoring and rare checkouts.",
    targetThreeDartAverage: 38,
    accuracy: 0.3,
    missRate: 0.18,
  },
  {
    id: "casual",
    label: "Casual",
    displayName: "Casual Bot",
    description: "Steady singles play with occasional T20s.",
    targetThreeDartAverage: 48,
    accuracy: 0.4,
    missRate: 0.14,
  },
  {
    id: "pub",
    label: "Pub",
    displayName: "Pub Bot",
    description: "Reliable pub-league scoring and basic finishes.",
    targetThreeDartAverage: 58,
    accuracy: 0.48,
    missRate: 0.11,
  },
  {
    id: "club",
    label: "Club",
    displayName: "Club Bot",
    description: "Strong T20 scoring with regular checkouts.",
    targetThreeDartAverage: 68,
    accuracy: 0.56,
    missRate: 0.08,
  },
  {
    id: "advanced",
    label: "Advanced",
    displayName: "Advanced Bot",
    description: "County-level consistency and confident finishes.",
    targetThreeDartAverage: 78,
    accuracy: 0.64,
    missRate: 0.06,
  },
  {
    id: "pro",
    label: "Pro",
    displayName: "Pro Bot",
    description: "Tour-style scoring with sharp checkout pressure.",
    targetThreeDartAverage: 88,
    accuracy: 0.74,
    missRate: 0.04,
  },
];

export const DEFAULT_BOT_DIFFICULTY_ID: BotDifficultyId = "beginner";

export function getBotProfile(difficultyId: BotDifficultyId | undefined): BotProfile {
  return (
    BOT_PROFILES.find((profile) => profile.id === difficultyId) ??
    BOT_PROFILES.find((profile) => profile.id === DEFAULT_BOT_DIFFICULTY_ID)!
  );
}

export const BOT_DIFFICULTY_OPTIONS = BOT_PROFILES.map((profile) => ({
  value: profile.id,
  label: profile.label,
}));

export function isBotDifficultyId(value: string): value is BotDifficultyId {
  return BOT_PROFILES.some((profile) => profile.id === value);
}

const BOT_DISPLAY_NAMES = new Set(BOT_PROFILES.map((profile) => profile.displayName));

export function isBotDisplayName(name: string): boolean {
  return BOT_DISPLAY_NAMES.has(name.trim());
}

export function getBotDisplayNames(): string[] {
  return BOT_PROFILES.map((profile) => profile.displayName);
}
