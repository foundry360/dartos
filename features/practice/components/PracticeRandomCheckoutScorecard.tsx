"use client";

import { useState } from "react";
import type { DartHit } from "@/types/dart";
import type {
  PracticeCheckoutOutRule,
  RandomCheckoutAttemptCount,
  RandomCheckoutRangeId,
  RandomCheckoutSessionConfig,
} from "@/types/practice";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { TouchButton } from "@/components/ui/TouchButton";
import { getPracticeCheckoutOutRuleLabel } from "@/features/practice/lib/practice-checkout-rules";
import {
  buildRandomCheckoutSequence,
  getRandomCheckoutRemaining,
  isRandomCheckoutSequenceDartMatch,
  RANDOM_CHECKOUT_ATTEMPT_OPTIONS,
  RANDOM_CHECKOUT_OUT_RULE_OPTIONS,
  RANDOM_CHECKOUT_RANGE_OPTIONS,
  type RandomCheckoutVisitOutcome,
} from "@/features/practice/lib/random-checkout";
import { cn } from "@/utils/cn";

interface PracticeRandomCheckoutScorecardProps {
  variant: "picker" | "active";
  visitDarts: DartHit[];
  checkoutTarget: number;
  currentAttempt: number;
  attemptLimit: number;
  outRule: PracticeCheckoutOutRule;
  successes: number;
  attemptsCompleted: number;
  lastOutcome: RandomCheckoutVisitOutcome | null;
  complete?: boolean;
  onStart?: (config: RandomCheckoutSessionConfig) => void;
}

function getOutcomeLabel(outcome: RandomCheckoutVisitOutcome | null): string | null {
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

export function PracticeRandomCheckoutScorecard({
  variant,
  visitDarts,
  checkoutTarget,
  currentAttempt,
  attemptLimit,
  outRule,
  successes,
  attemptsCompleted,
  lastOutcome,
  complete = false,
  onStart,
}: PracticeRandomCheckoutScorecardProps) {
  const [range, setRange] = useState<RandomCheckoutRangeId>("full");
  const [attempts, setAttempts] = useState<RandomCheckoutAttemptCount>(10);
  const [selectedOutRule, setSelectedOutRule] = useState<PracticeCheckoutOutRule>("double_out");

  const remaining = getRandomCheckoutRemaining(checkoutTarget, visitDarts);
  const dartsRemaining = Math.max(0, 3 - visitDarts.length);
  const holdingFinishedVisit = lastOutcome != null && visitDarts.length > 0;
  const outcomeLabel = holdingFinishedVisit || complete ? getOutcomeLabel(lastOutcome) : null;
  // Empty visit with a leftover lastOutcome means the next attempt is already armed.
  const visitActive = !complete && !holdingFinishedVisit && visitDarts.length < 3;
  const checkoutSequence = visitActive
    ? buildRandomCheckoutSequence(checkoutTarget, visitDarts, outRule)
    : null;
  const noCheckout = checkoutSequence === "no-checkout";

  if (variant === "picker") {
    return (
      <GlassPanel className="scorecard-panel practice-random-checkout-scorecard text-center">
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
          Random Checkout
        </p>
        <p className="practice-random-checkout-scorecard__rules mt-3 text-sm text-muted-foreground">
          Finish randomly generated checkout scores in three darts.
        </p>

        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
          Checkout range
        </p>
        <PillToggleGroup
          className="mt-3"
          ariaLabel="Checkout range"
          layout="grid"
          size="sm"
          value={range}
          onChange={setRange}
          options={RANDOM_CHECKOUT_RANGE_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
        />

        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
          Attempts
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {RANDOM_CHECKOUT_ATTEMPT_OPTIONS.map((count) => (
            <TouchButton
              key={count}
              variant={attempts === count ? "primary" : "secondary"}
              onClick={() => setAttempts(count)}
            >
              {count}
            </TouchButton>
          ))}
        </div>

        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
          Finish rule
        </p>
        <PillToggleGroup
          className="mt-3"
          ariaLabel="Finish rule"
          layout="grid"
          size="sm"
          value={selectedOutRule}
          onChange={setSelectedOutRule}
          options={RANDOM_CHECKOUT_OUT_RULE_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
        />

        <TouchButton
          className="mt-4 w-full"
          variant="primary"
          onClick={() =>
            onStart?.({
              range,
              attempts,
              outRule: selectedOutRule,
            })
          }
        >
          Start
        </TouchButton>
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
          <p className="practice-round-the-clock-scorecard__darts-count practice-checkout-scorecard__attempt-count mt-1 font-black tabular-nums">
            {currentAttempt}/{attemptLimit}
          </p>

          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Target checkout
          </p>
          <p className="practice-random-checkout-scorecard__target mt-1 font-black tabular-nums">
            {checkoutTarget}
          </p>
          <p className="practice-random-checkout-scorecard__visit-meta mt-1 text-sm text-muted-foreground">
            {getPracticeCheckoutOutRuleLabel(outRule)}
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
                  const matched = thrown ? isRandomCheckoutSequenceDartMatch(thrown, dart) : false;

                  return (
                    <span
                      key={`${dart.label}-${index}`}
                      className={cn(
                        "practice-random-checkout-scorecard__sequence-dart rounded-2xl px-4 py-2 font-bold",
                        index === visitDarts.length &&
                          "practice-random-checkout-scorecard__sequence-dart--active",
                        thrown && matched &&
                          "practice-random-checkout-scorecard__sequence-dart--matched",
                        thrown && !matched &&
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
                lastOutcome === "missed" && "practice-random-checkout-scorecard__outcome--missed",
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
          <span className="practice-random-checkout-scorecard__stat-value">{attemptsCompleted}</span>
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
