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
  | "big-fish-10"
  | "big-fish-20"
  | "big-fish-ladder"
  | "random-singles"
  | "random-doubles"
  | "random-trebles"
  | "treble-20-only"
  | "consecutive-singles"
  | "consecutive-doubles"
  | "consecutive-trebles"
  | "25-bull-challenge"
  | "bull-count"
  | "consecutive-bulls"
  | "consecutive-bulls-3"
  | "consecutive-bulls-5"
  | "consecutive-bulls-10"
  | "random-checkout"
  | "three-dart-checkout-challenge"
  | "three-dart-checkout-10"
  | "three-dart-checkout-20"
  | "three-dart-checkout-50";

export type Scoring99RoundCount = 10 | 20;

export type Scoring99SessionGameId = "scoring-99-10" | "scoring-99-20";

export type BigFishRoundCount = 10 | 20;

export type BigFishSessionGameId = "big-fish-10" | "big-fish-20" | "big-fish-ladder";

export type ConsecutiveBullsStreakTarget = 3 | 5 | 10;

export type ConsecutiveBullsSessionGameId =
  | "consecutive-bulls-3"
  | "consecutive-bulls-5"
  | "consecutive-bulls-10";

export type ScoringPracticeGameId = "scoring-99" | "big-fish";

export type RandomCheckoutRangeId = "2-40" | "41-80" | "81-120" | "121-170" | "full";

export type RandomCheckoutAttemptCount = 10 | 20 | 50;

export type PracticeCheckoutOutRule = "double_out" | "master_out";

export interface RandomCheckoutSessionConfig {
  range: RandomCheckoutRangeId;
  attempts: RandomCheckoutAttemptCount;
  outRule: PracticeCheckoutOutRule;
}

export type ThreeDartCheckoutAttemptCount = RandomCheckoutAttemptCount;

export type ThreeDartCheckoutSessionGameId =
  | "three-dart-checkout-10"
  | "three-dart-checkout-20"
  | "three-dart-checkout-50";

export type CheckoutGameId =
  | "random-checkout"
  | "three-dart-checkout-challenge";

export type TimedPracticeMinutes = 5 | 10 | 15;

export type TimedPracticeGameId = "timed-5-minute" | "timed-10-minute" | "timed-15-minute";

export type PracticeGameId =
  | "round-the-clock"
  | "scoring-99"
  | Scoring99SessionGameId
  | "big-fish"
  | BigFishSessionGameId
  | "random-singles"
  | "random-doubles"
  | "random-trebles"
  | "treble-20-only"
  | Treble20OnlyGameId
  | "consecutive-singles"
  | "consecutive-doubles"
  | "consecutive-trebles"
  | "25-bull-challenge"
  | "bull-count"
  | "consecutive-bulls"
  | "consecutive-bulls-3"
  | "consecutive-bulls-5"
  | "consecutive-bulls-10"
  | "random-checkout"
  | "three-dart-checkout-challenge"
  | "three-dart-checkout-10"
  | "three-dart-checkout-20"
  | "three-dart-checkout-50"
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
  /** Random checkout options chosen on the play screen. */
  randomCheckoutConfig: RandomCheckoutSessionConfig | null;
  startedAt: string;
  /** Remaining seconds for timed practice; null when not timed. */
  remainingSeconds: number | null;
}
