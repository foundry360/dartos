import type {
  PracticeDrillId,
  PracticeGameId,
  PracticeRoutine,
  PracticeSetup,
  PracticeSetupRoutine,
  PracticeTargetCategory,
  ScoringPracticeGameId,
  CheckoutGameId,
  TimedPracticeGameId,
  TimedPracticeMinutes,
} from "@/types/practice";
import {
  getScoring99RoundCount,
  isScoring99BaseGame,
  isScoring99SessionGame,
} from "@/features/practice/lib/scoring-99";
import {
  getTreble20DartLimit,
  isTreble20OnlyBaseGame,
  isTreble20OnlySessionGame,
} from "@/features/practice/lib/treble-20-only";

export interface PracticeGameDefinition {
  id: PracticeGameId;
  label: string;
  description: string;
}

export const PRACTICE_TARGET_CATEGORIES: {
  id: PracticeTargetCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "singles",
    label: "Singles",
    description: "Practice single-segment targets and scoring routines.",
  },
  {
    id: "doubles",
    label: "Doubles",
    description: "Practice double segment targets.",
  },
  {
    id: "trebles",
    label: "Trebles",
    description: "Practice treble segment targets.",
  },
  {
    id: "bulls",
    label: "Bulls",
    description: "Practice bull scoring and bull-only challenges.",
  },
];

export const PRACTICE_GAMES_BY_TARGET: Record<
  PracticeTargetCategory,
  PracticeGameDefinition[]
> = {
  singles: [
    {
      id: "round-the-clock",
      label: "Round the Clock",
      description: "Hit every number in order from 1 to 20, then bull, singles only.",
    },
    {
      id: "consecutive-singles",
      label: "3 In a Row Singles",
      description: "Hit the same single three times in a row, then move to a new random single.",
    },
    {
      id: "random-singles",
      label: "Random Singles",
      description: "Hit random single targets as they are called.",
    },
  ],
  doubles: [
    {
      id: "round-the-clock",
      label: "Round the Clock",
      description: "Hit every double in order from 1 to 20, then bull.",
    },
    {
      id: "consecutive-doubles",
      label: "3 In a Row Doubles",
      description: "Hit the same double three times in a row, then move to a new random double.",
    },
    {
      id: "random-doubles",
      label: "Random Doubles",
      description: "Hit random double targets as they are called.",
    },
  ],
  trebles: [
    {
      id: "round-the-clock",
      label: "Round the Clock",
      description: "Hit every treble in order from 1 to 20.",
    },
    {
      id: "consecutive-trebles",
      label: "3 In a Row Trebles",
      description: "Hit the same treble three times in a row, then move to a new random treble.",
    },
    {
      id: "random-trebles",
      label: "Random Trebles",
      description: "Hit random treble targets as they are called.",
    },
    {
      id: "treble-20-only",
      label: "Treble 20 Only",
      description: "Throw at treble 20 for 30, 60, or 90 darts and track your accuracy.",
    },
  ],
  bulls: [
    {
      id: "25-bull-challenge",
      label: "25 Bull Challenge",
      description: "Score 25 points using the bull segment.",
    },
    {
      id: "consecutive-bulls",
      label: "Consecutive Bulls",
      description: "Hit consecutive bull targets.",
    },
  ],
};

export const PRACTICE_TREBLE_20_DART_LIMITS: PracticeGameDefinition[] = [
  {
    id: "treble-20-only-30",
    label: "30 darts",
    description: "Throw 30 darts at treble 20.",
  },
  {
    id: "treble-20-only-60",
    label: "60 darts",
    description: "Throw 60 darts at treble 20.",
  },
  {
    id: "treble-20-only-90",
    label: "90 darts",
    description: "Throw 90 darts at treble 20.",
  },
];

export const PRACTICE_SCORING_99_ROUND_OPTIONS: PracticeGameDefinition[] = [
  {
    id: "scoring-99-10",
    label: "10 sessions",
    description: "Ten independent sessions with a random 3-dart sequence to score exactly 99.",
  },
  {
    id: "scoring-99-20",
    label: "20 sessions",
    description: "Twenty independent sessions with a random 3-dart sequence to score exactly 99.",
  },
];

export const SCORING_PRACTICE_DESCRIPTION =
  "Practice scoring targets and point-building routines.";

export const PRACTICE_SCORING_GAMES: PracticeGameDefinition[] = [
  {
    id: "scoring-99",
    label: "Scoring 99",
    description: "Score exactly 99 with three darts per session across 10 or 20 sessions.",
  },
  {
    id: "big-fish",
    label: "Big Fish",
    description: "Hit the 170 checkout — treble 20, treble 20, bull.",
  },
];

export const CHECKOUT_DESCRIPTION = "Practice finishing legs from checkout scores.";

export const PRACTICE_CHECKOUT_GAMES: PracticeGameDefinition[] = [
  {
    id: "random-checkout",
    label: "Random Checkout",
    description: "Finish a randomly generated checkout score.",
  },
  {
    id: "three-dart-checkout-challenge",
    label: "3 Dart Checkout Challenge",
    description: "Finish checkout scores using all three darts in the visit.",
  },
  {
    id: "doubles-checkout",
    label: "Doubles Checkout",
    description: "Practice checkouts that finish on a double.",
  },
];

export const TIMED_PRACTICE_DESCRIPTION =
  "Score as many points as you can before the clock runs out.";

export const PRACTICE_TIMED_GAMES: PracticeGameDefinition[] = [
  {
    id: "timed-5-minute",
    label: "5 minute",
    description: "Countdown from 5 minutes.",
  },
  {
    id: "timed-10-minute",
    label: "10 minute",
    description: "Countdown from 10 minutes.",
  },
  {
    id: "timed-15-minute",
    label: "15 minute",
    description: "Countdown from 15 minutes.",
  },
];

const TIMED_GAME_MINUTES: Record<TimedPracticeGameId, TimedPracticeMinutes> = {
  "timed-5-minute": 5,
  "timed-10-minute": 10,
  "timed-15-minute": 15,
};

const ALL_PRACTICE_GAMES: PracticeGameDefinition[] = [
  ...Object.values(PRACTICE_GAMES_BY_TARGET).flat(),
  ...PRACTICE_TREBLE_20_DART_LIMITS,
  ...PRACTICE_SCORING_99_ROUND_OPTIONS,
  ...PRACTICE_SCORING_GAMES,
  ...PRACTICE_CHECKOUT_GAMES,
  ...PRACTICE_TIMED_GAMES,
];

export function getPracticeGamesForSetup(setupRoutine: PracticeSetupRoutine) {
  switch (setupRoutine.category) {
    case "target":
      return PRACTICE_GAMES_BY_TARGET[setupRoutine.targetCategory];
    case "scoring-practice":
      return PRACTICE_SCORING_GAMES;
    case "checkout":
      return PRACTICE_CHECKOUT_GAMES;
    case "timed":
      return PRACTICE_TIMED_GAMES;
  }
}

export function getTimedMinutesForGame(gameId: TimedPracticeGameId): TimedPracticeMinutes {
  return TIMED_GAME_MINUTES[gameId];
}

export function isTimedPracticeGameId(gameId: PracticeGameId): gameId is TimedPracticeGameId {
  return gameId in TIMED_GAME_MINUTES;
}

export function getPracticeGameDefinition(gameId: PracticeGameId) {
  return ALL_PRACTICE_GAMES.find((game) => game.id === gameId);
}

export function getPracticeGameDefinitionForDrill(drillId: PracticeDrillId) {
  const direct = ALL_PRACTICE_GAMES.find((game) => game.id === drillId);
  if (direct) {
    return direct;
  }

  if (drillId === "round-the-clock-singles") {
    return PRACTICE_GAMES_BY_TARGET.singles.find((game) => game.id === "round-the-clock");
  }

  if (drillId === "round-the-clock-doubles") {
    return PRACTICE_GAMES_BY_TARGET.doubles.find((game) => game.id === "round-the-clock");
  }

  if (drillId === "round-the-clock-trebles") {
    return PRACTICE_GAMES_BY_TARGET.trebles.find((game) => game.id === "round-the-clock");
  }

  return undefined;
}

export function getPracticeTargetCategoryLabel(targetCategory: PracticeTargetCategory) {
  return PRACTICE_TARGET_CATEGORIES.find((category) => category.id === targetCategory)?.label ?? targetCategory;
}

export function getPracticeSetupSectionLabel(setupRoutine: PracticeSetupRoutine) {
  switch (setupRoutine.category) {
    case "target":
      return getPracticeTargetCategoryLabel(setupRoutine.targetCategory);
    case "scoring-practice":
      return "Scoring Practice";
    case "checkout":
      return "Checkout";
    case "timed":
      return "Timed Practice";
  }
}

export function resolvePracticeDrillId(
  setupRoutine: PracticeSetupRoutine,
  gameId: PracticeGameId,
): PracticeDrillId {
  if (setupRoutine.category === "target" && gameId === "round-the-clock") {
    switch (setupRoutine.targetCategory) {
      case "doubles":
        return "round-the-clock-doubles";
      case "trebles":
        return "round-the-clock-trebles";
      default:
        return "round-the-clock-singles";
    }
  }

  if (isTreble20OnlySessionGame(gameId)) {
    return "treble-20-only";
  }

  if (isScoring99SessionGame(gameId)) {
    return "scoring-99";
  }

  return gameId as PracticeDrillId;
}

export function resolvePracticeRoutine(
  setup: PracticeSetup,
  activeGame: PracticeGameId | null,
): PracticeRoutine | null {
  if (setup.routine.category === "timed") {
    if (!activeGame || !isTimedPracticeGameId(activeGame)) {
      return null;
    }

    return {
      category: "timed",
      minutes: getTimedMinutesForGame(activeGame),
    };
  }

  if (!activeGame) {
    return null;
  }

  return {
    category: "drill",
    drill: resolvePracticeDrillId(setup.routine, activeGame),
  };
}

export function getPracticeRoutineTitle(
  routine: PracticeRoutine,
  activeGame: PracticeGameId | null = null,
) {
  switch (routine.category) {
    case "drill": {
      const baseLabel =
        getPracticeGameDefinitionForDrill(routine.drill)?.label ?? routine.drill;

      if (routine.drill === "treble-20-only" && isTreble20OnlySessionGame(activeGame)) {
        return `${baseLabel} · ${getTreble20DartLimit(activeGame)} darts`;
      }

      if (routine.drill === "scoring-99" && isScoring99SessionGame(activeGame)) {
        return `${baseLabel} · ${getScoring99RoundCount(activeGame)} sessions`;
      }

      return baseLabel;
    }
    case "timed":
      return `Timed Practice · ${routine.minutes} minute`;
  }
}

export function getPracticeRoutineDescription(routine: PracticeRoutine) {
  switch (routine.category) {
    case "drill":
      return getPracticeGameDefinitionForDrill(routine.drill)?.description ?? "";
    case "timed":
      return `Countdown from ${routine.minutes} minutes. ${TIMED_PRACTICE_DESCRIPTION}`;
  }
}

export function getTimedPracticeSecondsForGame(gameId: TimedPracticeGameId) {
  return getTimedMinutesForGame(gameId) * 60;
}

export function getInitialActiveGame(setup: PracticeSetup): PracticeGameId | null {
  switch (setup.routine.category) {
    case "scoring-practice":
    case "checkout":
      return setup.routine.game;
    case "target":
    case "timed":
      return null;
  }
}

export function buildTargetSetup(targetCategory: PracticeTargetCategory) {
  return { routine: { category: "target" as const, targetCategory } };
}

export function buildScoringPracticeSetup(game: ScoringPracticeGameId) {
  return { routine: { category: "scoring-practice" as const, game } };
}

export function buildCheckoutSetup(game: CheckoutGameId) {
  return { routine: { category: "checkout" as const, game } };
}

export function buildTimedSetup() {
  return { routine: { category: "timed" as const } };
}

export function needsPracticeGamePicker(setupRoutine: PracticeSetupRoutine) {
  return setupRoutine.category === "target" || setupRoutine.category === "timed";
}

export function isPracticeSessionReady(
  setupRoutine: PracticeSetupRoutine,
  activeGame: PracticeGameId | null,
  remainingSeconds: number | null,
) {
  if (!activeGame) {
    return false;
  }

  if (isTreble20OnlyBaseGame(activeGame)) {
    return false;
  }

  if (isScoring99BaseGame(activeGame)) {
    return false;
  }

  if (setupRoutine.category === "timed") {
    return remainingSeconds != null;
  }

  return true;
}
