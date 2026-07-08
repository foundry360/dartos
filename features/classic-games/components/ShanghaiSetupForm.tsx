"use client";

import { useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  buildShanghaiTargetSequence,
  resolveShanghaiBullIncluded,
  SHANGHAI_DEFAULT_STARTING_SCORE,
  SHANGHAI_GAME_LENGTH_OPTIONS,
  SHANGHAI_MAX_NUMBER_ROUNDS,
  SHANGHAI_MIN_CUSTOM_ROUNDS,
  SHANGHAI_RULE_OPTIONS,
  SHANGHAI_WINNING_MODE_OPTIONS,
} from "@/features/classic-games/lib/shanghai-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  ShanghaiGameLengthPreset,
  ShanghaiMatchSetup,
  ShanghaiRule,
  ShanghaiWinningMode,
} from "@/types/shanghai";

interface ShanghaiSetupFormProps {
  onStart: (setup: ShanghaiMatchSetup) => void | Promise<void>;
}

export function ShanghaiSetupForm({ onStart }: ShanghaiSetupFormProps) {
  const [gameLengthPreset, setGameLengthPreset] = useState<ShanghaiGameLengthPreset>("full");
  const [customRoundCount, setCustomRoundCount] = useState(15);
  const [bullRoundIncluded, setBullRoundIncluded] = useState(true);
  const [shanghaiRule, setShanghaiRule] = useState<ShanghaiRule>("instant_win");
  const [winningMode, setWinningMode] = useState<ShanghaiWinningMode>("highest_score");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const resolvedBullIncluded = resolveShanghaiBullIncluded(gameLengthPreset, bullRoundIncluded);
  const targets = buildShanghaiTargetSequence(
    gameLengthPreset,
    customRoundCount,
    bullRoundIncluded,
  );
  const roundCount = targets.length;

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 1,
    maxPlayers: 4,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): ShanghaiMatchSetup => ({
    startingScore: SHANGHAI_DEFAULT_STARTING_SCORE,
    roundCount,
    gameLengthPreset,
    bullRoundIncluded: resolvedBullIncluded,
    shanghaiRule,
    winningMode,
    targets,
    teamsEnabled: false,
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
        <SettingsGroup title="Shanghai" backHref={CLASSIC_GAMES_HUB_PATH}>
          <SettingsRow className="settings-row--rule-toggle" label="Game length">
            <PillToggleGroup
              ariaLabel="Shanghai game length"
              layout="grid"
              options={SHANGHAI_GAME_LENGTH_OPTIONS}
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
            />
          </SettingsRow>

          {gameLengthPreset === "custom" ? (
            <SettingsRow label="Custom rounds">
              <StepperControl
                value={customRoundCount}
                min={SHANGHAI_MIN_CUSTOM_ROUNDS}
                max={SHANGHAI_MAX_NUMBER_ROUNDS}
                onChange={setCustomRoundCount}
              />
            </SettingsRow>
          ) : null}

          {gameLengthPreset !== "full" ? (
            <SettingsRow className="settings-row--rule-toggle" label="Bull round">
              <ToggleSwitch
                label="Include bull round"
                enabled={bullRoundIncluded}
                onChange={setBullRoundIncluded}
              />
            </SettingsRow>
          ) : null}

          <SettingsRow className="settings-row--rule-toggle" label="Shanghai rule">
            <PillToggleGroup
              ariaLabel="Shanghai rule"
              layout="grid"
              options={SHANGHAI_RULE_OPTIONS}
              value={shanghaiRule}
              onChange={setShanghaiRule}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Scoring mode">
            <PillToggleGroup
              ariaLabel="Shanghai scoring mode"
              layout="grid"
              options={SHANGHAI_WINNING_MODE_OPTIONS}
              value={winningMode}
              onChange={setWinningMode}
            />
          </SettingsRow>
        </SettingsGroup>

        {match.playersGroup}

        {match.resolvedSlots.length > 1 ? (
          <SettingsGroup>
            <SettingsRow
              label="Starting player"
              value={match.selectedStartingRule?.label ?? "Winner of previous leg"}
              chevron
              onPress={() => match.setStarterSheetOpen(true)}
            />
          </SettingsGroup>
        ) : null}
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
