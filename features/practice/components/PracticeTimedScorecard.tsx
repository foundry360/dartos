"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { getPracticeGameDefinition } from "@/features/practice/lib/practice-routines";
import type { TimedPracticeGameId } from "@/types/practice";

interface PracticeTimedScorecardProps {
  activeGame: TimedPracticeGameId;
  remainingSeconds: number;
  running: boolean;
  timedOut: boolean;
  themePrimaryColor: string;
  onStart: () => void;
  onStop: () => void;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PracticeTimedScorecard({
  activeGame,
  remainingSeconds,
  running,
  timedOut,
  themePrimaryColor,
  onStart,
  onStop,
}: PracticeTimedScorecardProps) {
  const durationLabel = getPracticeGameDefinition(activeGame)?.label ?? activeGame;

  return (
    <GlassPanel className="scorecard-panel practice-timed-scorecard text-center">
      <p className="practice-timed-scorecard__duration font-black">{durationLabel}</p>

      <p className="practice-scorecard__label practice-round-the-clock-scorecard__label mt-4 font-semibold uppercase tracking-[0.14em]">
        {timedOut ? "Time is up" : "Time remaining"}
      </p>
      <p className="practice-timed-scorecard__countdown mt-2 font-black tabular-nums">
        {formatCountdown(remainingSeconds)}
      </p>

      <div className="practice-timed-scorecard__actions mt-5">
        <TouchButton accentColor={themePrimaryColor} onClick={onStart} disabled={running || timedOut}>
          Start
        </TouchButton>
        <TouchButton variant="secondary" onClick={onStop} disabled={!running}>
          Stop
        </TouchButton>
      </div>
    </GlassPanel>
  );
}
