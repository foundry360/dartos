"use client";

import { useRef, useState } from "react";
import type { CricketVariant } from "@/lib/constants";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type { CricketMatchSetup } from "@/types/player-setup";

interface CricketSetupFormProps {
  legsToWin: number;
  setsToWin: number;
  initialVariant?: CricketVariant;
  onLegsChange: (legs: number) => void;
  onSetsChange: (sets: number) => void;
  onStart: (setup: CricketMatchSetup) => void | Promise<void>;
}

export function CricketSetupForm({
  legsToWin,
  setsToWin,
  initialVariant = "classic",
  onLegsChange,
  onSetsChange,
  onStart,
}: CricketSetupFormProps) {
  const [variant, setVariant] = useState<CricketVariant>(initialVariant);
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
  });

  const buildSetup = (starterIndex?: number): CricketMatchSetup => ({
    variant,
    legsToWin,
    setsToWin,
    teamsEnabled: match.teamsEnabled,
    teamNames: match.teamNames,
    startingPlayerRule: match.startingPlayerRule,
    players: match.resolvedSlots,
    coinTossStarterIndex: starterIndex,
  });

  onCoinTossStartRef.current = (starterIndex) => {
    void onStart(buildSetup(starterIndex));
  };

  const handleStart = () => {
    match.beginStart((starterIndex) => onStart(buildSetup(starterIndex)));
  };

  return (
    <div className="setup-screen">
      <div className="setup-screen__scroll">
        <SettingsGroup title="Format">
          <SettingsRow label="Match Style">
            <SegmentedTabs
              className="format-variant-toggle"
              ariaLabel="Cricket variant"
              value={variant}
              onChange={setVariant}
              options={[
                { value: "classic", label: "Cricket" },
                { value: "tactics", label: "Tactics" },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Legs per set">
            <StepperControl value={legsToWin} min={1} max={7} onChange={onLegsChange} />
          </SettingsRow>
          <SettingsRow label="Sets to win">
            <StepperControl value={setsToWin} min={1} max={5} onChange={onSetsChange} />
          </SettingsRow>
        </SettingsGroup>

        {match.playersGroup}

        <SettingsGroup title="Rules">
          <SettingsRow
            label="Starting player"
            value={match.selectedStartingRule?.label ?? "Winner of previous leg"}
            chevron
            onPress={() => match.setStarterSheetOpen(true)}
          />
        </SettingsGroup>
      </div>

      <div className="setup-screen__footer">
        <TouchButton fullWidth size="xl" onClick={handleStart} disabled={!match.canStart}>
          Start Match
        </TouchButton>
      </div>

      {match.sheets}
    </div>
  );
}
