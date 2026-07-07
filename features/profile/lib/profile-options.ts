import { getFavoritePracticeOptions } from "@/features/practice/lib/practice-routines";
import type {
  DefaultMatch,
  FavoritePractice,
  PreferredGame,
  SkillLevel,
  ThrowingHand,
} from "@/types/profile";
import type { ProfileRow } from "@/lib/supabase/queries/profile";

export const THROWING_HAND_OPTIONS: Array<{ value: ThrowingHand; label: string }> = [
  { value: "right", label: "Right-handed" },
  { value: "left", label: "Left-handed" },
];

export const SKILL_LEVEL_OPTIONS: Array<{ value: SkillLevel; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "pro", label: "Pro" },
];

export const PREFERRED_GAME_OPTIONS: Array<{ value: PreferredGame; label: string }> = [
  { value: "501", label: "501" },
  { value: "301", label: "301" },
  { value: "701", label: "701" },
  { value: "cricket", label: "Cricket" },
];

export const FAVORITE_PRACTICE_OPTIONS: Array<{ value: FavoritePractice; label: string }> =
  getFavoritePracticeOptions().map((option) => ({
    value: option.value as FavoritePractice,
    label: option.label,
  }));

export const DEFAULT_MATCH_OPTIONS: Array<{ value: DefaultMatch; label: string }> = [
  { value: "501-double-out", label: "501 Double Out" },
  { value: "301-double-out", label: "301 Double Out" },
  { value: "701-double-out", label: "701 Double Out" },
  { value: "cricket", label: "Cricket" },
];

export const FAVORITE_DOUBLE_OPTIONS = [
  ...Array.from({ length: 20 }, (_, index) => `D${index + 1}`),
  "Bull",
] as const;

const LEGACY_FAVORITE_PRACTICE_IDS: Record<string, FavoritePractice> = {
  "three-dart-checkout": "three-dart-checkout-challenge",
  "treble-20": "treble-20-only",
};

export function normalizeFavoritePractice(
  value: string | null | undefined,
): FavoritePractice | null {
  if (!value) {
    return null;
  }

  return LEGACY_FAVORITE_PRACTICE_IDS[value] ?? (value as FavoritePractice);
}

export function formatThrowingHand(value: ThrowingHand | null | undefined) {
  return THROWING_HAND_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export function formatSkillLevel(value: SkillLevel | null | undefined) {
  return SKILL_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export function formatPreferredGame(value: PreferredGame | null | undefined) {
  return PREFERRED_GAME_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export function formatFavoritePractice(value: FavoritePractice | string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = normalizeFavoritePractice(value);
  return (
    FAVORITE_PRACTICE_OPTIONS.find((option) => option.value === normalized)?.label ??
    FAVORITE_PRACTICE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function formatDefaultMatch(value: DefaultMatch | null | undefined) {
  return DEFAULT_MATCH_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export function formatMemberSince(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function mapProfileRowToPreferences(profile: ProfileRow) {
  return {
    displayName: profile.display_name,
    nickname: profile.nickname,
    throwingHand: profile.throwing_hand as ThrowingHand | null,
    skillLevel: profile.skill_level as SkillLevel | null,
    preferredGame: profile.preferred_game as PreferredGame | null,
    homeLeague: profile.home_league,
    favoriteDouble: profile.favorite_double,
    favoritePractice: normalizeFavoritePractice(profile.favorite_practice),
    defaultMatch: profile.default_match as DefaultMatch | null,
    memberSince: profile.created_at,
  };
}
