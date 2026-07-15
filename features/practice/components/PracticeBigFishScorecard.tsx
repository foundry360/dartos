"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  BIG_FISH_LADDER_RUNGS,
  buildBigFishSequence,
  getBigFishRemaining,
  isBigFishSequenceDartMatch,
  type BigFishVisitOutcome,
} from "@/features/practice/lib/big-fish";
import { cn } from "@/utils/cn";

type BigFishScorecardVariant = "picker" | "random" | "ladder";

interface PracticeBigFishScorecardProps {
  variant: BigFishScorecardVariant;
  visitDarts: DartHit[];
  checkoutTarget: number;
  currentVisit: number;
  visitLimit: number;
  ladderRungIndex: number;
  successes: number;
  visitsCompleted: number;
  lastOutcome: BigFishVisitOutcome | null;
  complete?: boolean;
  onSelectRoundCount?: (rounds: 10 | 20) => void;
  onSelectLadder?: () => void;
}

function getOutcomeLabel(outcome: BigFishVisitOutcome | null): string | null {
  switch (outcome) {
    case "checkout":
      return "Big Fish!";
    case "bust":
      return "Bust";
    case "missed":
      return "Missed checkout";
    default:
      return null;
  }
}

export function PracticeBigFishScorecard({
  variant,
  visitDarts,
  checkoutTarget,
  currentVisit,
  visitLimit,
  ladderRungIndex,
  successes,
  visitsCompleted,
  lastOutcome,
  complete = false,
  onSelectRoundCount,
  onSelectLadder,
}: PracticeBigFishScorecardProps) {
  const remaining = getBigFishRemaining(checkoutTarget, visitDarts);
  const dartsRemaining = Math.max(0, 3 - visitDarts.length);
  const holdingFinishedVisit = lastOutcome != null && visitDarts.length > 0;
  const outcomeLabel = holdingFinishedVisit || complete ? getOutcomeLabel(lastOutcome) : null;
  const isLadder = variant === "ladder";
  const ladderRungCount = BIG_FISH_LADDER_RUNGS.length;
  // Empty visit with a leftover lastOutcome means the next attempt is already armed.
  const visitActive = !complete && !holdingFinishedVisit && visitDarts.length < 3;
  const checkoutSequence = visitActive ? buildBigFishSequence(checkoutTarget, visitDarts) : null;
  const noCheckout = checkoutSequence === "no-checkout";

  if (variant === "picker") {
    return (
      <GlassPanel className="scorecard-panel practice-big-fish-scorecard text-center">
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
          Big Fish
        </p>
        <p className="practice-big-fish-scorecard__rules mt-3 text-sm text-muted-foreground">
          Finish high checkouts from 100–170 in three darts. Double out required — finish on a
          double or bullseye.
        </p>
        <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
          Select mode
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TouchButton variant="primary" onClick={() => onSelectRoundCount?.(10)}>
            10 visits
          </TouchButton>
          <TouchButton variant="primary" onClick={() => onSelectRoundCount?.(20)}>
            20 visits
          </TouchButton>
          <TouchButton
            className="col-span-2"
            variant="primary"
            onClick={() => onSelectLadder?.()}
          >
            Ladder · 100–170
          </TouchButton>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="scorecard-panel practice-big-fish-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-round-the-clock-target practice-round-the-clock-target--complete mt-3 font-black">
            {isLadder
              ? `${ladderRungCount}/${ladderRungCount} rungs`
              : `${successes}/${visitLimit} big fish`}
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            {isLadder ? "Rung" : "Visit"}
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count practice-checkout-scorecard__attempt-count mt-1 font-black tabular-nums">
            {isLadder
              ? `${Math.min(ladderRungIndex + 1, ladderRungCount)}/${ladderRungCount}`
              : `${currentVisit}/${visitLimit}`}
          </p>

          {isLadder ? (
            <div className="practice-big-fish-scorecard__ladder mt-3 flex flex-wrap justify-center gap-1.5">
              {BIG_FISH_LADDER_RUNGS.map((rung, index) => (
                <span
                  key={rung}
                  className={cn(
                    "practice-big-fish-scorecard__ladder-rung rounded-xl px-2.5 py-1 text-xs font-bold tabular-nums",
                    index < ladderRungIndex && "practice-big-fish-scorecard__ladder-rung--cleared",
                    index === ladderRungIndex &&
                      !holdingFinishedVisit &&
                      "practice-big-fish-scorecard__ladder-rung--active",
                    index > ladderRungIndex && "practice-big-fish-scorecard__ladder-rung--pending",
                  )}
                >
                  {rung}
                </span>
              ))}
            </div>
          ) : null}

          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Target checkout
          </p>
          <p className="practice-big-fish-scorecard__target mt-1 font-black tabular-nums">
            {checkoutTarget}
          </p>

          {noCheckout ? (
            <p className="practice-big-fish-scorecard__no-checkout mt-4 font-black uppercase tracking-[0.12em]">
              No checkout
            </p>
          ) : checkoutSequence ? (
            <>
              <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
                Checkout sequence
              </p>
              <div className="practice-big-fish-scorecard__sequence mt-3 flex flex-wrap justify-center gap-2">
                {checkoutSequence.darts.map((dart, index) => {
                  const thrown = visitDarts[index];
                  const matched = thrown ? isBigFishSequenceDartMatch(thrown, dart) : false;

                  return (
                    <span
                      key={`${dart.label}-${index}`}
                      className={cn(
                        "practice-big-fish-scorecard__sequence-dart rounded-2xl px-4 py-2 font-bold",
                        index === visitDarts.length &&
                          "practice-big-fish-scorecard__sequence-dart--active",
                        thrown && matched && "practice-big-fish-scorecard__sequence-dart--matched",
                        thrown && !matched && "practice-big-fish-scorecard__sequence-dart--missed",
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
                "practice-big-fish-scorecard__outcome mt-3 font-black uppercase tracking-[0.12em]",
                lastOutcome === "checkout" && "practice-big-fish-scorecard__outcome--success",
                lastOutcome === "bust" && "practice-big-fish-scorecard__outcome--bust",
                lastOutcome === "missed" && "practice-big-fish-scorecard__outcome--missed",
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
            className="practice-big-fish-scorecard__remaining mt-1 font-black tabular-nums"
            data-checkout={remaining === 0 || undefined}
            data-bust={remaining < 0 || remaining === 1 || undefined}
          >
            {Math.max(0, remaining)}
          </p>
          <p className="practice-big-fish-scorecard__visit-meta mt-1 text-sm text-muted-foreground">
            {dartsRemaining} dart{dartsRemaining === 1 ? "" : "s"} left · double out
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

      <div className="practice-big-fish-scorecard__stats mt-4">
        <div className="practice-big-fish-scorecard__stat">
          <span className="practice-big-fish-scorecard__stat-label">
            {isLadder ? "Rungs cleared" : "Big fish"}
          </span>
          <span className="practice-big-fish-scorecard__stat-value">{successes}</span>
        </div>
        <div className="practice-big-fish-scorecard__stat">
          <span className="practice-big-fish-scorecard__stat-label">Attempts</span>
          <span className="practice-big-fish-scorecard__stat-value">{visitsCompleted}</span>
        </div>
      </div>

      {!isLadder ? (
        <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
          Hit rate:{" "}
          <span className="practice-round-the-clock-scorecard__footer-count">
            {visitsCompleted > 0 ? `${successes}/${visitsCompleted}` : `${successes}/0`}
          </span>
        </p>
      ) : null}
    </GlassPanel>
  );
}
