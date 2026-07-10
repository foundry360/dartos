"use client";

import { useRef, useState } from "react";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import {
  X01_GAME_TYPE_OPTIONS,
  parseX01GameTypeOptionValue,
  x01GameTypeToOptionValue,
} from "@/features/x01/lib/x01-game-options";
import { X01_IN_RULE_OPTIONS, X01_OUT_RULE_OPTIONS } from "@/features/x01/lib/x01-rules";
import type { X01GameType } from "@/lib/constants";
import type { X01MatchSetup } from "@/types/player-setup";
import type { X01InRule, X01OutRule } from "@/types/x01";

interface X01SetupFormProps {
  initialGameType?: X01GameType;
  legsToWin: number;
  setsToWin: number;
  onLegsChange: (legs: number) => void;
  onSetsChange: (sets: number) => void;
  onStart: (setup: X01MatchSetup) => void | Promise<void>;
}

export function X01SetupForm({
  initialGameType = 501,
  legsToWin,
  setsToWin,
  onLegsChange,
  onSetsChange,
  onStart,
}: X01SetupFormProps) {
  const [gameType, setGameType] = useState<X01GameType>(initialGameType);
  const [inRule, setInRule] = useState<X01InRule>("straight_in");
  const [outRule, setOutRule] = useState<X01OutRule>("double_out");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
  });

  const buildSetup = (starterIndex?: number): X01MatchSetup => ({
    gameType,
    legsToWin,
    setsToWin,
    teamsEnabled: match.teamsEnabled,
    teamNames: match.teamNames,
    startingPlayerRule: match.startingPlayerRule,
    inRule,
    outRule,
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
          <SettingsRow className="settings-row--rule-toggle" label="Game">
            <PillToggleGroup
              ariaLabel="X01 starting score"
              options={X01_GAME_TYPE_OPTIONS}
              value={x01GameTypeToOptionValue(gameType)}
              onChange={(value) => setGameType(parseX01GameTypeOptionValue(value))}
              layout="grid"
            />
          </SettingsRow>
          <SettingsRow label="Legs per set">
            <StepperControl value={legsToWin} min={1} max={7} onChange={onLegsChange} />
          </SettingsRow>
          <SettingsRow label="Sets to win">
            <StepperControl value={setsToWin} min={1} max={5} onChange={onSetsChange} />
          </SettingsRow>
          <SettingsRow className="settings-row--rule-toggle" label="In">
            <PillToggleGroup
              ariaLabel="X01 in rule"
              options={X01_IN_RULE_OPTIONS.map(({ value, label }) => ({ value, label }))}
              value={inRule}
              onChange={setInRule}
            />
          </SettingsRow>
          <SettingsRow className="settings-row--rule-toggle" label="Out">
            <PillToggleGroup
              ariaLabel="X01 out rule"
              options={X01_OUT_RULE_OPTIONS.map(({ value, label }) => ({ value, label }))}
              value={outRule}
              onChange={setOutRule}
            />
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
