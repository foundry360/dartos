"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type DartHit } from "@/types/dart";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { PracticePlaySidebar } from "@/features/practice/components/PracticePlaySidebar";
import { PracticeScoring99Scorecard } from "@/features/practice/components/PracticeScoring99Scorecard";
import { PracticeTreble20Scorecard } from "@/features/practice/components/PracticeTreble20Scorecard";
import { PracticeTargetScorecard } from "@/features/practice/components/PracticeTargetScorecard";
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
  isPracticeSessionReady,
  needsPracticeGamePicker,
  resolvePracticeRoutine,
} from "@/features/practice/lib/practice-routines";
import { usePracticeStore } from "@/features/practice/store/practice-store";

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface PracticeUndoSnapshot {
  visitDarts: DartHit[];
  history: DartHit[];
  dartsAtTarget: number;
  targetIndex: number;
  targetsHit: number;
  randomTarget: PracticeRandomTarget | null;
  threeInARowTarget: PracticeRandomTarget | null;
  threeInARowStreak: number;
  scoring99Session: number;
  scoring99Successes: number;
  scoring99SessionsCompleted: number;
  scoring99SessionSequence: Scoring99Sequence | null;
  scoring99NoCheckout: boolean;
}

export default function PracticePlayPage() {
  const router = useRouter();
  const session = usePracticeStore((state) => state.session);
  const setActiveGame = usePracticeStore((state) => state.setActiveGame);
  const setRemainingSeconds = usePracticeStore((state) => state.setRemainingSeconds);
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
  const [scoring99Session, setScoring99Session] = useState(1);
  const [scoring99Successes, setScoring99Successes] = useState(0);
  const [scoring99SessionsCompleted, setScoring99SessionsCompleted] = useState(0);
  const [scoring99SessionSequence, setScoring99SessionSequence] =
    useState<Scoring99Sequence | null>(null);
  const [scoring99NoCheckout, setScoring99NoCheckout] = useState(false);
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
    scoring99Session,
    scoring99Successes,
    scoring99SessionsCompleted,
    scoring99SessionSequence,
    scoring99NoCheckout,
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
    setScoring99Session(snapshot.scoring99Session);
    setScoring99Successes(snapshot.scoring99Successes);
    setScoring99SessionsCompleted(snapshot.scoring99SessionsCompleted);
    setScoring99SessionSequence(snapshot.scoring99SessionSequence);
    setScoring99NoCheckout(snapshot.scoring99NoCheckout);
  };

  useEffect(() => {
    if (!session) {
      router.replace("/practice/setup");
    }
  }, [router, session]);

  useEffect(() => {
    if (!session || session.remainingSeconds == null) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = usePracticeStore.getState().session?.remainingSeconds;
      if (current == null) {
        return;
      }

      setRemainingSeconds(Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session?.startedAt, session?.remainingSeconds == null, setRemainingSeconds]);

  const resolvedRoutine = useMemo(
    () => (session ? resolvePracticeRoutine(session.setup, session.activeGame) : null),
    [session],
  );

  const setup = session?.setup;
  const activeGame = session?.activeGame ?? null;
  const remainingSeconds = session?.remainingSeconds ?? null;
  const showGamePicker = setup ? needsPracticeGamePicker(setup.routine) : false;
  const gameReady = setup
    ? isPracticeSessionReady(setup.routine, activeGame, remainingSeconds)
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
    scoring99SessionsCompleted >= scoring99RoundLimit;
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
      setScoring99Session(1);
      setScoring99Successes(0);
      setScoring99SessionsCompleted(0);
      setScoring99SessionSequence(null);
      setScoring99NoCheckout(false);
      return;
    }

    setScoring99Session(1);
    setScoring99Successes(0);
    setScoring99SessionsCompleted(0);
    setScoring99SessionSequence(pickRandomScoring99Sequence());
    setScoring99NoCheckout(false);
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  }, [activeGame, isScoring99Mode, scoring99RoundLimit]);

  if (!session || !setup) {
    return null;
  }

  const title =
    resolvedRoutine != null
      ? getPracticeRoutineTitle(resolvedRoutine, activeGame)
      : getPracticeSetupSectionLabel(setup.routine);

  const throwDart = (hit: DartHit) => {
    if (
      !gameReady ||
      timedOut ||
      targetPracticeComplete ||
      treble20Complete ||
      scoring99Complete
    ) {
      return;
    }

    pushUndoSnapshot();

    if (isScoring99Mode) {
      if (visitDarts.length >= 3) {
        return;
      }

      const dartIndex = visitDarts.length;
      const expectedDart = scoring99SessionSequence?.darts[dartIndex];
      const nextVisit = [...visitDarts, hit];

      if (
        expectedDart &&
        !isScoring99SequenceDartMatch(hit, expectedDart) &&
        nextVisit.length < 3 &&
        scoring99SessionSequence
      ) {
        const recalculated = recalculateScoring99SequenceAfterMiss(
          scoring99SessionSequence,
          nextVisit,
        );

        if (recalculated === "no-checkout") {
          setScoring99NoCheckout(true);
          setScoring99SessionsCompleted((count) => count + 1);
          setScoring99Session((session) => session + 1);
          setScoring99SessionSequence((current) => pickRandomScoring99Sequence(current));
          setVisitDarts([]);
          setHistory((current) => [...current, hit]);
          return;
        }

        setScoring99SessionSequence(recalculated);
      }

      setScoring99NoCheckout(false);

      if (nextVisit.length >= 3) {
        const visitTotal = nextVisit.reduce((sum, dart) => sum + dart.score, 0);

        if (visitTotal === SCORING_99_TARGET) {
          setScoring99Successes((count) => count + 1);
        }

        setScoring99SessionsCompleted((count) => count + 1);
        setScoring99Session((session) => session + 1);
        setScoring99SessionSequence((current) => pickRandomScoring99Sequence(current));
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

  const handleScoring99RoundSelect = (rounds: 10 | 20) => {
    setActiveGame(rounds === 10 ? "scoring-99-10" : "scoring-99-20");
    clearUndoStack();
    setVisitDarts([]);
    setHistory([]);
  };

  const handleTreble20DartInput = (kind: Treble20DartInputKind) => {
    throwDart(createTreble20DartInput(kind));
  };

  const handleTargetHit = () => {
    if (!isTargetPracticeMode || targetPracticeComplete) {
      return;
    }

    pushUndoSnapshot();

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

    if (isThreeInARowMode) {
      setThreeInARowStreak(0);
    }

    if (visitDarts.length === 0) {
      setDartsAtTarget((count) => count + 1);
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

    if (isScoring99Mode) {
      setScoring99Session(1);
      setScoring99Successes(0);
      setScoring99SessionsCompleted(0);
      setScoring99SessionSequence(pickRandomScoring99Sequence());
      setScoring99NoCheckout(false);
      setVisitDarts([]);
      setHistory([]);
      return;
    }

    if (isTreble20Mode) {
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

  const handleGameSelect = (gameId: typeof activeGame) => {
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

  const boardPracticeTarget =
    treble20Complete || !gameReady
      ? null
      : isScoring99Mode && !scoring99Complete
        ? getScoring99NextPracticeTarget(
            scoring99SessionSequence,
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
        New Session
      </TouchButton>
      <TouchButton
        variant="secondary"
        onClick={handleBack}
      >
        End Practice
      </TouchButton>
    </div>
  );

  const scorecard = isScoring99BaseGame(activeGame) ? (
    <PracticeScoring99Scorecard
      visitDarts={[]}
      currentSession={1}
      sessionLimit={10}
      successes={0}
      sessionsCompleted={0}
      sessionSequence={null}
      themePrimaryColor={themePrimaryColor}
      onSelectRoundCount={handleScoring99RoundSelect}
    />
  ) : isScoring99Mode && scoring99RoundLimit ? (
    <PracticeScoring99Scorecard
      visitDarts={visitDarts}
      currentSession={Math.min(scoring99Session, scoring99RoundLimit)}
      sessionLimit={scoring99RoundLimit}
      successes={scoring99Successes}
      sessionsCompleted={scoring99SessionsCompleted}
      sessionSequence={scoring99SessionSequence}
      noCheckout={scoring99NoCheckout}
      complete={scoring99Complete}
      themePrimaryColor={themePrimaryColor}
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
  ) : !gameReady ? (
    <p className="practice-scorecard__placeholder text-center text-sm text-muted-foreground">
      {isTreble20OnlyBaseGame(activeGame)
        ? "Select a dart limit to start practicing."
        : "Select a game to start practicing."}
    </p>
  ) : (
    <GlassPanel className="scorecard-panel text-center">
      {resolvedRoutine?.category === "timed" && remainingSeconds != null ? (
        <>
          <p className="practice-scorecard__label text-xs font-semibold uppercase tracking-[0.14em]">
            Time remaining
          </p>
          <p className="mt-2 text-5xl font-black tabular-nums">
            {formatCountdown(remainingSeconds)}
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label text-xs font-semibold uppercase tracking-[0.14em]">
            Visit total
          </p>
          <p className="practice-scorecard__total mt-2 font-black tabular-nums">{visitTotal}</p>
        </>
      )}
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
      <p className="mt-3 text-sm text-muted-foreground">
        Session darts: {history.length}
        {timedOut ? " · Time is up" : ""}
      </p>
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
            isScoring99Mode && !scoring99Complete
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
          practiceTargetHeavyPulse={isScoring99Mode && !scoring99Complete}
          disabled={
            !gameReady ||
            timedOut ||
            targetPracticeComplete ||
            treble20Complete ||
            scoring99Complete ||
            isTreble20Mode ||
            (isScoring99Mode && visitDarts.length >= 3) ||
            (!isTargetPracticeMode && !isScoring99Mode && visitDarts.length >= 3)
          }
        />
      }
    />
  );
}
