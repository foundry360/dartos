"use client";

import type { DartHit } from "@/types/dart";
import type { ThreeDartCheckoutAttemptCount } from "@/types/practice";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  buildThreeDartCheckoutSequence,
  getThreeDartCheckoutRemaining,
  isThreeDartCheckoutSequenceDartMatch,
  THREE_DART_CHECKOUT_ATTEMPT_OPTIONS,
  type ThreeDartCheckoutVisitOutcome,
} from "@/features/practice/lib/three-dart-checkout";
import { cn } from "@/utils/cn";

interface PracticeThreeDartCheckoutScorecardProps {
  variant: "picker" | "active";
  visitDarts: DartHit[];
  checkoutTarget: number;
  currentAttempt: number;
  attemptLimit: number;
  successes: number;
  attemptsCompleted: number;
  lastOutcome: ThreeDartCheckoutVisitOutcome | null;
  complete?: boolean;
  themePrimaryColor: string;
  onSelectAttemptCount?: (attempts: ThreeDartCheckoutAttemptCount) => void;
}

function getOutcomeLabel(outcome: ThreeDartCheckoutVisitOutcome | null): string | null {
  switch (outcome) {
    case "checkout":
      return "Checkout!";
    case "bust":
      return "Bust";
    case "missed":
      return "Missed checkout";
    default:
      return null;
  }
}

export function PracticeThreeDartCheckoutScorecard({
  variant,
  visitDarts,
  checkoutTarget,
  currentAttempt,
  attemptLimit,
  successes,
  attemptsCompleted,
  lastOutcome,
  complete = false,
  themePrimaryColor,
  onSelectAttemptCount,
}: PracticeThreeDartCheckoutScorecardProps) {
  const remaining = getThreeDartCheckoutRemaining(checkoutTarget, visitDarts);
  const dartsRemaining = Math.max(0, 3 - visitDarts.length);
  const outcomeLabel = getOutcomeLabel(lastOutcome);
  const visitActive = !complete && lastOutcome == null && visitDarts.length < 3;
  const checkoutSequence = visitActive
    ? buildThreeDartCheckoutSequence(checkoutTarget, visitDarts)
    : null;
  const noCheckout = checkoutSequence === "no-checkout";

  if (variant === "picker") {
    return (
      <GlassPanel className="scorecard-panel practice-random-checkout-scorecard text-center">
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
          Attempts
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THREE_DART_CHECKOUT_ATTEMPT_OPTIONS.map((count) => (
            <TouchButton
              key={count}
              accentColor={themePrimaryColor}
              onClick={() => onSelectAttemptCount?.(count)}
            >
              {count}
            </TouchButton>
          ))}
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="scorecard-panel practice-random-checkout-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-round-the-clock-target practice-round-the-clock-target--complete mt-3 font-black">
            {successes}/{attemptLimit} checkouts
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Attempt
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {currentAttempt}/{attemptLimit}
          </p>

          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Target checkout
          </p>
          <p className="practice-random-checkout-scorecard__target mt-1 font-black tabular-nums">
            {checkoutTarget}
          </p>

          {noCheckout ? (
            <p className="practice-random-checkout-scorecard__no-checkout mt-4 font-black uppercase tracking-[0.12em]">
              No checkout
            </p>
          ) : checkoutSequence ? (
            <>
              <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
                Checkout sequence
              </p>
              <div className="practice-random-checkout-scorecard__sequence mt-3 flex flex-wrap justify-center gap-2">
                {checkoutSequence.darts.map((dart, index) => {
                  const thrown = visitDarts[index];
                  const matched = thrown
                    ? isThreeDartCheckoutSequenceDartMatch(thrown, dart)
                    : false;

                  return (
                    <span
                      key={`${dart.label}-${index}`}
                      className={cn(
                        "practice-random-checkout-scorecard__sequence-dart rounded-2xl px-4 py-2 font-bold",
                        index === visitDarts.length &&
                          "practice-random-checkout-scorecard__sequence-dart--active",
                        thrown &&
                          matched &&
                          "practice-random-checkout-scorecard__sequence-dart--matched",
                        thrown &&
                          !matched &&
                          "practice-random-checkout-scorecard__sequence-dart--missed",
                      )}
                    >
                      {dart.label}
                    </span>
                  );
                })}
              </div>
            </>
          ) : null}

          {outcomeLabel ? (
            <p
              className={cn(
                "practice-random-checkout-scorecard__outcome mt-3 font-black uppercase tracking-[0.12em]",
                lastOutcome === "checkout" &&
                  "practice-random-checkout-scorecard__outcome--success",
                lastOutcome === "bust" && "practice-random-checkout-scorecard__outcome--bust",
                lastOutcome === "missed" &&
                  "practice-random-checkout-scorecard__outcome--missed",
              )}
            >
              {outcomeLabel}
            </p>
          ) : null}
        </>
      )}

      {!complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Remaining
          </p>
          <p
            className="practice-random-checkout-scorecard__remaining mt-1 font-black tabular-nums"
            data-checkout={remaining === 0 || undefined}
            data-bust={remaining < 0 || remaining === 1 || undefined}
          >
            {Math.max(0, remaining)}
          </p>
          <p className="practice-random-checkout-scorecard__visit-meta mt-1 text-sm text-muted-foreground">
            {dartsRemaining} dart{dartsRemaining === 1 ? "" : "s"} left
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

      <div className="practice-random-checkout-scorecard__stats mt-4">
        <div className="practice-random-checkout-scorecard__stat">
          <span className="practice-random-checkout-scorecard__stat-label">Checkouts</span>
          <span className="practice-random-checkout-scorecard__stat-value">{successes}</span>
        </div>
        <div className="practice-random-checkout-scorecard__stat">
          <span className="practice-random-checkout-scorecard__stat-label">Attempts done</span>
          <span className="practice-random-checkout-scorecard__stat-value">
            {attemptsCompleted}
          </span>
        </div>
      </div>

      <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
        Hit rate:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">
          {attemptsCompleted > 0 ? `${successes}/${attemptsCompleted}` : `${successes}/0`}
        </span>
      </p>
    </GlassPanel>
  );
}
