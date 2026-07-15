"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import type { BullChallengeDartInputKind } from "@/features/practice/lib/bull-challenge";
import {
  computeConsecutiveBullsStats,
  formatConsecutiveBullsAverage,
  type ConsecutiveBullsStreakTarget,
} from "@/features/practice/lib/consecutive-bulls";

interface PracticeConsecutiveBullsScorecardProps {
  visitDarts: DartHit[];
  sessionDarts: DartHit[];
  streakTarget: ConsecutiveBullsStreakTarget;
  onDartInput: (kind: BullChallengeDartInputKind) => void;
  onSelectStreakTarget?: (target: ConsecutiveBullsStreakTarget) => void;
}

export function PracticeConsecutiveBullsScorecard({
  visitDarts,
  sessionDarts,
  streakTarget,
  onDartInput,
  onSelectStreakTarget,
}: PracticeConsecutiveBullsScorecardProps) {
  const stats = computeConsecutiveBullsStats(sessionDarts, streakTarget);

  if (onSelectStreakTarget) {
    return (
      <GlassPanel className="scorecard-panel practice-consecutive-bulls-scorecard text-center">
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
          Consecutive Bulls
        </p>
        <p className="practice-consecutive-bulls-scorecard__rules mt-3 text-sm text-muted-foreground">
          Hit bulls in a row without a miss. Outer and inner bull each count as one hit.
        </p>
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
          Select streak
        </p>
        <div className="practice-consecutive-bulls-scorecard__streak-options mt-3 grid grid-cols-3 gap-2">
          <TouchButton
            size="md"
            className="min-w-0"
            variant="primary"
            onClick={() => onSelectStreakTarget(3)}
          >
            3 in a row
          </TouchButton>
          <TouchButton
            size="md"
            className="min-w-0"
            variant="primary"
            onClick={() => onSelectStreakTarget(5)}
          >
            5 in a row
          </TouchButton>
          <TouchButton
            size="md"
            className="min-w-0"
            variant="primary"
            onClick={() => onSelectStreakTarget(10)}
          >
            10 in a row
          </TouchButton>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="scorecard-panel practice-consecutive-bulls-scorecard text-center">
      <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
        In a row
      </p>
      <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
        {stats.currentStreak}/{streakTarget}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {visitDarts.map((dart, index) => (
          <span
            key={`${dart.label}-${index}`}
            className="practice-round-the-clock-scorecard__dart-chip rounded-2xl bg-surface px-4 py-2 font-bold"
          >
            {dart.label}
          </span>
        ))}
      </div>

      <div className="practice-consecutive-bulls-scorecard__stats mt-4">
        <div className="practice-consecutive-bulls-scorecard__stat">
          <span className="practice-consecutive-bulls-scorecard__stat-label">Best streak</span>
          <span className="practice-consecutive-bulls-scorecard__stat-value">{stats.bestStreak}</span>
        </div>
        <div className="practice-consecutive-bulls-scorecard__stat">
          <span className="practice-consecutive-bulls-scorecard__stat-label">Average streak</span>
          <span className="practice-consecutive-bulls-scorecard__stat-value">
            {formatConsecutiveBullsAverage(stats.averageStreak)}
          </span>
        </div>
        <div className="practice-consecutive-bulls-scorecard__stat">
          <span className="practice-consecutive-bulls-scorecard__stat-label">Longest miss-free</span>
          <span className="practice-consecutive-bulls-scorecard__stat-value">
            {stats.longestMissFreeRun}
          </span>
        </div>
      </div>

      <div className="practice-consecutive-bulls-scorecard__inputs mt-4 grid grid-cols-3 gap-2">
        <TouchButton
          size="md"
          className="min-w-0 px-2"
          variant="secondary"
          onClick={() => onDartInput("miss")}
        >
          Miss
        </TouchButton>
        <TouchButton
          size="md"
          className="min-w-0 px-2"
          variant="secondary"
          onClick={() => onDartInput("outer")}
        >
          25
        </TouchButton>
        <TouchButton
          size="md"
          className="min-w-0 px-2"
          variant="secondary"
          onClick={() => onDartInput("inner")}
        >
          50
        </TouchButton>
      </div>

      <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
        Sets completed:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">{stats.setsCompleted}</span>
        {" · "}
        Visit darts:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">{stats.dartsThrown}</span>
      </p>
    </GlassPanel>
  );
}
