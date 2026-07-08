"use client";

import { useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  buildHalveItTargetSequence,
  HALVE_IT_DEFAULT_STARTING_SCORE,
  HALVE_IT_GAME_LENGTH_OPTIONS,
  HALVE_IT_MAX_CUSTOM_ROUNDS,
  HALVE_IT_MAX_STARTING_SCORE,
  HALVE_IT_MIN_CUSTOM_ROUNDS,
  HALVE_IT_SCORING_MODE_OPTIONS,
  HALVE_IT_STANDARD_ROUNDS,
  HALVE_IT_TARGET_SEQUENCE_OPTIONS,
  resolveHalveItRoundCount,
} from "@/features/classic-games/lib/halve-it-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  HalveItGameLengthPreset,
  HalveItMatchSetup,
  HalveItScoringMode,
  HalveItTargetSequenceId,
} from "@/types/halve-it";

interface HalveItSetupFormProps {
  onStart: (setup: HalveItMatchSetup) => void | Promise<void>;
}

export function HalveItSetupForm({ onStart }: HalveItSetupFormProps) {
  const [startingScore, setStartingScore] = useState(HALVE_IT_DEFAULT_STARTING_SCORE);
  const [gameLengthPreset, setGameLengthPreset] = useState<HalveItGameLengthPreset>("standard");
  const [customRoundCount, setCustomRoundCount] = useState(HALVE_IT_STANDARD_ROUNDS);
  const [targetSequenceId, setTargetSequenceId] = useState<HalveItTargetSequenceId>("numbers");
  const [scoringMode, setScoringMode] = useState<HalveItScoringMode>("target_only");
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const roundCount = resolveHalveItRoundCount(gameLengthPreset, customRoundCount);
  const targets = buildHalveItTargetSequence(targetSequenceId, roundCount);

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 1,
    maxPlayers: 4,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): HalveItMatchSetup => ({
    startingScore,
    roundCount,
    targetSequenceId,
    scoringMode,
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
        <SettingsGroup
          title="Halve-It"
          backHref={CLASSIC_GAMES_HUB_PATH}
          footer="Hit the round target to add points. Miss the target entirely and your total is cut in half. Highest score after the final round wins."
        >
          <SettingsRow label="Starting score">
            <StepperControl
              value={startingScore}
              min={0}
              max={HALVE_IT_MAX_STARTING_SCORE}
              onChange={setStartingScore}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Game length">
            <PillToggleGroup
              ariaLabel="Halve-It game length"
              layout="grid"
              options={HALVE_IT_GAME_LENGTH_OPTIONS}
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
            />
          </SettingsRow>

          {gameLengthPreset === "custom" ? (
            <SettingsRow label="Custom rounds">
              <StepperControl
                value={customRoundCount}
                min={HALVE_IT_MIN_CUSTOM_ROUNDS}
                max={HALVE_IT_MAX_CUSTOM_ROUNDS}
                onChange={setCustomRoundCount}
              />
            </SettingsRow>
          ) : null}

          <SettingsRow className="settings-row--rule-toggle" label="Target sequence">
            <PillToggleGroup
              ariaLabel="Halve-It target sequence"
              layout="grid"
              options={HALVE_IT_TARGET_SEQUENCE_OPTIONS}
              value={targetSequenceId}
              onChange={setTargetSequenceId}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Scoring mode">
            <PillToggleGroup
              ariaLabel="Halve-It scoring mode"
              layout="grid"
              options={HALVE_IT_SCORING_MODE_OPTIONS}
              value={scoringMode}
              onChange={setScoringMode}
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
