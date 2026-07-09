import type { PracticeGameId, PracticeSetup, RandomCheckoutSessionConfig } from "@/types/practice";
import type { DartHit } from "@/types/dart";

export interface PracticeSessionHistoryEntry {
  id: string;
  drillId: string;
  drillTitle: string;
  config: Record<string, unknown>;
  startedAt: string;
  completedAt: string;
  dartsThrown: number;
  successes: number | null;
  attempts: number | null;
  durationSeconds: number | null;
  metadata: Record<string, unknown>;
}

export interface PracticeSessionSnapshot {
  setup: PracticeSetup;
  activeGame: PracticeGameId | null;
  randomCheckoutConfig: RandomCheckoutSessionConfig | null;
  startedAt: string;
  history: DartHit[];
  targetsHit: number;
  targetIndex: number;
  scoring99Successes: number;
  scoring99VisitsCompleted: number;
  bigFishSuccesses: number;
  bigFishVisitsCompleted: number;
  bigFishLadderRungIndex: number;
  randomCheckoutSuccesses: number;
  randomCheckoutAttemptsCompleted: number;
  threeDartCheckoutSuccesses: number;
  threeDartCheckoutAttemptsCompleted: number;
  bullsHit: number;
  completedElapsedSeconds: number | null;
  elapsedSeconds: number;
  timedActiveGame: PracticeGameId | null;
  timedDurationSeconds: number | null;
}

export interface PracticeCompletionState {
  bullChallengeComplete: boolean;
  bullCountComplete: boolean;
  treble20Complete: boolean;
  scoring99Complete: boolean;
  bigFishComplete: boolean;
  randomCheckoutComplete: boolean;
  threeDartCheckoutComplete: boolean;
  targetPracticeComplete: boolean;
  timedOut: boolean;
}
