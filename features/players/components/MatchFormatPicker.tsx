"use client";

import { SetupSection } from "@/components/ui/SetupSection";
import { ValueSlider } from "@/components/ui/ValueSlider";

interface MatchFormatPickerProps {
  legsToWin: number;
  setsToWin: number;
  onLegsChange: (legs: number) => void;
  onSetsChange: (sets: number) => void;
  minLegs?: number;
  maxLegs?: number;
  minSets?: number;
  maxSets?: number;
  embedded?: boolean;
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
  embedded = false,
}: MatchFormatPickerProps) {
  const content = (
    <div className="setup-section__stack">
      <ValueSlider
        label="Legs to win set"
        value={legsToWin}
        min={minLegs}
        max={maxLegs}
        onChange={onLegsChange}
      />
      <ValueSlider
        label="Sets to win match"
        value={setsToWin}
        min={minSets}
        max={maxSets}
        onChange={onSetsChange}
      />
      <p className="setup-section__footnote">
        First to {legsToWin} leg{legsToWin === 1 ? "" : "s"} per set · Best of {setsToWin} set
        {setsToWin === 1 ? "" : "s"}
      </p>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <SetupSection
      title="Match format"
      description="Set the legs and sets needed to win."
    >
      {content}
    </SetupSection>
  );
}
