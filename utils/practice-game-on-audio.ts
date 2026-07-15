import {
  buildPracticeGameOnClipPath,
  buildPracticeGameOnPhrase,
} from "@/lib/practice-game-on-callouts";
import {
  PRACTICE_BIG_FISH_ROUND_OPTIONS,
  PRACTICE_CHECKOUT_GAMES,
  PRACTICE_CONSECUTIVE_BULLS_OPTIONS,
  PRACTICE_GAMES_BY_TARGET,
  PRACTICE_SCORING_99_ROUND_OPTIONS,
  PRACTICE_SCORING_GAMES,
  PRACTICE_TARGET_CATEGORIES,
  PRACTICE_TIMED_GAMES,
  PRACTICE_TREBLE_20_DART_LIMITS,
  getPracticeRoutineTitle,
  getTimedPracticeSecondsForGame,
  isPracticeSessionReady,
  resolvePracticeRoutine,
} from "@/features/practice/lib/practice-routines";
import {
  getBigFishRoundCount,
  isBigFishLadderGame,
  isBigFishRandomSessionGame,
} from "@/features/practice/lib/big-fish";
import {
  getConsecutiveBullsStreakTarget,
  isConsecutiveBullsSessionGame,
} from "@/features/practice/lib/consecutive-bulls";
import {
  getRandomCheckoutSessionLabel,
  RANDOM_CHECKOUT_ATTEMPT_OPTIONS,
  RANDOM_CHECKOUT_OUT_RULE_OPTIONS,
  RANDOM_CHECKOUT_RANGE_OPTIONS,
} from "@/features/practice/lib/random-checkout";
import { getScoring99RoundCount, isScoring99SessionGame } from "@/features/practice/lib/scoring-99";
import { getTreble20DartLimit, isTreble20OnlySessionGame } from "@/features/practice/lib/treble-20-only";
import type {
  PracticeGameId,
  PracticeSetup,
  RandomCheckoutSessionConfig,
  TimedPracticeGameId,
} from "@/types/practice";
import {
  parseLegacySoundClipPath,
  playCommentaryClip,
  prefetchLegacyClipPath,
} from "@/utils/commentary-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { unlockVoicePlayback } from "@/utils/voice-playback";

let lastAnnouncedKey: string | null = null;
let announceInFlightKey: string | null = null;

export function resolvePracticeGameOnTitle(
  setup: PracticeSetup,
  activeGame: PracticeGameId | null,
  options?: {
    remainingSeconds?: number | null;
    randomCheckoutConfig?: RandomCheckoutSessionConfig | null;
  },
): string | null {
  const remainingSeconds = options?.remainingSeconds ?? null;
  const randomCheckoutConfig = options?.randomCheckoutConfig ?? null;

  if (
    !isPracticeSessionReady(
      setup.routine,
      activeGame,
      remainingSeconds,
      randomCheckoutConfig,
    )
  ) {
    return null;
  }

  const routine = resolvePracticeRoutine(setup, activeGame);
  if (!routine) {
    return null;
  }

  return getPracticeRoutineTitle(routine, activeGame, randomCheckoutConfig);
}

/** Every Game On title practice may announce (including picker variants). */
export function listAllPracticeGameOnTitles(): string[] {
  const titles = new Set<string>();

  for (const category of PRACTICE_TARGET_CATEGORIES) {
    for (const game of PRACTICE_GAMES_BY_TARGET[category.id]) {
      if (game.id === "round-the-clock") {
        if (category.id === "singles") {
          titles.add("Around the Clock · Singles");
        } else if (category.id === "doubles") {
          titles.add("Around the Clock · Doubles");
        } else if (category.id === "trebles") {
          titles.add("Around the Clock · Trebles");
        }
        continue;
      }

      titles.add(game.label);
    }
  }

  for (const game of PRACTICE_SCORING_GAMES) {
    titles.add(game.label);
  }

  for (const game of PRACTICE_CHECKOUT_GAMES) {
    titles.add(game.label);
  }

  for (const limit of PRACTICE_TREBLE_20_DART_LIMITS) {
    if (isTreble20OnlySessionGame(limit.id)) {
      titles.add(`Treble 20 Only · ${getTreble20DartLimit(limit.id)} darts`);
    }
  }

  for (const option of PRACTICE_SCORING_99_ROUND_OPTIONS) {
    if (isScoring99SessionGame(option.id)) {
      titles.add(`Scoring 99 · ${getScoring99RoundCount(option.id)} visits`);
    }
  }

  for (const option of PRACTICE_BIG_FISH_ROUND_OPTIONS) {
    if (isBigFishLadderGame(option.id)) {
      titles.add("Big Fish · Ladder");
    } else if (isBigFishRandomSessionGame(option.id)) {
      titles.add(`Big Fish · ${getBigFishRoundCount(option.id)} visits`);
    }
  }

  for (const option of PRACTICE_CONSECUTIVE_BULLS_OPTIONS) {
    if (isConsecutiveBullsSessionGame(option.id)) {
      titles.add(
        `Consecutive Bulls · ${getConsecutiveBullsStreakTarget(option.id)} in a row`,
      );
    }
  }

  for (const range of RANDOM_CHECKOUT_RANGE_OPTIONS) {
    for (const attempts of RANDOM_CHECKOUT_ATTEMPT_OPTIONS) {
      for (const outRule of RANDOM_CHECKOUT_OUT_RULE_OPTIONS) {
        titles.add(
          `Random Checkout · ${getRandomCheckoutSessionLabel({
            range: range.id,
            attempts,
            outRule: outRule.id,
          })}`,
        );
      }
    }
  }

  for (const game of PRACTICE_TIMED_GAMES) {
    const minutes = getTimedPracticeSecondsForGame(game.id as TimedPracticeGameId) / 60;
    titles.add(`Timed Practice · ${minutes} minute`);
  }

  return [...titles];
}

export function buildPracticeGameOnAnnounceKey(
  startedAt: string,
  activeGame: PracticeGameId | null,
  title: string,
): string {
  return `${startedAt}:${activeGame ?? ""}:${title}`;
}

export function prefetchPracticeGameOn(gameTitle: string): void {
  prefetchLegacyClipPath(
    buildPracticeGameOnClipPath(gameTitle),
    buildPracticeGameOnPhrase(gameTitle),
  );
}

/** Warm every practice Game On clip into the voice cache (CDN + IndexedDB). */
export function prefetchAllPracticeGameOnClips(): void {
  if (typeof window === "undefined" || !getMatchAudioPreferences().voice) {
    return;
  }

  for (const title of listAllPracticeGameOnTitles()) {
    prefetchPracticeGameOn(title);
  }
}

/**
 * Unlock + play during/after a user gesture. Dedupes so the same session/title only
 * announces once. Playback uses AudioContext when available so iOS does not defer
 * until the next tap (e.g. back).
 */
export async function announcePracticeGameOnFromGesture(
  key: string,
  gameTitle: string,
): Promise<boolean> {
  if (!getMatchAudioPreferences().voice) {
    return false;
  }

  if (lastAnnouncedKey === key || announceInFlightKey === key) {
    return false;
  }

  announceInFlightKey = key;
  prefetchPracticeGameOn(gameTitle);

  try {
    const unlocked = await unlockVoicePlayback();
    if (!unlocked) {
      return false;
    }

    if (lastAnnouncedKey === key) {
      return false;
    }

    const clipPath = buildPracticeGameOnClipPath(gameTitle);
    const phrase = buildPracticeGameOnPhrase(gameTitle);
    const parsed = parseLegacySoundClipPath(clipPath);

    if (!parsed) {
      return false;
    }

    const played = await playCommentaryClip(parsed.category, parsed.slug, phrase);
    if (played) {
      lastAnnouncedKey = key;
    }

    return played;
  } finally {
    if (announceInFlightKey === key) {
      announceInFlightKey = null;
    }
  }
}

export function resetPracticeGameOnAnnounceTracking(): void {
  lastAnnouncedKey = null;
  announceInFlightKey = null;
}
