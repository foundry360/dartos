export type PracticeTargetCategory = "singles" | "doubles" | "trebles" | "bulls";

export type Treble20DartLimit = 30 | 60 | 90;

export type Treble20OnlyGameId =
  | "treble-20-only-30"
  | "treble-20-only-60"
  | "treble-20-only-90";

export type PracticeDrillId =
  | "round-the-clock-singles"
  | "round-the-clock-doubles"
  | "round-the-clock-trebles"
  | "scoring-99"
  | "big-fish"
  | "random-singles"
  | "random-doubles"
  | "random-trebles"
  | "treble-20-only"
  | "consecutive-singles"
  | "consecutive-doubles"
  | "consecutive-trebles"
  | "25-bull-challenge"
  | "consecutive-bulls"
  | "random-checkout"
  | "three-dart-checkout-challenge"
  | "doubles-checkout";

export type Scoring99RoundCount = 10 | 20;

export type Scoring99SessionGameId = "scoring-99-10" | "scoring-99-20";

export type ScoringPracticeGameId = "scoring-99" | "big-fish";

export type CheckoutGameId =
  | "random-checkout"
  | "three-dart-checkout-challenge"
  | "doubles-checkout";

export type TimedPracticeMinutes = 5 | 10 | 15;

export type TimedPracticeGameId = "timed-5-minute" | "timed-10-minute" | "timed-15-minute";

export type PracticeGameId =
  | "round-the-clock"
  | "scoring-99"
  | Scoring99SessionGameId
  | "big-fish"
  | "random-singles"
  | "random-doubles"
  | "random-trebles"
  | "treble-20-only"
  | Treble20OnlyGameId
  | "consecutive-singles"
  | "consecutive-doubles"
  | "consecutive-trebles"
  | "25-bull-challenge"
  | "consecutive-bulls"
  | "random-checkout"
  | "three-dart-checkout-challenge"
  | "doubles-checkout"
  | TimedPracticeGameId;

export type PracticeSetupRoutine =
  | {
      category: "target";
      targetCategory: PracticeTargetCategory;
    }
  | {
      category: "scoring-practice";
      game: ScoringPracticeGameId;
    }
  | {
      category: "checkout";
      game: CheckoutGameId;
    }
  | {
      category: "timed";
    };

export type PracticeRoutine =
  | {
      category: "drill";
      drill: PracticeDrillId;
    }
  | {
      category: "timed";
      minutes: TimedPracticeMinutes;
    };

export interface PracticeSetup {
  routine: PracticeSetupRoutine;
}

export interface PracticeSessionState {
  setup: PracticeSetup;
  /** Selected on the dartboard screen for drill sessions. */
  activeGame: PracticeGameId | null;
  startedAt: string;
  /** Remaining seconds for timed practice; null when not timed. */
  remainingSeconds: number | null;
}
