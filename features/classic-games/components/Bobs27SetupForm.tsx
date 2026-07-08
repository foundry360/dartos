"use client";

import { useRef, useState } from "react";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { StepperControl } from "@/components/ui/StepperControl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  BOBS_27_DEFAULT_STARTING_SCORE,
  BOBS_27_GAME_LENGTH_OPTIONS,
  BOBS_27_MAX_CUSTOM_ROUNDS,
  BOBS_27_MAX_STARTING_SCORE,
  BOBS_27_MIN_CUSTOM_ROUNDS,
  BOBS_27_STANDARD_DOUBLES_BULL_ROUNDS,
  BOBS_27_TARGET_TYPE_OPTIONS,
  buildBobs27TargetSequence,
  getBobs27FullSequence,
  resolveBobs27RoundCount,
} from "@/features/classic-games/lib/bobs-27-config";
import { CLASSIC_GAMES_HUB_PATH } from "@/features/classic-games/lib/classic-games";
import { useMatchSetup } from "@/features/players/hooks/useMatchSetup";
import type {
  Bobs27GameLengthPreset,
  Bobs27MatchSetup,
  Bobs27TargetTypeId,
} from "@/types/bobs-27";

interface Bobs27SetupFormProps {
  onStart: (setup: Bobs27MatchSetup) => void | Promise<void>;
}

export function Bobs27SetupForm({ onStart }: Bobs27SetupFormProps) {
  const [startingScore, setStartingScore] = useState(BOBS_27_DEFAULT_STARTING_SCORE);
  const [gameLengthPreset, setGameLengthPreset] = useState<Bobs27GameLengthPreset>("standard");
  const [customRoundCount, setCustomRoundCount] = useState(BOBS_27_STANDARD_DOUBLES_BULL_ROUNDS);
  const [targetTypeId, setTargetTypeId] = useState<Bobs27TargetTypeId>("doubles_bull");
  const [eliminationEnabled, setEliminationEnabled] = useState(true);
  const onCoinTossStartRef = useRef<(starterIndex: number) => void>(() => {});

  const roundCount = resolveBobs27RoundCount(gameLengthPreset, targetTypeId, customRoundCount);
  const targets = buildBobs27TargetSequence(targetTypeId, roundCount);
  const maxCustomRounds = getBobs27FullSequence(targetTypeId).length;

  const match = useMatchSetup({
    onCoinTossStart: (starterIndex) => onCoinTossStartRef.current(starterIndex),
    minPlayers: 1,
    maxPlayers: 8,
    allowTeams: false,
  });

  const buildSetup = (starterIndex?: number): Bobs27MatchSetup => ({
    startingScore,
    roundCount,
    targetTypeId,
    eliminationEnabled,
    playerMode: match.resolvedSlots.length === 1 ? "solo" : "multiplayer",
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
          title="Bob's 27"
          backHref={CLASSIC_GAMES_HUB_PATH}
        >
          <SettingsRow label="Starting score">
            <StepperControl
              value={startingScore}
              min={1}
              max={BOBS_27_MAX_STARTING_SCORE}
              onChange={setStartingScore}
            />
          </SettingsRow>

          <SettingsRow className="settings-row--rule-toggle" label="Game length">
            <PillToggleGroup
              ariaLabel="Bob's 27 game length"
              layout="grid"
              options={BOBS_27_GAME_LENGTH_OPTIONS}
              value={gameLengthPreset}
              onChange={setGameLengthPreset}
            />
          </SettingsRow>

          {gameLengthPreset === "custom" ? (
            <SettingsRow label="Custom rounds">
              <StepperControl
                value={customRoundCount}
                min={BOBS_27_MIN_CUSTOM_ROUNDS}
                max={maxCustomRounds}
                onChange={setCustomRoundCount}
              />
            </SettingsRow>
          ) : null}

          <SettingsRow className="settings-row--rule-toggle" label="Target type">
            <PillToggleGroup
              ariaLabel="Bob's 27 target type"
              layout="grid"
              options={BOBS_27_TARGET_TYPE_OPTIONS}
              value={targetTypeId}
              onChange={setTargetTypeId}
            />
          </SettingsRow>

          <SettingsRow
            label="Elimination"
            hint="Score of 0 or below removes a player from the game."
          >
            <ToggleSwitch
              enabled={eliminationEnabled}
              onChange={setEliminationEnabled}
              label="Elimination"
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
