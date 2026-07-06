"use client";

import type { DartHit } from "@/types/dart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  computeTreble20Stats,
  formatTreble20Average,
  formatTreble20Percentage,
  getTreble20AverageScorePerDart,
  getTreble20HitPercentage,
  type Treble20DartInputKind,
} from "@/features/practice/lib/treble-20-only";

interface PracticeTreble20ScorecardProps {
  visitDarts: DartHit[];
  sessionDarts: DartHit[];
  dartLimit: number;
  complete?: boolean;
  themePrimaryColor: string;
  onDartInput: (kind: Treble20DartInputKind) => void;
}

export function PracticeTreble20Scorecard({
  visitDarts,
  sessionDarts,
  dartLimit,
  complete = false,
  themePrimaryColor,
  onDartInput,
}: PracticeTreble20ScorecardProps) {
  const stats = computeTreble20Stats(sessionDarts);
  const dartsRemaining = Math.max(0, dartLimit - stats.dartsThrown);
  const hitPercentage = getTreble20HitPercentage(stats);
  const averageScore = getTreble20AverageScorePerDart(stats);

  return (
    <GlassPanel className="scorecard-panel practice-treble-20-scorecard text-center">
      {complete ? (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Complete
          </p>
          <p className="practice-round-the-clock-target practice-round-the-clock-target--complete mt-3 font-black">
            {dartLimit} darts thrown
          </p>
        </>
      ) : (
        <>
          <p className="practice-scorecard__label practice-round-the-clock-scorecard__label font-semibold uppercase tracking-[0.14em]">
            Darts remaining
          </p>
          <p className="practice-round-the-clock-scorecard__darts-count mt-1 font-black tabular-nums">
            {dartsRemaining}
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

      <div className="practice-treble-20-scorecard__stats mt-4">
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">T20 hits</span>
          <span className="practice-treble-20-scorecard__stat-value">{stats.t20Hits}</span>
        </div>
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">S20 hits</span>
          <span className="practice-treble-20-scorecard__stat-value">{stats.s20Hits}</span>
        </div>
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">D20 hits</span>
          <span className="practice-treble-20-scorecard__stat-value">{stats.d20Hits}</span>
        </div>
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">Misses</span>
          <span className="practice-treble-20-scorecard__stat-value">{stats.misses}</span>
        </div>
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">Hit %</span>
          <span className="practice-treble-20-scorecard__stat-value">
            {formatTreble20Percentage(hitPercentage)}
          </span>
        </div>
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">Best streak</span>
          <span className="practice-treble-20-scorecard__stat-value">{stats.bestStreak}</span>
        </div>
        <div className="practice-treble-20-scorecard__stat">
          <span className="practice-treble-20-scorecard__stat-label">Avg / dart</span>
          <span className="practice-treble-20-scorecard__stat-value">
            {formatTreble20Average(averageScore)}
          </span>
        </div>
      </div>

      {!complete ? (
        <div className="practice-treble-20-scorecard__inputs mt-4 grid grid-cols-4 gap-2">
          <TouchButton size="md" className="min-w-0 px-2" variant="secondary" onClick={() => onDartInput("miss")}>
            Miss
          </TouchButton>
          <TouchButton size="md" className="min-w-0 px-2" variant="secondary" onClick={() => onDartInput("s20")}>
            S20
          </TouchButton>
          <TouchButton size="md" className="min-w-0 px-2" variant="secondary" onClick={() => onDartInput("d20")}>
            D20
          </TouchButton>
          <TouchButton size="md" className="min-w-0 px-2" accentColor={themePrimaryColor} onClick={() => onDartInput("t20")}>
            T20
          </TouchButton>
        </div>
      ) : null}

      <p className="practice-round-the-clock-scorecard__footer mt-3 text-muted-foreground">
        Darts thrown:{" "}
        <span className="practice-round-the-clock-scorecard__footer-count">
          {stats.dartsThrown}/{dartLimit}
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
