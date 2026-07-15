"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  SCORING_99_TARGET,
  type Scoring99Sequence,
} from "@/features/practice/lib/scoring-99";
import { cn } from "@/utils/cn";

interface PracticeScoring99ScorecardProps {
  visitDarts: DartHit[];
  currentVisit: number;
  visitLimit: number;
  successes: number;
  visitsCompleted: number;
  visitSequence: Scoring99Sequence | null;
  noCheckout?: boolean;
  complete?: boolean;
  onSelectRoundCount?: (rounds: 10 | 20) => void;
}

export function PracticeScoring99Scorecard({
  visitDarts,
  currentVisit,
  visitLimit,
  successes,
  visitsCompleted,
  visitSequence,
  noCheckout = false,
  complete = false,
  onSelectRoundCount,
}: PracticeScoring99ScorecardProps) {
  const visitTotal = visitDarts.reduce((sum, dart) => sum + dart.score, 0);
  const dartsRemaining = Math.max(0, 3 - visitDarts.length);
  const isExact = visitTotal === SCORING_99_TARGET;
  const isBust = visitDarts.length === 3 && !isExact;

  if (onSelectRoundCount) {
    return (
      <GlassPanel className="scorecard-panel practice-scoring-99-scorecard text-center">
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
          Scoring 99
        </p>
        <p className="practice-scoring-99-scorecard__rules mt-3 text-sm text-muted-foreground">
          Throw 3 darts per visit. Miss a dart and the remaining path recalculates to reach 99. No
          valid finish means no checkout.
        </p>
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
          Select visits
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TouchButton variant="primary" onClick={() => onSelectRoundCount(10)}>
            10 visits
          </TouchButton>
          <TouchButton variant="primary" onClick={() => onSelectRoundCount(20)}>
            20 visits
          </TouchButton>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="scorecard-panel practice-scoring-99-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-round-the-clock-target practice-round-the-clock-target--complete mt-3 font-black">
            {successes}/{visitLimit} exact 99s
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Visit
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {currentVisit}/{visitLimit}
          </p>

          {noCheckout ? (
            <p className="practice-scoring-99-scorecard__no-checkout mt-4 font-black uppercase tracking-[0.12em]">
              No checkout
            </p>
          ) : visitSequence ? (
            <>
              <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
                Hit sequence
              </p>
              <div className="practice-scoring-99-scorecard__sequence mt-3 flex flex-wrap justify-center gap-2">
                {visitSequence.darts.map((dart, index) => {
                  const thrown = visitDarts[index];
                  const matched = thrown?.label === dart.label;

                  return (
                    <span
                      key={`${dart.label}-${index}`}
                      className={cn(
                        "practice-scoring-99-scorecard__sequence-dart rounded-2xl px-4 py-2 font-bold",
                        index === visitDarts.length && "practice-scoring-99-scorecard__sequence-dart--active",
                        matched && "practice-scoring-99-scorecard__sequence-dart--matched",
                        thrown && !matched && "practice-scoring-99-scorecard__sequence-dart--missed",
                      )}
                    >
                      {dart.label}
                    </span>
                  );
                })}
              </div>
            </>
          ) : null}
        </>
      )}

      {!complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Visit total
          </p>
          <p
            className="practice-scoring-99-scorecard__visit-total mt-1 font-black tabular-nums"
            data-exact={isExact || undefined}
            data-bust={isBust || undefined}
          >
            {visitTotal}
          </p>
          <p className="practice-scoring-99-scorecard__visit-meta mt-1 text-sm text-muted-foreground">
            {dartsRemaining} dart{dartsRemaining === 1 ? "" : "s"} left · target {SCORING_99_TARGET}
          </p>
        </>
      ) : null}

      {visitDarts.length > 0 ? (
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
      ) : null}

      <div className="practice-scoring-99-scorecard__stats mt-4">
        <div className="practice-scoring-99-scorecard__stat">
          <span className="practice-scoring-99-scorecard__stat-label">Exact 99s</span>
          <span className="practice-scoring-99-scorecard__stat-value">{successes}</span>
        </div>
        <div className="practice-scoring-99-scorecard__stat">
          <span className="practice-scoring-99-scorecard__stat-label">Visits done</span>
          <span className="practice-scoring-99-scorecard__stat-value">{visitsCompleted}</span>
        </div>
      </div>

      <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
        Hit rate:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">
          {visitsCompleted > 0 ? `${successes}/${visitsCompleted}` : `${successes}/0`}
        </span>
      </p>
    </GlassPanel>
  );
}
