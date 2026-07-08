"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import type { PracticeTargetDisplay } from "@/features/practice/lib/round-the-clock";

interface PracticeTargetScorecardProps {
  target: PracticeTargetDisplay | null;
  dartsAtTarget: number;
  visitDarts: DartHit[];
  sessionDarts: number;
  targetsHit?: number;
  targetsHitLabel?: string;
  counterLabel?: string;
  counterValue?: string;
  complete?: boolean;
  themePrimaryColor: string;
  onHit: () => void;
  onMiss: () => void;
}

export function PracticeTargetScorecard({
  target,
  dartsAtTarget,
  visitDarts,
  sessionDarts,
  targetsHit,
  targetsHitLabel = "Targets hit",
  counterLabel = "Darts at number",
  counterValue,
  complete = false,
  themePrimaryColor,
  onHit,
  onMiss,
}: PracticeTargetScorecardProps) {
  return (
    <GlassPanel className="scorecard-panel practice-round-the-clock-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Total darts
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {sessionDarts}
          </p>
        </>
      ) : target ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Shoot for
          </p>
          <div className="practice-round-the-clock-target mt-3 font-black tabular-nums">
            {target.label}
          </div>
          <p className="practice-round-the-clock-scorecard__sublabel mt-2 text-muted-foreground">
            {target.displayLabel}
          </p>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            {counterLabel}
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {counterValue ?? dartsAtTarget}
          </p>
        </>
      ) : null}

      {!complete ? (
        <>
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

          <div className="mt-4 grid grid-cols-2 gap-2">
            <TouchButton variant="secondary" onClick={onMiss} disabled={complete}>
              Miss
            </TouchButton>
            <TouchButton accentColor={themePrimaryColor} onClick={onHit} disabled={complete}>
              Hit
            </TouchButton>
          </div>
        </>
      ) : null}

      <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
        {targetsHit != null ? (
          <>
            {targetsHitLabel}:{" "}
            <span className="practice-round-the-clock-scorecard__footer-count">{targetsHit}</span>
            {" · "}
          </>
        ) : null}
        Total darts:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">{sessionDarts}</span>
      </p>
    </GlassPanel>
  );
}
