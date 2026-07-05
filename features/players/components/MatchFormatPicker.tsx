"use client";

import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";

interface MatchFormatPickerProps {
  legsToWin: number;
  setsToWin: number;
  onLegsChange: (legs: number) => void;
  onSetsChange: (sets: number) => void;
  minLegs?: number;
  maxLegs?: number;
  minSets?: number;
  maxSets?: number;
}

export function MatchFormatPicker({
  legsToWin,
  setsToWin,
  onLegsChange,
  onSetsChange,
  minLegs = 1,
  maxLegs = 7,
  minSets = 1,
  maxSets = 5,
}: MatchFormatPickerProps) {
  return (
    <GlassPanel className="w-full min-w-0">
      <h3 className="text-lg font-bold">Match format</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        First to {legsToWin} leg{legsToWin === 1 ? "" : "s"} per set · Best of {setsToWin} set
        {setsToWin === 1 ? "" : "s"}
      </p>

      <div className="mt-4 space-y-4">
        <FormatStepper
          label="Legs to win set"
          value={legsToWin}
          min={minLegs}
          max={maxLegs}
          onChange={onLegsChange}
        />
        <FormatStepper
          label="Sets to win match"
          value={setsToWin}
          min={minSets}
          max={maxSets}
          onChange={onSetsChange}
        />
      </div>
    </GlassPanel>
  );
}

function FormatStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <TouchButton
          variant="secondary"
          size="md"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          −
        </TouchButton>
        <span className="min-w-[2rem] text-center text-2xl font-bold">{value}</span>
        <TouchButton
          variant="secondary"
          size="md"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          +
        </TouchButton>
      </div>
    </div>
  );
}
