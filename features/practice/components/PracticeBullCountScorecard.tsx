"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import type { BullChallengeDartInputKind } from "@/features/practice/lib/bull-challenge";
import {
  BULL_COUNT_DART_LIMIT,
  BULL_COUNT_VISIT_LIMIT,
  computeBullCountStats,
  formatBullCountPercentage,
  getBullCountPercentage,
  getCurrentBullCountVisit,
} from "@/features/practice/lib/bull-count";

interface PracticeBullCountScorecardProps {
  visitDarts: DartHit[];
  sessionDarts: DartHit[];
  complete?: boolean;
  onDartInput: (kind: BullChallengeDartInputKind) => void;
}

export function PracticeBullCountScorecard({
  visitDarts,
  sessionDarts,
  complete = false,
  onDartInput,
}: PracticeBullCountScorecardProps) {
  const stats = computeBullCountStats(sessionDarts);
  const dartsRemaining = Math.max(0, BULL_COUNT_DART_LIMIT - stats.dartsThrown);
  const visitsRemaining = Math.max(0, BULL_COUNT_VISIT_LIMIT - stats.visitsCompleted);
  const currentVisit = getCurrentBullCountVisit(stats.dartsThrown);
  const bullPercentage = getBullCountPercentage(stats.bullsHit, stats.dartsThrown);
  const innerBullPercentage = getBullCountPercentage(stats.innerBulls, stats.dartsThrown);
  const outerBullPercentage = getBullCountPercentage(stats.outerBulls, stats.dartsThrown);

  return (
    <GlassPanel className="scorecard-panel practice-bull-count-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-round-the-clock-target practice-round-the-clock-target--complete mt-3 font-black">
            {stats.bullsHit} bulls
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Visit
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {currentVisit}/{BULL_COUNT_VISIT_LIMIT}
          </p>
          <p className="practice-bull-count-scorecard__meta mt-1 text-sm text-muted-foreground">
            {dartsRemaining} darts left · {visitsRemaining} visits left
          </p>
        </>
      )}

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

      <div className="practice-bull-count-scorecard__stats mt-4">
        <div className="practice-bull-count-scorecard__stat">
          <span className="practice-bull-count-scorecard__stat-label">Bulls hit</span>
          <span className="practice-bull-count-scorecard__stat-value">{stats.bullsHit}</span>
        </div>
        <div className="practice-bull-count-scorecard__stat">
          <span className="practice-bull-count-scorecard__stat-label">Bull %</span>
          <span className="practice-bull-count-scorecard__stat-value">
            {formatBullCountPercentage(bullPercentage)}
          </span>
        </div>
        <div className="practice-bull-count-scorecard__stat">
          <span className="practice-bull-count-scorecard__stat-label">Inner bull %</span>
          <span className="practice-bull-count-scorecard__stat-value">
            {formatBullCountPercentage(innerBullPercentage)}
          </span>
        </div>
        <div className="practice-bull-count-scorecard__stat">
          <span className="practice-bull-count-scorecard__stat-label">Outer bull %</span>
          <span className="practice-bull-count-scorecard__stat-value">
            {formatBullCountPercentage(outerBullPercentage)}
          </span>
        </div>
        <div className="practice-bull-count-scorecard__stat">
          <span className="practice-bull-count-scorecard__stat-label">Best streak</span>
          <span className="practice-bull-count-scorecard__stat-value">{stats.bestStreak}</span>
        </div>
      </div>

      {!complete ? (
        <div className="practice-bull-count-scorecard__inputs mt-4 grid grid-cols-3 gap-2">
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
            variant="primary"
            onClick={() => onDartInput("inner")}
          >
            50
          </TouchButton>
        </div>
      ) : null}

      <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
        Darts thrown:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">
          {stats.dartsThrown}/{BULL_COUNT_DART_LIMIT}
        </span>
        {!complete && stats.currentStreak > 0 ? (
          <>
            {" · "}
            Current streak:{" "}
            <span className="practice-round-the-clock-scorecard__footer-count">
              {stats.currentStreak}
            </span>
          </>
        ) : null}
      </p>
    </GlassPanel>
  );
}
