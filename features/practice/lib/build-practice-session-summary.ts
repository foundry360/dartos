import {
  computeBullChallengeStats,
  BULL_CHALLENGE_TARGET,
} from "@/features/practice/lib/bull-challenge";
import { computeBullCountStats, getBullCountPercentage } from "@/features/practice/lib/bull-count";
import { isConsecutiveBullsSessionGame } from "@/features/practice/lib/consecutive-bulls";
import {
  getPracticeRoutineTitle,
  resolvePracticeRoutine,
} from "@/features/practice/lib/practice-routines";
import {
  buildRoundTheClockSequence,
  getSequentialTargetMode,
  isSequentialTargetGame,
} from "@/features/practice/lib/round-the-clock";
import {
  computeTreble20Stats,
  getTreble20AverageScorePerDart,
  getTreble20HitPercentage,
} from "@/features/practice/lib/treble-20-only";
import type {
  PracticeCompletionState,
  PracticeSessionHistoryEntry,
  PracticeSessionSnapshot,
} from "@/types/practice-stats";
import type { PracticeGameId } from "@/types/practice";

function resolveCompletedDrillId(
  snapshot: PracticeSessionSnapshot,
  completion: PracticeCompletionState,
): PracticeGameId | null {
  if (completion.timedOut && snapshot.timedActiveGame) {
    return snapshot.timedActiveGame;
  }

  if (!snapshot.activeGame) {
    return null;
  }

  if (completion.bullChallengeComplete) {
    return snapshot.activeGame;
  }

  if (completion.bullCountComplete) {
    return snapshot.activeGame;
  }

  if (completion.treble20Complete) {
    return snapshot.activeGame;
  }

  if (completion.scoring99Complete) {
    return snapshot.activeGame;
  }

  if (completion.bigFishComplete) {
    return snapshot.activeGame;
  }

  if (completion.randomCheckoutComplete) {
    return snapshot.activeGame;
  }

  if (completion.threeDartCheckoutComplete) {
    return snapshot.activeGame;
  }

  if (completion.targetPracticeComplete && isSequentialTargetGame(snapshot.activeGame)) {
    return snapshot.activeGame;
  }

  return null;
}

export function isPracticeDrillCompleted(completion: PracticeCompletionState): boolean {
  return (
    completion.bullChallengeComplete ||
    completion.bullCountComplete ||
    completion.treble20Complete ||
    completion.scoring99Complete ||
    completion.bigFishComplete ||
    completion.randomCheckoutComplete ||
    completion.threeDartCheckoutComplete ||
    completion.targetPracticeComplete ||
    completion.timedOut
  );
}

export function buildPracticeSessionHistoryEntry(
  snapshot: PracticeSessionSnapshot,
  completion: PracticeCompletionState,
): PracticeSessionHistoryEntry | null {
  const drillId = resolveCompletedDrillId(snapshot, completion);

  if (!drillId) {
    return null;
  }

  const routine = resolvePracticeRoutine(snapshot.setup, snapshot.activeGame);
  if (!routine) {
    return null;
  }

  const drillTitle = getPracticeRoutineTitle(
    routine,
    snapshot.activeGame,
    snapshot.randomCheckoutConfig,
  );
  const completedAt = new Date().toISOString();
  const config: Record<string, unknown> = {};

  if (snapshot.randomCheckoutConfig) {
    config.randomCheckout = snapshot.randomCheckoutConfig;
  }

  let dartsThrown = snapshot.history.length;
  let successes: number | null = null;
  let attempts: number | null = null;
  let durationSeconds: number | null = null;
  const metadata: Record<string, unknown> = {};

  if (completion.timedOut && snapshot.timedDurationSeconds != null) {
    durationSeconds = snapshot.timedDurationSeconds;
    metadata.timedPractice = true;
  }

  if (completion.bullChallengeComplete) {
    const stats = computeBullChallengeStats(snapshot.history);
    dartsThrown = stats.dartsThrown;
    successes = stats.bullsHit;
    attempts = BULL_CHALLENGE_TARGET;
    durationSeconds = snapshot.completedElapsedSeconds ?? snapshot.elapsedSeconds;
    metadata.bullChallenge = stats;
  } else if (completion.bullCountComplete) {
    const stats = computeBullCountStats(snapshot.history);
    dartsThrown = stats.dartsThrown;
    successes = stats.bullsHit;
    attempts = stats.dartsThrown;
    metadata.bullCount = {
      ...stats,
      bullPercentage: getBullCountPercentage(stats.bullsHit, stats.dartsThrown),
    };
  } else if (completion.treble20Complete) {
    const stats = computeTreble20Stats(snapshot.history);
    dartsThrown = stats.dartsThrown;
    successes = stats.t20Hits;
    attempts = stats.dartsThrown;
    metadata.treble20 = {
      ...stats,
      hitPercentage: getTreble20HitPercentage(stats),
      averageScorePerDart: getTreble20AverageScorePerDart(stats),
    };
  } else if (completion.scoring99Complete) {
    dartsThrown = snapshot.history.length;
    successes = snapshot.scoring99Successes;
    attempts = snapshot.scoring99VisitsCompleted;
    metadata.scoring99 = {
      successes: snapshot.scoring99Successes,
      visitsCompleted: snapshot.scoring99VisitsCompleted,
    };
  } else if (completion.bigFishComplete) {
    dartsThrown = snapshot.history.length;
    successes = snapshot.bigFishSuccesses;
    attempts = snapshot.bigFishVisitsCompleted;
    metadata.bigFish = {
      successes: snapshot.bigFishSuccesses,
      visitsCompleted: snapshot.bigFishVisitsCompleted,
      ladderRungsCompleted: snapshot.bigFishLadderRungIndex,
    };
  } else if (completion.randomCheckoutComplete) {
    dartsThrown = snapshot.history.length;
    successes = snapshot.randomCheckoutSuccesses;
    attempts = snapshot.randomCheckoutAttemptsCompleted;
    metadata.randomCheckout = {
      successes: snapshot.randomCheckoutSuccesses,
      attemptsCompleted: snapshot.randomCheckoutAttemptsCompleted,
    };
  } else if (completion.threeDartCheckoutComplete) {
    dartsThrown = snapshot.history.length;
    successes = snapshot.threeDartCheckoutSuccesses;
    attempts = snapshot.threeDartCheckoutAttemptsCompleted;
    metadata.threeDartCheckout = {
      successes: snapshot.threeDartCheckoutSuccesses,
      attemptsCompleted: snapshot.threeDartCheckoutAttemptsCompleted,
    };
  } else if (completion.targetPracticeComplete && snapshot.activeGame) {
    const sequentialMode = getSequentialTargetMode(snapshot.setup.routine, snapshot.activeGame);

    if (sequentialMode) {
      const targetCount = buildRoundTheClockSequence(sequentialMode).length;
      dartsThrown = snapshot.history.length;
      successes = snapshot.targetIndex;
      attempts = targetCount;
      metadata.roundTheClock = {
        targetsCompleted: snapshot.targetIndex,
        targetCount,
        dartsThrown,
      };
    }
  }

  if (isConsecutiveBullsSessionGame(snapshot.activeGame)) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    drillId,
    drillTitle,
    config,
    startedAt: snapshot.startedAt,
    completedAt,
    dartsThrown,
    successes,
    attempts,
    durationSeconds,
    metadata,
  };
}
