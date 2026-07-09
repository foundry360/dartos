"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePracticeSessionCompletionRecording } from "@/features/practice/hooks/usePracticeSessionCompletionRecording";
import { useRouter } from "next/navigation";
import { type DartHit } from "@/types/dart";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { PracticePlaySidebar } from "@/features/practice/components/PracticePlaySidebar";
import { PracticeTimedScorecard } from "@/features/practice/components/PracticeTimedScorecard";
import { PracticeRandomCheckoutScorecard } from "@/features/practice/components/PracticeRandomCheckoutScorecard";
import { PracticeThreeDartCheckoutScorecard } from "@/features/practice/components/PracticeThreeDartCheckoutScorecard";
import { PracticeBigFishScorecard } from "@/features/practice/components/PracticeBigFishScorecard";
import { PracticeConsecutiveBullsScorecard } from "@/features/practice/components/PracticeConsecutiveBullsScorecard";
import { PracticeBullCountScorecard } from "@/features/practice/components/PracticeBullCountScorecard";
import { PracticeBullChallengeScorecard } from "@/features/practice/components/PracticeBullChallengeScorecard";
import { PracticeScoring99Scorecard } from "@/features/practice/components/PracticeScoring99Scorecard";
import { PracticeTreble20Scorecard } from "@/features/practice/components/PracticeTreble20Scorecard";
import { PracticeTargetScorecard } from "@/features/practice/components/PracticeTargetScorecard";
import {
  buildRandomCheckoutSequence,
  evaluateRandomCheckoutDart,
  getRandomCheckoutNextPracticeTarget,
  isRandomCheckoutBaseGame,
  isRandomCheckoutConfigured,
  pickRandomCheckoutTarget,
  type RandomCheckoutVisitOutcome,
} from "@/features/practice/lib/random-checkout";
import {
  buildThreeDartCheckoutSequence,
  evaluateThreeDartCheckoutDart,
  getThreeDartCheckoutAttemptCount,
  getThreeDartCheckoutNextPracticeTarget,
  isThreeDartCheckoutBaseGame,
  isThreeDartCheckoutSessionGame,
  pickRandomThreeDartCheckoutTarget,
  type ThreeDartCheckoutVisitOutcome,
} from "@/features/practice/lib/three-dart-checkout";
import type { RandomCheckoutSessionConfig, ThreeDartCheckoutAttemptCount } from "@/types/practice";
import {
  buildBigFishSequence,
  evaluateBigFishDart,
  getBigFishNextPracticeTarget,
  getBigFishLadderRung,
  getBigFishLadderRungCount,
  getBigFishLadderStartingCheckout,
  getBigFishRoundCount,
  isBigFishBaseGame,
  isBigFishLadderGame,
  isBigFishRandomSessionGame,
  isBigFishSessionGame,
  pickRandomBigFishCheckout,
  type BigFishVisitOutcome,
} from "@/features/practice/lib/big-fish";
import {
  getConsecutiveBullsStreakTarget,
  isConsecutiveBullsBaseGame,
  isConsecutiveBullsSessionGame,
  type ConsecutiveBullsStreakTarget,
} from "@/features/practice/lib/consecutive-bulls";
import {
  BULL_COUNT_DART_LIMIT,
  BULL_COUNT_DARTS_PER_VISIT,
  isBullCountGame,
} from "@/features/practice/lib/bull-count";
import {
  BULL_CHALLENGE_TARGET,
  createBullChallengeDartInput,
  isBullChallengeGame,
  isBullChallengeHit,
  type BullChallengeDartInputKind,
} from "@/features/practice/lib/bull-challenge";
import {
  isRandomTargetGame,
  pickRandomTarget,
  type PracticeRandomTarget,
} from "@/features/practice/lib/random-targets";
import {
  buildRoundTheClockSequence,
  getSequentialTargetMode,
  isSequentialTargetGame,
  type PracticeTargetDisplay,
} from "@/features/practice/lib/round-the-clock";
import {
  getScoring99RoundCount,
  getScoring99NextPracticeTarget,
  isScoring99BaseGame,
  isScoring99SessionGame,
  isScoring99SequenceDartMatch,
  pickRandomScoring99Sequence,
  recalculateScoring99SequenceAfterMiss,
  SCORING_99_TARGET,
  type Scoring99Sequence,
} from "@/features/practice/lib/scoring-99";
import {
  isThreeInARowGame,
  pickThreeInARowTarget,
  THREE_IN_A_ROW_REQUIRED,
} from "@/features/practice/lib/three-in-a-row";
import {
  createTreble20DartInput,
  getTreble20DartLimit,
  isTreble20OnlyBaseGame,
  isTreble20OnlySessionGame,
  TREBLE_20_TARGET,
  type Treble20DartInputKind,
} from "@/features/practice/lib/treble-20-only";
import {
  getPracticeGamesForSetup,
  getPracticeRoutineTitle,
  getPracticeSetupSectionLabel,
  getTimedPracticeSecondsForGame,
  isPracticeSessionReady,
  isTimedPracticeGameId,
  needsPracticeGamePicker,
  resolvePracticeRoutine,
} from "@/features/practice/lib/practice-routines";
import { usePracticeStore } from "@/features/practice/store/practice-store";
import { announceHitMissCallout, primeHitMissClips } from "@/utils/hit-miss-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import type { PracticeCompletionState, PracticeSessionSnapshot } from "@/types/practice-stats";

interface PracticeUndoSnapshot {
  visitDarts: DartHit[];
  history: DartHit[];
  dartsAtTarget: number;
  targetIndex: number;
  targetsHit: number;
  randomTarget: PracticeRandomTarget | null;
  threeInARowTarget: PracticeRandomTarget | null;
  threeInARowStreak: number;
  scoring99Visit: number;
  scoring99Successes: number;
  scoring99VisitsCompleted: number;
  scoring99VisitSequence: Scoring99Sequence | null;
  scoring99NoCheckout: boolean;
  bigFishVisit: number;
  bigFishSuccesses: number;
  bigFishVisitsCompleted: number;
  bigFishCheckout: number;
  bigFishLadderRungIndex: number;
  bigFishLastOutcome: BigFishVisitOutcome | null;
  randomCheckoutAttempt: number;
  randomCheckoutSuccesses: number;
  randomCheckoutAttemptsCompleted: number;
  randomCheckoutTarget: number;
  randomCheckoutLastOutcome: RandomCheckoutVisitOutcome | null;
  threeDartCheckoutAttempt: number;
  threeDartCheckoutSuccesses: number;
  threeDartCheckoutAttemptsCompleted: number;
  threeDartCheckoutTarget: number;
  threeDartCheckoutLastOutcome: ThreeDartCheckoutVisitOutcome | null;
  bullsHit: number;
  challengeStartedAt: number | null;
  completedElapsedSeconds: number | null;
  elapsedSeconds: number;
}

export default function PracticePlayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const session = usePracticeStore((state) => state.session);
  const setActiveGame = usePracticeStore((state) => state.setActiveGame);
  const setRemainingSeconds = usePracticeStore((state) => state.setRemainingSeconds);
  const setRandomCheckoutConfig = usePracticeStore((state) => state.setRandomCheckoutConfig);
  const reset = usePracticeStore((state) => state.reset);
  const themePrimaryColor = useActiveBoardThemePrimaryColor();
  const [visitDarts, setVisitDarts] = useState<DartHit[]>([]);
  const [history, setHistory] = useState<DartHit[]>([]);
  const [randomTarget, setRandomTarget] = useState<PracticeRandomTarget | null>(null);
  const [targetsHit, setTargetsHit] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [dartsAtTarget, setDartsAtTarget] = useState(0);
  const [threeInARowTarget, setThreeInARowTarget] = useState<PracticeRandomTarget | null>(null);
  const [threeInARowStreak, setThreeInARowStreak] = useState(0);
  const [scoring99Visit, setScoring99Visit] = useState(1);
  const [scoring99Successes, setScoring99Successes] = useState(0);
  const [scoring99VisitsCompleted, setScoring99VisitsCompleted] = useState(0);
  const [scoring99VisitSequence, setScoring99VisitSequence] =
    useState<Scoring99Sequence | null>(null);
  const [scoring99NoCheckout, setScoring99NoCheckout] = useState(false);
  const [bigFishVisit, setBigFishVisit] = useState(1);
  const [bigFishSuccesses, setBigFishSuccesses] = useState(0);
  const [bigFishVisitsCompleted, setBigFishVisitsCompleted] = useState(0);
  const [bigFishCheckout, setBigFishCheckout] = useState(170);
  const [bigFishLadderRungIndex, setBigFishLadderRungIndex] = useState(0);
  const [bigFishLastOutcome, setBigFishLastOutcome] = useState<BigFishVisitOutcome | null>(null);
  const [randomCheckoutAttempt, setRandomCheckoutAttempt] = useState(1);
  const [randomCheckoutSuccesses, setRandomCheckoutSuccesses] = useState(0);
  const [randomCheckoutAttemptsCompleted, setRandomCheckoutAttemptsCompleted] = useState(0);
  const [randomCheckoutTarget, setRandomCheckoutTarget] = useState(40);
  const [randomCheckoutLastOutcome, setRandomCheckoutLastOutcome] =
    useState<RandomCheckoutVisitOutcome | null>(null);
  const [threeDartCheckoutAttempt, setThreeDartCheckoutAttempt] = useState(1);
  const [threeDartCheckoutSuccesses, setThreeDartCheckoutSuccesses] = useState(0);
  const [threeDartCheckoutAttemptsCompleted, setThreeDartCheckoutAttemptsCompleted] = useState(0);
  const [threeDartCheckoutTarget, setThreeDartCheckoutTarget] = useState(99);
  const [threeDartCheckoutLastOutcome, setThreeDartCheckoutLastOutcome] =
    useState<ThreeDartCheckoutVisitOutcome | null>(null);
  const [bullsHit, setBullsHit] = useState(0);
  const [challengeStartedAt, setChallengeStartedAt] = useState<number | null>(null);
  const [completedElapsedSeconds, setCompletedElapsedSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timedTimerRunning, setTimedTimerRunning] = useState(false);
  const [undoStack, setUndoStack] = useState<PracticeUndoSnapshot[]>([]);

  const clearUndoStack = () => {
    setUndoStack([]);
  };

  const captureUndoSnapshot = (): PracticeUndoSnapshot => ({
    visitDarts,
    history,
    dartsAtTarget,
    targetIndex,
    targetsHit,
    randomTarget,
    threeInARowTarget,
    threeInARowStreak,
    scoring99Visit,
    scoring99Successes,
    scoring99VisitsCompleted,
    scoring99VisitSequence,
    scoring99NoCheckout,
    bigFishVisit,
    bigFishSuccesses,
    bigFishVisitsCompleted,
    bigFishCheckout,
    bigFishLadderRungIndex,
    bigFishLastOutcome,
    randomCheckoutAttempt,
    randomCheckoutSuccesses,
    randomCheckoutAttemptsCompleted,
    randomCheckoutTarget,
    randomCheckoutLastOutcome,
    threeDartCheckoutAttempt,
    threeDartCheckoutSuccesses,
    threeDartCheckoutAttemptsCompleted,
    threeDartCheckoutTarget,
    threeDartCheckoutLastOutcome,
    bullsHit,
    challengeStartedAt,
    completedElapsedSeconds,
    elapsedSeconds,
  });

  const pushUndoSnapshot = () => {
    setUndoStack((stack) => [...stack, captureUndoSnapshot()]);
  };

  const restoreUndoSnapshot = (snapshot: PracticeUndoSnapshot) => {
    setVisitDarts(snapshot.visitDarts);
    setHistory(snapshot.history);
    setDartsAtTarget(snapshot.dartsAtTarget);
    setTargetIndex(snapshot.targetIndex);
    setTargetsHit(snapshot.targetsHit);
    setRandomTarget(snapshot.randomTarget);
    setThreeInARowTarget(snapshot.threeInARowTarget);
    setThreeInARowStreak(snapshot.threeInARowStreak);
    setScoring99Visit(snapshot.scoring99Visit);
    setScoring99Successes(snapshot.scoring99Successes);
    setScoring99VisitsCompleted(snapshot.scoring99VisitsCompleted);
    setScoring99VisitSequence(snapshot.scoring99VisitSequence);
    setScoring99NoCheckout(snapshot.scoring99NoCheckout);
    setBigFishVisit(snapshot.bigFishVisit);
    setBigFishSuccesses(snapshot.bigFishSuccesses);
    setBigFishVisitsCompleted(snapshot.bigFishVisitsCompleted);
    setBigFishCheckout(snapshot.bigFishCheckout);
    setBigFishLadderRungIndex(snapshot.bigFishLadderRungIndex);
    setBigFishLastOutcome(snapshot.bigFishLastOutcome);
    setRandomCheckoutAttempt(snapshot.randomCheckoutAttempt);
    setRandomCheckoutSuccesses(snapshot.randomCheckoutSuccesses);
    setRandomCheckoutAttemptsCompleted(snapshot.randomCheckoutAttemptsCompleted);
    setRandomCheckoutTarget(snapshot.randomCheckoutTarget);
    setRandomCheckoutLastOutcome(snapshot.randomCheckoutLastOutcome);
    setThreeDartCheckoutAttempt(snapshot.threeDartCheckoutAttempt);
    setThreeDartCheckoutSuccesses(snapshot.threeDartCheckoutSuccesses);
    setThreeDartCheckoutAttemptsCompleted(snapshot.threeDartCheckoutAttemptsCompleted);
    setThreeDartCheckoutTarget(snapshot.threeDartCheckoutTarget);
    setThreeDartCheckoutLastOutcome(snapshot.threeDartCheckoutLastOutcome);
    setBullsHit(snapshot.bullsHit);
    setChallengeStartedAt(snapshot.challengeStartedAt);
    setCompletedElapsedSeconds(snapshot.completedElapsedSeconds);
    setElapsedSeconds(snapshot.elapsedSeconds);
  };

  useEffect(() => {
    if (!session) {
      router.replace("/practice/setup");
    }
  }, [router, session]);

  useEffect(() => {
    if (!session || session.remainingSeconds == null || !timedTimerRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = usePracticeStore.getState().session?.remainingSeconds;
      if (current == null) {
        return;
      }

      const next = Math.max(0, current - 1);
      setRemainingSeconds(next);

      if (next === 0) {
        setTimedTimerRunning(false);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session?.startedAt, session?.remainingSeconds, timedTimerRunning, setRemainingSeconds]);

  const resolvedRoutine = useMemo(
    () => (session ? resolvePracticeRoutine(session.setup, session.activeGame) : null),
    [session],
  );

  const setup = session?.setup;
  const activeGame = session?.activeGame ?? null;
  const randomCheckoutConfig = session?.randomCheckoutConfig ?? null;
  const remainingSeconds = session?.remainingSeconds ?? null;
  const showGamePicker = setup ? needsPracticeGamePicker(setup.routine) : false;
  const isTimedSetup = setup?.routine.category === "timed";
  const timedActiveGame =
    activeGame && isTimedPracticeGameId(activeGame) ? activeGame : null;
  const gameReady = setup
    ? isPracticeSessionReady(
        setup.routine,
        activeGame,
        remainingSeconds,
        randomCheckoutConfig,
      )
    : false;
  const timedOut = resolvedRoutine?.category === "timed" && remainingSeconds === 0;
  const practiceGames = setup ? getPracticeGamesForSetup(setup.routine) : [];
  const isRandomMode = isRandomTargetGame(activeGame);
  const sequentialMode =
    setup && activeGame && isSequentialTargetGame(activeGame)
      ? getSequentialTargetMode(setup.routine, activeGame)
      : null;
  const isSequentialMode = Boolean(gameReady && sequentialMode);
  const isThreeInARowMode = Boolean(gameReady && isThreeInARowGame(activeGame));
  const threeInARowGameId = isThreeInARowGame(activeGame) ? activeGame : null;
  const isTreble20Mode = Boolean(gameReady && isTreble20OnlySessionGame(activeGame));
  const isBullChallengeMode = Boolean(gameReady && isBullChallengeGame(activeGame));
  const isBullCountMode = Boolean(gameReady && isBullCountGame(activeGame));
  const isConsecutiveBullsMode = Boolean(gameReady && isConsecutiveBullsSessionGame(activeGame));
  const consecutiveBullsStreakTarget = isConsecutiveBullsSessionGame(activeGame)
    ? getConsecutiveBullsStreakTarget(activeGame)
    : null;
  const isBullPracticeInputMode =
    isBullChallengeMode || isBullCountMode || isConsecutiveBullsMode;
  const bullChallengeComplete = isBullChallengeMode && bullsHit >= BULL_CHALLENGE_TARGET;
  const bullCountComplete = isBullCountMode && history.length >= BULL_COUNT_DART_LIMIT;
  const treble20DartLimit = isTreble20OnlySessionGame(activeGame)
    ? getTreble20DartLimit(activeGame)
    : null;
  const treble20Complete = isTreble20Mode && history.length >= (treble20DartLimit ?? 0);
  const isScoring99Mode = Boolean(gameReady && isScoring99SessionGame(activeGame));
  const scoring99RoundLimit = isScoring99SessionGame(activeGame)
    ? getScoring99RoundCount(activeGame)
    : null;
  const scoring99Complete =
    isScoring99Mode &&
    scoring99RoundLimit != null &&
    scoring99VisitsCompleted >= scoring99RoundLimit;
  const isBigFishRandomMode = Boolean(gameReady && isBigFishRandomSessionGame(activeGame));
  const isBigFishLadderMode = Boolean(gameReady && isBigFishLadderGame(activeGame));
  const isBigFishMode = isBigFishRandomMode || isBigFishLadderMode;
  const bigFishRoundLimit = isBigFishRandomSessionGame(activeGame)
    ? getBigFishRoundCount(activeGame)
    : null;
  const bigFishLadderRungCount = getBigFishLadderRungCount();
  const bigFishComplete =
    (isBigFishRandomMode &&
      bigFishRoundLimit != null &&
      bigFishVisitsCompleted >= bigFishRoundLimit) ||
    (isBigFishLadderMode && bigFishLadderRungIndex >= bigFishLadderRungCount);
  const isRandomCheckoutPicker = isRandomCheckoutBaseGame(activeGame) && !randomCheckoutConfig;
  const isRandomCheckoutMode = Boolean(
    gameReady && isRandomCheckoutConfigured(activeGame, randomCheckoutConfig),
  );
  const randomCheckoutAttemptLimit = randomCheckoutConfig?.attempts ?? null;
  const randomCheckoutComplete =
    isRandomCheckoutMode &&
    randomCheckoutAttemptLimit != null &&
    randomCheckoutAttemptsCompleted >= randomCheckoutAttemptLimit;
  const isThreeDartCheckoutPicker = isThreeDartCheckoutBaseGame(activeGame);
  const isThreeDartCheckoutMode = Boolean(
    gameReady && isThreeDartCheckoutSessionGame(activeGame),
  );
  const threeDartCheckoutAttemptLimit = isThreeDartCheckoutSessionGame(activeGame)
    ? getThreeDartCheckoutAttemptCount(activeGame)
    : null;
  const threeDartCheckoutComplete =
    isThreeDartCheckoutMode &&
    threeDartCheckoutAttemptLimit != null &&
    threeDartCheckoutAttemptsCompleted >= threeDartCheckoutAttemptLimit;
  const isTargetPracticeMode =
    isSequentialMode || isThreeInARowMode || (gameReady && isRandomMode);
  const targetSequence = useMemo(
    () => (sequentialMode ? buildRoundTheClockSequence(sequentialMode) : []),
    [sequentialMode],
  );
  const sequentialTarget = isSequentialMode ? (targetSequence[targetIndex] ?? null) : null;
  const sequentialComplete = isSequentialMode && targetIndex >= targetSequence.length;
  const activeTarget: PracticeTargetDisplay | null = isSequentialMode
    ? sequentialTarget
    : isThreeInARowMode
      ? threeInARowTarget
      : isRandomMode
        ? randomTarget
        : null;
  const targetPracticeComplete = isSequentialMode && sequentialComplete;

  const practiceCompletion: PracticeCompletionState = {
    bullChallengeComplete,
    bullCountComplete,
    treble20Complete,
    scoring99Complete,
    bigFishComplete,
    randomCheckoutComplete,
    threeDartCheckoutComplete,
    targetPracticeComplete,
    timedOut,
  };

  const practiceSnapshot: PracticeSessionSnapshot | null =
    setup && session
      ? {
          setup,
          activeGame,
          randomCheckoutConfig,
          startedAt: session.startedAt,
          history,
          targetsHit,
          targetIndex,
          scoring99Successes,
          scoring99VisitsCompleted,
          bigFishSuccesses,
          bigFishVisitsCompleted,
          bigFishLadderRungIndex,
          randomCheckoutSuccesses,
          randomCheckoutAttemptsCompleted,
          threeDartCheckoutSuccesses,
          threeDartCheckoutAttemptsCompleted,
          bullsHit,
          completedElapsedSeconds,
          elapsedSeconds,
          timedActiveGame,
          timedDurationSeconds:
            timedActiveGame != null ? getTimedPracticeSecondsForGame(timedActiveGame) : null,
        }
      : null;

  usePracticeSessionCompletionRecording(user?.id, practiceSnapshot, practiceCompletion);

  useEffect(() => {
    if (!getMatchAudioPreferences().voice) {
      return;
    }

    primeHitMissClips();
  }, []);

  useEffect(() => {
    if (!isSequentialMode) {
      setTargetIndex(0);
      setDartsAtTarget(0);
      return;
    }

    setTargetIndex(0);
    setDartsAtTarget(0);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isSequentialMode, sequentialMode]);

  const announcePracticeHitMiss = (callout: "hit" | "miss") => {
    if (!getMatchAudioPreferences().voice) {
      return;
    }

    announceHitMissCallout(callout);
  };

  useEffect(() => {
    if (!gameReady || !isRandomMode || !activeGame) {
      setRandomTarget(null);
      setTargetsHit(0);
      setDartsAtTarget(0);
      return;
    }

    setRandomTarget(pickRandomTarget(activeGame));
    setTargetsHit(0);
    setDartsAtTarget(0);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, gameReady, isRandomMode]);

  useEffect(() => {
    if (!isThreeInARowMode || !threeInARowGameId) {
      setThreeInARowTarget(null);
      setThreeInARowStreak(0);
      return;
    }

    setThreeInARowTarget(pickThreeInARowTarget(threeInARowGameId));
    setThreeInARowStreak(0);
    setTargetsHit(0);
    setDartsAtTarget(0);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isThreeInARowMode, threeInARowGameId]);

  useEffect(() => {
    if (!isTreble20Mode || !treble20DartLimit) {
      return;
    }

    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isTreble20Mode, treble20DartLimit]);

  useEffect(() => {
    if (!isScoring99Mode || !scoring99RoundLimit) {
      setScoring99Visit(1);
      setScoring99Successes(0);
      setScoring99VisitsCompleted(0);
      setScoring99VisitSequence(null);
      setScoring99NoCheckout(false);
      return;
    }

    setScoring99Visit(1);
    setScoring99Successes(0);
    setScoring99VisitsCompleted(0);
    setScoring99VisitSequence(pickRandomScoring99Sequence());
    setScoring99NoCheckout(false);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isScoring99Mode, scoring99RoundLimit]);

  useEffect(() => {
    if (!isBigFishMode) {
      setBigFishVisit(1);
      setBigFishSuccesses(0);
      setBigFishVisitsCompleted(0);
      setBigFishCheckout(170);
      setBigFishLadderRungIndex(0);
      setBigFishLastOutcome(null);
      return;
    }

    setBigFishVisit(1);
    setBigFishSuccesses(0);
    setBigFishVisitsCompleted(0);
    setBigFishLadderRungIndex(0);
    setBigFishLastOutcome(null);

    if (isBigFishLadderMode) {
      setBigFishCheckout(getBigFishLadderStartingCheckout());
    } else {
      setBigFishCheckout(pickRandomBigFishCheckout());
    }

    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isBigFishMode, isBigFishLadderMode]);

  useEffect(() => {
    if (!isRandomCheckoutMode || !randomCheckoutConfig) {
      setRandomCheckoutAttempt(1);
      setRandomCheckoutSuccesses(0);
      setRandomCheckoutAttemptsCompleted(0);
      setRandomCheckoutTarget(40);
      setRandomCheckoutLastOutcome(null);
      return;
    }

    setRandomCheckoutAttempt(1);
    setRandomCheckoutSuccesses(0);
    setRandomCheckoutAttemptsCompleted(0);
    setRandomCheckoutTarget(pickRandomCheckoutTarget(randomCheckoutConfig));
    setRandomCheckoutLastOutcome(null);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isRandomCheckoutMode, randomCheckoutConfig]);

  useEffect(() => {
    if (!isThreeDartCheckoutMode) {
      setThreeDartCheckoutAttempt(1);
      setThreeDartCheckoutSuccesses(0);
      setThreeDartCheckoutAttemptsCompleted(0);
      setThreeDartCheckoutTarget(99);
      setThreeDartCheckoutLastOutcome(null);
      return;
    }

    setThreeDartCheckoutAttempt(1);
    setThreeDartCheckoutSuccesses(0);
    setThreeDartCheckoutAttemptsCompleted(0);
    setThreeDartCheckoutTarget(pickRandomThreeDartCheckoutTarget());
    setThreeDartCheckoutLastOutcome(null);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isThreeDartCheckoutMode]);

  useEffect(() => {
    if (!isBullChallengeMode) {
      setBullsHit(0);
      setChallengeStartedAt(null);
      setCompletedElapsedSeconds(null);
      setElapsedSeconds(0);
      return;
    }

    setBullsHit(0);
    setChallengeStartedAt(Date.now());
    setCompletedElapsedSeconds(null);
    setElapsedSeconds(0);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isBullChallengeMode]);

  useEffect(() => {
    if (!isBullCountMode) {
      return;
    }

    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isBullCountMode]);

  useEffect(() => {
    if (!isConsecutiveBullsMode) {
      return;
    }

    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isConsecutiveBullsMode]);

  useEffect(() => {
    if (!isBullChallengeMode || !challengeStartedAt || completedElapsedSeconds != null) {
      return;
    }

    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - challengeStartedAt) / 1000));
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [challengeStartedAt, completedElapsedSeconds, isBullChallengeMode]);

  if (!session || !setup) {
    return null;
  }

  const title =
    resolvedRoutine != null
      ? getPracticeRoutineTitle(resolvedRoutine, activeGame, randomCheckoutConfig)
      : getPracticeSetupSectionLabel(setup.routine);

  const throwDart = (hit: DartHit) => {
    if (
      !gameReady ||
      timedOut ||
      targetPracticeComplete ||
      treble20Complete ||
      scoring99Complete ||
      bullChallengeComplete ||
      bullCountComplete ||
      bigFishComplete ||
      randomCheckoutComplete ||
      threeDartCheckoutComplete
    ) {
      return;
    }

    pushUndoSnapshot();

    if (isBullChallengeMode) {
      setHistory((current) => {
        const nextHistory = [...current, hit];
        setVisitDarts(nextHistory.slice(-3));

        if (isBullChallengeHit(hit)) {
          setBullsHit((count) => {
            const nextCount = count + 1;

            if (nextCount >= BULL_CHALLENGE_TARGET) {
              setCompletedElapsedSeconds((value) => {
                if (value != null) {
                  return value;
                }

                return challengeStartedAt
                  ? Math.floor((Date.now() - challengeStartedAt) / 1000)
                  : elapsedSeconds;
              });
            }

            return nextCount;
          });
        }

        return nextHistory;
      });
      return;
    }

    if (isBullCountMode) {
      setHistory((current) => {
        if (current.length >= BULL_COUNT_DART_LIMIT) {
          return current;
        }

        const nextHistory = [...current, hit];
        const dartsInVisit = nextHistory.length % BULL_COUNT_DARTS_PER_VISIT;
        setVisitDarts(dartsInVisit === 0 ? [] : nextHistory.slice(-dartsInVisit));
        return nextHistory;
      });
      return;
    }

    if (isConsecutiveBullsMode) {
      setHistory((current) => {
        const nextHistory = [...current, hit];
        setVisitDarts(nextHistory.slice(-3));
        return nextHistory;
      });
      return;
    }

    if (isThreeDartCheckoutMode) {
      let activeVisitDarts = visitDarts;

      if (threeDartCheckoutLastOutcome != null) {
        setThreeDartCheckoutLastOutcome(null);
        activeVisitDarts = [];
        setVisitDarts([]);
        setThreeDartCheckoutTarget((current) => pickRandomThreeDartCheckoutTarget(current));
      }

      if (activeVisitDarts.length >= 3) {
        return;
      }

      const { outcome, visitDarts: nextVisit } = evaluateThreeDartCheckoutDart(
        threeDartCheckoutTarget,
        activeVisitDarts,
        hit,
      );

      if (outcome === "playing") {
        setVisitDarts(nextVisit);
        setHistory((current) => [...current, hit]);
        return;
      }

      const attemptComplete = threeDartCheckoutAttemptsCompleted + 1;
      setThreeDartCheckoutLastOutcome(outcome);
      setVisitDarts(nextVisit);
      setHistory((current) => [...current, hit]);
      setThreeDartCheckoutAttemptsCompleted(attemptComplete);

      if (outcome === "checkout") {
        setThreeDartCheckoutSuccesses((count) => count + 1);
      }

      if (attemptComplete >= (threeDartCheckoutAttemptLimit ?? 0)) {
        return;
      }

      setThreeDartCheckoutAttempt((attempt) => attempt + 1);
      return;
    }

    if (isRandomCheckoutMode && randomCheckoutConfig) {
      let activeVisitDarts = visitDarts;

      if (randomCheckoutLastOutcome != null) {
        setRandomCheckoutLastOutcome(null);
        activeVisitDarts = [];
        setVisitDarts([]);
        setRandomCheckoutTarget((current) =>
          pickRandomCheckoutTarget(randomCheckoutConfig, current),
        );
      }

      if (activeVisitDarts.length >= 3) {
        return;
      }

      const { outcome, visitDarts: nextVisit } = evaluateRandomCheckoutDart(
        randomCheckoutTarget,
        activeVisitDarts,
        hit,
        randomCheckoutConfig.outRule,
      );

      if (outcome === "playing") {
        setVisitDarts(nextVisit);
        setHistory((current) => [...current, hit]);
        return;
      }

      const attemptComplete = randomCheckoutAttemptsCompleted + 1;
      setRandomCheckoutLastOutcome(outcome);
      setVisitDarts(nextVisit);
      setHistory((current) => [...current, hit]);
      setRandomCheckoutAttemptsCompleted(attemptComplete);

      if (outcome === "checkout") {
        setRandomCheckoutSuccesses((count) => count + 1);
      }

      if (attemptComplete >= randomCheckoutConfig.attempts) {
        return;
      }

      setRandomCheckoutAttempt((attempt) => attempt + 1);
      return;
    }

    if (isBigFishMode) {
      let activeVisitDarts = visitDarts;

      if (bigFishLastOutcome != null) {
        const previousOutcome = bigFishLastOutcome;
        setBigFishLastOutcome(null);
        activeVisitDarts = [];
        setVisitDarts([]);

        if (isBigFishLadderMode) {
          if (previousOutcome === "checkout") {
            setBigFishCheckout(getBigFishLadderRung(bigFishLadderRungIndex));
          }
        } else {
          setBigFishCheckout((current) => pickRandomBigFishCheckout(current));
        }
      }

      if (activeVisitDarts.length >= 3) {
        return;
      }

      const { outcome, visitDarts: nextVisit } = evaluateBigFishDart(
        bigFishCheckout,
        activeVisitDarts,
        hit,
      );

      if (outcome === "playing") {
        setVisitDarts(nextVisit);
        setHistory((current) => [...current, hit]);
        return;
      }

      const visitComplete = bigFishVisitsCompleted + 1;
      setBigFishLastOutcome(outcome);
      setVisitDarts(nextVisit);
      setHistory((current) => [...current, hit]);
      setBigFishVisitsCompleted(visitComplete);

      if (isBigFishLadderMode) {
        if (outcome === "checkout") {
          setBigFishSuccesses((count) => count + 1);
          setBigFishLadderRungIndex((index) => index + 1);
        }
        return;
      }

      if (outcome === "checkout") {
        setBigFishSuccesses((count) => count + 1);
      }

      if (visitComplete >= (bigFishRoundLimit ?? 0)) {
        return;
      }

      setBigFishVisit((visit) => visit + 1);
      return;
    }

    if (isScoring99Mode) {
      if (visitDarts.length >= 3) {
        return;
      }

      const dartIndex = visitDarts.length;
      const expectedDart = scoring99VisitSequence?.darts[dartIndex];
      const nextVisit = [...visitDarts, hit];

      if (
        expectedDart &&
        !isScoring99SequenceDartMatch(hit, expectedDart) &&
        nextVisit.length < 3 &&
        scoring99VisitSequence
      ) {
        const recalculated = recalculateScoring99SequenceAfterMiss(
          scoring99VisitSequence,
          nextVisit,
        );

        if (recalculated === "no-checkout") {
          setScoring99NoCheckout(true);
          setScoring99VisitsCompleted((count) => count + 1);
          setScoring99Visit((visit) => visit + 1);
          setScoring99VisitSequence((current) => pickRandomScoring99Sequence(current));
          setVisitDarts([]);
          setHistory((current) => [...current, hit]);
          return;
        }

        setScoring99VisitSequence(recalculated);
      }

      setScoring99NoCheckout(false);

      if (nextVisit.length >= 3) {
        const visitTotal = nextVisit.reduce((sum, dart) => sum + dart.score, 0);

        if (visitTotal === SCORING_99_TARGET) {
          setScoring99Successes((count) => count + 1);
        }

        setScoring99VisitsCompleted((count) => count + 1);
        setScoring99Visit((visit) => visit + 1);
        setScoring99VisitSequence((current) => pickRandomScoring99Sequence(current));
        setVisitDarts([]);
        setHistory((current) => [...current, hit]);
        return;
      }

      setVisitDarts(nextVisit);
      setHistory((current) => [...current, hit]);
      return;
    }

    if (isTreble20Mode) {
      setHistory((current) => {
        if (current.length >= (treble20DartLimit ?? 0)) {
          return current;
        }

        const nextHistory = [...current, hit];
        setVisitDarts(nextHistory.slice(-3));
        return nextHistory;
      });
      return;
    }

    if (isTargetPracticeMode) {
      setVisitDarts((current) => [...current, hit]);
      setHistory((current) => [...current, hit]);
      setDartsAtTarget((count) => count + 1);
      return;
    }

    if (visitDarts.length >= 3) {
      return;
    }

    setVisitDarts((current) => [...current, hit]);
    setHistory((current) => [...current, hit]);
  };

  const handleRandomCheckoutStart = (config: RandomCheckoutSessionConfig) => {
    setRandomCheckoutConfig(config);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleBigFishLadderSelect = () => {
    setActiveGame("big-fish-ladder");
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleBigFishRoundSelect = (rounds: 10 | 20) => {
    setActiveGame(rounds === 10 ? "big-fish-10" : "big-fish-20");
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleThreeDartCheckoutAttemptSelect = (attempts: ThreeDartCheckoutAttemptCount) => {
    const gameId =
      attempts === 10
        ? "three-dart-checkout-10"
        : attempts === 20
          ? "three-dart-checkout-20"
          : "three-dart-checkout-50";
    setActiveGame(gameId);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleScoring99RoundSelect = (rounds: 10 | 20) => {
    setActiveGame(rounds === 10 ? "scoring-99-10" : "scoring-99-20");
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleTreble20DartInput = (kind: Treble20DartInputKind) => {
    throwDart(createTreble20DartInput(kind));
  };

  const handleConsecutiveBullsStreakSelect = (target: ConsecutiveBullsStreakTarget) => {
    const gameId =
      target === 3
        ? "consecutive-bulls-3"
        : target === 5
          ? "consecutive-bulls-5"
          : "consecutive-bulls-10";
    setActiveGame(gameId);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleBullDartInput = (kind: BullChallengeDartInputKind) => {
    throwDart(createBullChallengeDartInput(kind));
  };

  const handleTargetHit = () => {
    if (!isTargetPracticeMode || targetPracticeComplete || !activeTarget) {
      return;
    }

    pushUndoSnapshot();
    announcePracticeHitMiss("hit");

    // Button-only hit: no board throws recorded yet for this attempt.
    if (visitDarts.length === 0) {
      const hitDart: DartHit = {
        segment: activeTarget.segment,
        multiplier: activeTarget.multiplier,
        score: 0,
        label: activeTarget.label,
      };

      setHistory((current) => [...current, hitDart]);
    }

    if (isSequentialMode) {
      setTargetIndex((index) => index + 1);
    } else if (isThreeInARowMode && threeInARowGameId) {
      const nextStreak = threeInARowStreak + 1;

      if (nextStreak >= THREE_IN_A_ROW_REQUIRED) {
        setTargetsHit((count) => count + 1);
        setThreeInARowTarget((current) => pickThreeInARowTarget(threeInARowGameId, current));
        setThreeInARowStreak(0);
      } else {
        setThreeInARowStreak(nextStreak);
      }
    } else if (isRandomMode && activeGame) {
      setTargetsHit((count) => count + 1);
      setRandomTarget((current) => pickRandomTarget(activeGame, current));
    }

    setDartsAtTarget(0);
    setVisitDarts([]);
  };

  const handleTargetMiss = () => {
    if (!isTargetPracticeMode || targetPracticeComplete) {
      return;
    }

    pushUndoSnapshot();
    announcePracticeHitMiss("miss");

    // Button-only miss: no board throws recorded yet for this attempt.
    if (visitDarts.length === 0) {
      const missDart: DartHit = {
        segment: "miss",
        multiplier: "miss",
        score: 0,
        label: "Miss",
      };

      setHistory((current) => [...current, missDart]);
      setDartsAtTarget((count) => count + 1);
    }

    if (isThreeInARowMode) {
      setThreeInARowStreak(0);
    }

    setVisitDarts([]);
  };

  const undo = () => {
    if (!gameReady || undoStack.length === 0) {
      return;
    }

    const snapshot = undoStack[undoStack.length - 1]!;
    setUndoStack((stack) => stack.slice(0, -1));
    restoreUndoSnapshot(snapshot);
  };

  const resetSession = () => {
    if (!gameReady) {
      return;
    }

    clearUndoStack();

    if (isRandomCheckoutMode && randomCheckoutConfig) {
      setRandomCheckoutAttempt(1);
      setRandomCheckoutSuccesses(0);
      setRandomCheckoutAttemptsCompleted(0);
      setRandomCheckoutTarget(pickRandomCheckoutTarget(randomCheckoutConfig));
      setRandomCheckoutLastOutcome(null);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isThreeDartCheckoutMode) {
      setThreeDartCheckoutAttempt(1);
      setThreeDartCheckoutSuccesses(0);
      setThreeDartCheckoutAttemptsCompleted(0);
      setThreeDartCheckoutTarget(pickRandomThreeDartCheckoutTarget());
      setThreeDartCheckoutLastOutcome(null);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isBigFishMode) {
      setBigFishVisit(1);
      setBigFishSuccesses(0);
      setBigFishVisitsCompleted(0);
      setBigFishLadderRungIndex(0);
      setBigFishLastOutcome(null);

      if (isBigFishLadderMode) {
        setBigFishCheckout(getBigFishLadderStartingCheckout());
      } else {
        setBigFishCheckout(pickRandomBigFishCheckout());
      }

      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isScoring99Mode) {
      setScoring99Visit(1);
      setScoring99Successes(0);
      setScoring99VisitsCompleted(0);
      setScoring99VisitSequence(pickRandomScoring99Sequence());
      setScoring99NoCheckout(false);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isBullChallengeMode) {
      setBullsHit(0);
      setChallengeStartedAt(Date.now());
      setCompletedElapsedSeconds(null);
      setElapsedSeconds(0);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isBullCountMode) {
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isConsecutiveBullsMode) {
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isTreble20Mode) {
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isTimedSetup && timedActiveGame) {
      setTimedTimerRunning(false);
      setRemainingSeconds(getTimedPracticeSecondsForGame(timedActiveGame));
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isSequentialMode) {
      setTargetIndex(0);
      setDartsAtTarget(0);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isThreeInARowMode && threeInARowGameId) {
      setThreeInARowTarget(pickThreeInARowTarget(threeInARowGameId));
      setThreeInARowStreak(0);
      setTargetsHit(0);
      setDartsAtTarget(0);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isRandomMode && activeGame) {
      setRandomTarget(pickRandomTarget(activeGame));
      setTargetsHit(0);
      setDartsAtTarget(0);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    setVisitDarts([]);
    setHistory([]);
  };

  const handleTimedStart = () => {
    if (!timedActiveGame || remainingSeconds == null) {
      return;
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(getTimedPracticeSecondsForGame(timedActiveGame));
    }

    setTimedTimerRunning(true);
  };

  const handleTimedStop = () => {
    setTimedTimerRunning(false);
  };

  const handleGameSelect = (gameId: typeof activeGame) => {
    if (isTimedSetup && gameId && isTimedPracticeGameId(gameId)) {
      setTimedTimerRunning(false);
    }

    setActiveGame(gameId);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleBack = () => {
    reset();
    router.push("/practice/setup");
  };

  const visitTotal = visitDarts.reduce((sum, dart) => sum + dart.score, 0);

  const bigFishVisitEnded = isBigFishMode && bigFishLastOutcome != null;
  const bigFishNoCheckout =
    isBigFishMode &&
    !bigFishComplete &&
    !bigFishVisitEnded &&
    buildBigFishSequence(bigFishCheckout, visitDarts) === "no-checkout";
  const randomCheckoutVisitEnded = isRandomCheckoutMode && randomCheckoutLastOutcome != null;
  const randomCheckoutNoCheckout =
    isRandomCheckoutMode &&
    randomCheckoutConfig &&
    !randomCheckoutComplete &&
    !randomCheckoutVisitEnded &&
    buildRandomCheckoutSequence(
      randomCheckoutTarget,
      visitDarts,
      randomCheckoutConfig.outRule,
    ) === "no-checkout";
  const threeDartCheckoutVisitEnded = isThreeDartCheckoutMode && threeDartCheckoutLastOutcome != null;
  const threeDartCheckoutNoCheckout =
    isThreeDartCheckoutMode &&
    !threeDartCheckoutComplete &&
    !threeDartCheckoutVisitEnded &&
    buildThreeDartCheckoutSequence(threeDartCheckoutTarget, visitDarts) === "no-checkout";

  const boardPracticeTarget =
    treble20Complete || !gameReady || isBullPracticeInputMode
      ? null
      : isThreeDartCheckoutMode &&
          !threeDartCheckoutComplete &&
          !threeDartCheckoutVisitEnded &&
          !threeDartCheckoutNoCheckout
        ? getThreeDartCheckoutNextPracticeTarget(threeDartCheckoutTarget, visitDarts, false)
        : isRandomCheckoutMode &&
          randomCheckoutConfig &&
          !randomCheckoutComplete &&
          !randomCheckoutVisitEnded &&
          !randomCheckoutNoCheckout
        ? getRandomCheckoutNextPracticeTarget(
            randomCheckoutTarget,
            visitDarts,
            randomCheckoutConfig.outRule,
            false,
          )
        : isBigFishMode && !bigFishComplete && !bigFishVisitEnded && !bigFishNoCheckout
        ? getBigFishNextPracticeTarget(bigFishCheckout, visitDarts, false)
        : isScoring99Mode && !scoring99Complete
        ? getScoring99NextPracticeTarget(
            scoring99VisitSequence,
            visitDarts,
            scoring99NoCheckout,
          )
        : isTreble20Mode
          ? { segment: TREBLE_20_TARGET.segment, multiplier: TREBLE_20_TARGET.multiplier }
          : activeTarget && !targetPracticeComplete
            ? { segment: activeTarget.segment, multiplier: activeTarget.multiplier }
            : null;

  const actionButtons = (
    <div className="practice-play-actions grid grid-cols-3 gap-2 px-0 pt-2">
      <TouchButton
        variant="secondary"
        onClick={undo}
        disabled={!gameReady || undoStack.length === 0}
      >
        Undo
      </TouchButton>
      <TouchButton
        accentColor={themePrimaryColor}
        onClick={resetSession}
        disabled={!gameReady}
      >
        New Visit
      </TouchButton>
      <TouchButton
        variant="secondary"
        onClick={handleBack}
      >
        End Practice
      </TouchButton>
    </div>
  );

  const scorecard = isThreeDartCheckoutPicker ? (
    <PracticeThreeDartCheckoutScorecard
      variant="picker"
      visitDarts={[]}
      checkoutTarget={99}
      currentAttempt={1}
      attemptLimit={10}
      successes={0}
      attemptsCompleted={0}
      lastOutcome={null}
      themePrimaryColor={themePrimaryColor}
      onSelectAttemptCount={handleThreeDartCheckoutAttemptSelect}
    />
  ) : isThreeDartCheckoutMode && threeDartCheckoutAttemptLimit ? (
    <PracticeThreeDartCheckoutScorecard
      variant="active"
      visitDarts={visitDarts}
      checkoutTarget={threeDartCheckoutTarget}
      currentAttempt={Math.min(threeDartCheckoutAttempt, threeDartCheckoutAttemptLimit)}
      attemptLimit={threeDartCheckoutAttemptLimit}
      successes={threeDartCheckoutSuccesses}
      attemptsCompleted={threeDartCheckoutAttemptsCompleted}
      lastOutcome={threeDartCheckoutLastOutcome}
      complete={threeDartCheckoutComplete}
      themePrimaryColor={themePrimaryColor}
    />
  ) : isRandomCheckoutPicker ? (
    <PracticeRandomCheckoutScorecard
      variant="picker"
      visitDarts={[]}
      checkoutTarget={40}
      currentAttempt={1}
      attemptLimit={10}
      outRule="double_out"
      successes={0}
      attemptsCompleted={0}
      lastOutcome={null}
      themePrimaryColor={themePrimaryColor}
      onStart={handleRandomCheckoutStart}
    />
  ) : isRandomCheckoutMode && randomCheckoutConfig && randomCheckoutAttemptLimit ? (
    <PracticeRandomCheckoutScorecard
      variant="active"
      visitDarts={visitDarts}
      checkoutTarget={randomCheckoutTarget}
      currentAttempt={Math.min(randomCheckoutAttempt, randomCheckoutAttemptLimit)}
      attemptLimit={randomCheckoutAttemptLimit}
      outRule={randomCheckoutConfig.outRule}
      successes={randomCheckoutSuccesses}
      attemptsCompleted={randomCheckoutAttemptsCompleted}
      lastOutcome={randomCheckoutLastOutcome}
      complete={randomCheckoutComplete}
      themePrimaryColor={themePrimaryColor}
    />
  ) : isBigFishBaseGame(activeGame) ? (
    <PracticeBigFishScorecard
      variant="picker"
      visitDarts={[]}
      checkoutTarget={170}
      currentVisit={1}
      visitLimit={10}
      ladderRungIndex={0}
      successes={0}
      visitsCompleted={0}
      lastOutcome={null}
      themePrimaryColor={themePrimaryColor}
      onSelectRoundCount={handleBigFishRoundSelect}
      onSelectLadder={handleBigFishLadderSelect}
    />
  ) : isBigFishLadderMode ? (
    <PracticeBigFishScorecard
      variant="ladder"
      visitDarts={visitDarts}
      checkoutTarget={bigFishCheckout}
      currentVisit={1}
      visitLimit={bigFishLadderRungCount}
      ladderRungIndex={Math.min(bigFishLadderRungIndex, bigFishLadderRungCount - 1)}
      successes={bigFishSuccesses}
      visitsCompleted={bigFishVisitsCompleted}
      lastOutcome={bigFishLastOutcome}
      complete={bigFishComplete}
      themePrimaryColor={themePrimaryColor}
    />
  ) : isBigFishRandomMode && bigFishRoundLimit ? (
    <PracticeBigFishScorecard
      variant="random"
      visitDarts={visitDarts}
      checkoutTarget={bigFishCheckout}
      currentVisit={Math.min(bigFishVisit, bigFishRoundLimit)}
      visitLimit={bigFishRoundLimit}
      ladderRungIndex={0}
      successes={bigFishSuccesses}
      visitsCompleted={bigFishVisitsCompleted}
      lastOutcome={bigFishLastOutcome}
      complete={bigFishComplete}
      themePrimaryColor={themePrimaryColor}
    />
  ) : isScoring99BaseGame(activeGame) ? (
    <PracticeScoring99Scorecard
      visitDarts={[]}
      currentVisit={1}
      visitLimit={10}
      successes={0}
      visitsCompleted={0}
      visitSequence={null}
      themePrimaryColor={themePrimaryColor}
      onSelectRoundCount={handleScoring99RoundSelect}
    />
  ) : isScoring99Mode && scoring99RoundLimit ? (
    <PracticeScoring99Scorecard
      visitDarts={visitDarts}
      currentVisit={Math.min(scoring99Visit, scoring99RoundLimit)}
      visitLimit={scoring99RoundLimit}
      successes={scoring99Successes}
      visitsCompleted={scoring99VisitsCompleted}
      visitSequence={scoring99VisitSequence}
      noCheckout={scoring99NoCheckout}
      complete={scoring99Complete}
      themePrimaryColor={themePrimaryColor}
    />
  ) : isConsecutiveBullsBaseGame(activeGame) ? (
    <PracticeConsecutiveBullsScorecard
      visitDarts={[]}
      sessionDarts={[]}
      streakTarget={3}
      themePrimaryColor={themePrimaryColor}
      onDartInput={handleBullDartInput}
      onSelectStreakTarget={handleConsecutiveBullsStreakSelect}
    />
  ) : isConsecutiveBullsMode && consecutiveBullsStreakTarget ? (
    <PracticeConsecutiveBullsScorecard
      visitDarts={visitDarts}
      sessionDarts={history}
      streakTarget={consecutiveBullsStreakTarget}
      themePrimaryColor={themePrimaryColor}
      onDartInput={handleBullDartInput}
    />
  ) : isBullChallengeMode ? (
    <PracticeBullChallengeScorecard
      visitDarts={visitDarts}
      sessionDarts={history}
      elapsedSeconds={completedElapsedSeconds ?? elapsedSeconds}
      complete={bullChallengeComplete}
      themePrimaryColor={themePrimaryColor}
      onDartInput={handleBullDartInput}
    />
  ) : isBullCountMode ? (
    <PracticeBullCountScorecard
      visitDarts={visitDarts}
      sessionDarts={history}
      complete={bullCountComplete}
      themePrimaryColor={themePrimaryColor}
      onDartInput={handleBullDartInput}
    />
  ) : isTreble20Mode && treble20DartLimit ? (
    <PracticeTreble20Scorecard
      visitDarts={visitDarts}
      sessionDarts={history}
      dartLimit={treble20DartLimit}
      complete={treble20Complete}
      themePrimaryColor={themePrimaryColor}
      onDartInput={handleTreble20DartInput}
    />
  ) : isTargetPracticeMode ? (
    <PracticeTargetScorecard
      target={activeTarget}
      dartsAtTarget={dartsAtTarget}
      visitDarts={visitDarts}
      sessionDarts={history.length}
      targetsHit={isRandomMode || isThreeInARowMode ? targetsHit : undefined}
      targetsHitLabel={isThreeInARowMode ? "Sets completed" : "Targets hit"}
      counterLabel={isThreeInARowMode ? "In a row" : "Darts at number"}
      counterValue={
        isThreeInARowMode
          ? `${threeInARowStreak}/${THREE_IN_A_ROW_REQUIRED}`
          : undefined
      }
      complete={targetPracticeComplete}
      themePrimaryColor={themePrimaryColor}
      onHit={handleTargetHit}
      onMiss={handleTargetMiss}
    />
  ) : isTimedSetup && timedActiveGame && remainingSeconds != null ? (
    <PracticeTimedScorecard
      activeGame={timedActiveGame}
      remainingSeconds={remainingSeconds}
      running={timedTimerRunning}
      timedOut={timedOut}
      themePrimaryColor={themePrimaryColor}
      onStart={handleTimedStart}
      onStop={handleTimedStop}
    />
  ) : !gameReady ? (
    <p className="practice-scorecard__placeholder text-center text-sm text-muted-foreground">
      {isTreble20OnlyBaseGame(activeGame)
        ? "Select a dart limit to start practicing."
        : isThreeDartCheckoutPicker
          ? null
          : isRandomCheckoutPicker
          ? "Configure checkout range, attempts, and finish rule to start."
          : isTimedSetup && !timedActiveGame
            ? "Select a duration."
          : "Select a game to start practicing."}
    </p>
  ) : (
    <GlassPanel className="scorecard-panel text-center">
      <>
        <p className="practice-scorecard__label text-xs font-semibold uppercase tracking-[0.14em]">
          Visit total
        </p>
        <p className="practice-scorecard__total mt-2 font-black tabular-nums">{visitTotal}</p>
      </>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {visitDarts.map((dart, index) => (
          <span
            key={`${dart.label}-${index}`}
            className="rounded-2xl bg-surface px-4 py-2 text-lg font-bold"
          >
            {dart.label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Visit darts: {history.length}</p>
    </GlassPanel>
  );

  return (
    <ScoringLayout
      sidebar={
        <PracticePlaySidebar
          title={title}
          onBackClick={handleBack}
          showGamePicker={showGamePicker}
          practiceGames={practiceGames}
          activeGame={activeGame}
          onGameSelect={handleGameSelect}
          scorecard={scorecard}
          actions={actionButtons}
        />
      }
      boardHeader={
        <BoardGameTitle
          title="Practice"
          subtitle={
            isRandomCheckoutMode && !randomCheckoutComplete
              ? String(randomCheckoutTarget)
              : isThreeDartCheckoutMode && !threeDartCheckoutComplete
              ? String(threeDartCheckoutTarget)
              : isBigFishMode && !bigFishComplete
              ? String(bigFishCheckout)
              : isBullPracticeInputMode && !bullChallengeComplete && !bullCountComplete
              ? "25 / 50"
              : isScoring99Mode && !scoring99Complete
              ? String(SCORING_99_TARGET)
              : isTreble20Mode && !treble20Complete
                ? TREBLE_20_TARGET.label
                : activeTarget && !targetPracticeComplete
                  ? activeTarget.label
                  : undefined
          }
        />
      }
      board={
        <Dartboard
          onHit={throwDart}
          recentHits={visitDarts}
          practiceTarget={boardPracticeTarget}
          practiceHighlightBulls={
            isBullPracticeInputMode && !bullChallengeComplete && !bullCountComplete
          }
          practiceTargetHeavyPulse={
            (isScoring99Mode && !scoring99Complete) ||
            (isThreeDartCheckoutMode &&
              !threeDartCheckoutComplete &&
              !threeDartCheckoutVisitEnded &&
              !threeDartCheckoutNoCheckout) ||
            (isRandomCheckoutMode &&
              !randomCheckoutComplete &&
              !randomCheckoutVisitEnded &&
              !randomCheckoutNoCheckout) ||
            (isBigFishMode && !bigFishComplete && !bigFishVisitEnded && !bigFishNoCheckout) ||
            (isBullPracticeInputMode && !bullChallengeComplete && !bullCountComplete)
          }
          disabled={
            !gameReady ||
            timedOut ||
            targetPracticeComplete ||
            treble20Complete ||
            scoring99Complete ||
            bullChallengeComplete ||
            bullCountComplete ||
            bigFishComplete ||
            randomCheckoutComplete ||
            threeDartCheckoutComplete ||
            (isRandomCheckoutMode && randomCheckoutVisitEnded) ||
            (isThreeDartCheckoutMode && threeDartCheckoutVisitEnded) ||
            isTreble20Mode ||
            isBullPracticeInputMode ||
            (isScoring99Mode && visitDarts.length >= 3) ||
            (isBigFishMode && visitDarts.length >= 3) ||
            (isRandomCheckoutMode && visitDarts.length >= 3) ||
            (isThreeDartCheckoutMode && visitDarts.length >= 3) ||
            (!isTargetPracticeMode &&
              !isScoring99Mode &&
              !isBigFishMode &&
              !isRandomCheckoutMode &&
              !isThreeDartCheckoutMode &&
              !isBullPracticeInputMode &&
              visitDarts.length >= 3)
          }
        />
      }
    />
  );
}
