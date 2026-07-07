"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  BULL_CHALLENGE_TARGET,
  computeBullChallengeStats,
  formatBullChallengeElapsed,
  type BullChallengeDartInputKind,
} from "@/features/practice/lib/bull-challenge";
import { TouchButton } from "@/components/ui/TouchButton";

interface PracticeBullChallengeScorecardProps {
  visitDarts: DartHit[];
  sessionDarts: DartHit[];
  elapsedSeconds: number;
  complete?: boolean;
  themePrimaryColor: string;
  onDartInput: (kind: BullChallengeDartInputKind) => void;
}

export function PracticeBullChallengeScorecard({
  visitDarts,
  sessionDarts,
  elapsedSeconds,
  complete = false,
  themePrimaryColor,
  onDartInput,
}: PracticeBullChallengeScorecardProps) {
  const stats = computeBullChallengeStats(sessionDarts);

  return (
    <GlassPanel className="scorecard-panel practice-bull-challenge-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-round-the-clock-target practice-round-the-clock-target--complete mt-3 font-black">
            {BULL_CHALLENGE_TARGET} bulls
          </p>
          <p className="practice-bull-challenge-scorecard__complete-meta mt-2 text-muted-foreground">
            {formatBullChallengeElapsed(elapsedSeconds)} · {stats.dartsThrown} darts
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Bulls hit
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {stats.bullsHit}/{BULL_CHALLENGE_TARGET}
          </p>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
            Time
          </p>
          <p className="practice-bull-challenge-scorecard__time mt-1 font-black tabular-nums">
            {formatBullChallengeElapsed(elapsedSeconds)}
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

      <div className="practice-bull-challenge-scorecard__stats mt-4">
        <div className="practice-bull-challenge-scorecard__stat">
          <span className="practice-bull-challenge-scorecard__stat-label">Outer bull</span>
          <span className="practice-bull-challenge-scorecard__stat-value">{stats.outerBulls}</span>
        </div>
        <div className="practice-bull-challenge-scorecard__stat">
          <span className="practice-bull-challenge-scorecard__stat-label">Inner bull</span>
          <span className="practice-bull-challenge-scorecard__stat-value">{stats.innerBulls}</span>
        </div>
        <div className="practice-bull-challenge-scorecard__stat">
          <span className="practice-bull-challenge-scorecard__stat-label">Misses</span>
          <span className="practice-bull-challenge-scorecard__stat-value">{stats.misses}</span>
        </div>
        <div className="practice-bull-challenge-scorecard__stat">
          <span className="practice-bull-challenge-scorecard__stat-label">Darts thrown</span>
          <span className="practice-bull-challenge-scorecard__stat-value">{stats.dartsThrown}</span>
        </div>
      </div>

      {!complete ? (
        <div className="practice-bull-challenge-scorecard__inputs mt-4 grid grid-cols-3 gap-2">
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
            accentColor={themePrimaryColor}
            onClick={() => onDartInput("inner")}
          >
            50
          </TouchButton>
        </div>
      ) : null}
    </GlassPanel>
  );
}
